/**
 * York Garage Pros - auto-text new leads through SMSGate (api.sms-gate.app).
 *
 * Fires when a document is created in quote_requests / quote_request,
 * bookings or contacts. Sends a short confirmation SMS to the lead and writes
 * `autoTextSent: true|false` back to the document.
 *
 * Secrets (never in code):
 *   firebase functions:secrets:set SMSGATE_USERNAME
 *   firebase functions:secrets:set SMSGATE_PASSWORD
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

const SMSGATE_USERNAME = defineSecret("SMSGATE_USERNAME");
const SMSGATE_PASSWORD = defineSecret("SMSGATE_PASSWORD");

const SMSGATE_URL = "https://api.sms-gate.app/3rdparty/v1/messages";

// http(s)://, www., or a bare domain like example.com / spam.net
const LINK_RE =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|org|net|ca|io|co|info|biz|xyz|ru|us|top|site|online|shop)\b)/i;

/** First non-empty string among the given values. */
function pick(...values) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Digits only -> E.164 (+1XXXXXXXXXX), or null if it isn't a NANP number. */
function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/** "Door_Repair" -> "door repair", "BrokenSpring" -> "broken spring". */
function serviceToWords(code) {
  return String(code || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildMessage(collection, name, service) {
  const hi = name ? `Hi ${name},` : "Hi,";
  const intro = `${hi} this is Ori from York Garage Pros.`;
  const generic =
    collection === "contacts" || !service || service === "general inquiry";

  if (generic) return `${intro} Got your message, I'll get back to you shortly.`;
  if (collection === "bookings") {
    return `${intro} Got your booking request, I'll confirm the time with you shortly.`;
  }
  const article = /^[aeiou]/.test(service) ? "an" : "a";
  return `${intro} Got your request about ${article} ${service}, I'll text you shortly.`;
}

async function sendSms(phone, text) {
  const auth = Buffer.from(
    `${SMSGATE_USERNAME.value()}:${SMSGATE_PASSWORD.value()}`
  ).toString("base64");

  const res = await fetch(SMSGATE_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ textMessage: { text }, phoneNumbers: [phone] }),
    signal: AbortSignal.timeout(20000),
  });

  const body = await res.text();
  if (!res.ok) throw new Error(`SMSGate HTTP ${res.status}: ${body}`);
  return body;
}

async function handleNewLead(event, collection) {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() || {};
  const id = event.params.docId;
  const ctx = { collection, docId: id };

  // At-least-once delivery: never text the same lead twice.
  if (typeof data.autoTextSent === "boolean") {
    logger.info("Already processed, skipping", ctx);
    return;
  }

  const markSent = (sent) =>
    snap.ref.update({ autoTextSent: sent }).catch((err) =>
      logger.error("Failed to write autoTextSent", { ...ctx, error: err.message })
    );

  const name = pick(data.name, data.fullName);
  const rawPhone = pick(data.phone);
  const rawService = pick(data.service);
  const notes = pick(data.notes, data.message);

  // 1. Spam guard: any link in the fields we read -> skip.
  const linkField = Object.entries({ name, phone: rawPhone, service: rawService, notes })
    .find(([, v]) => LINK_RE.test(v));
  if (linkField) {
    logger.warn("Skipped: link detected", { ...ctx, field: linkField[0], value: linkField[1] });
    await markSent(false);
    return;
  }

  // 2. Phone.
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    logger.warn("Skipped: invalid phone", { ...ctx, phone: rawPhone });
    await markSent(false);
    return;
  }

  // 3. Message.
  const text = buildMessage(collection, name, serviceToWords(rawService));

  // 4. Send.
  try {
    const response = await sendSms(phone, text);
    logger.info("Auto-text sent", { ...ctx, phone, text, response });
    await markSent(true);
  } catch (err) {
    logger.error("Auto-text failed", { ...ctx, phone, text, error: err.message });
    await markSent(false);
  }
}

const opts = (collection) => ({
  document: `${collection}/{docId}`,
  region: "northamerica-northeast2", // must match the Firestore database location
  secrets: [SMSGATE_USERNAME, SMSGATE_PASSWORD],
  retry: false,
  maxInstances: 5,
});

const trigger = (collection) =>
  onDocumentCreated(opts(collection), (event) => handleNewLead(event, collection));

// The website's QuickQuote form writes to "quote_requests"; "quote_request" is
// covered too in case anything writes the singular name.
exports.autoTextQuoteRequests = trigger("quote_requests");
exports.autoTextQuoteRequest = trigger("quote_request");
exports.autoTextBookings = trigger("bookings");
exports.autoTextContacts = trigger("contacts");

// Exported for local testing.
exports._test = { normalizePhone, serviceToWords, buildMessage, LINK_RE };
