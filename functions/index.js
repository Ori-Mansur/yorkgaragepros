/**
 * York Garage Pros - auto-text new leads through SMSGate (api.sms-gate.app).
 *
 * Fires when a document is created in quote_requests / quote_request,
 * bookings or contacts. For each new lead it:
 *   1. texts the customer a short confirmation    -> autoTextSent: true|false
 *   2. texts the owner a lead alert               -> ownerAlertSent: true|false
 * Link-spam leads are skipped entirely (both fields written as false).
 *
 * Secrets (never in code):
 *   firebase functions:secrets:set SMSGATE_USERNAME
 *   firebase functions:secrets:set SMSGATE_PASSWORD
 *   firebase functions:secrets:set OWNER_PHONE
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

const SMSGATE_USERNAME = defineSecret("SMSGATE_USERNAME");
const SMSGATE_PASSWORD = defineSecret("SMSGATE_PASSWORD");
const OWNER_PHONE = defineSecret("OWNER_PHONE");

const SMSGATE_URL = "https://api.sms-gate.app/3rdparty/v1/messages";

const LEAD_TYPES = {
  quote_requests: "quote request",
  quote_request: "quote request",
  bookings: "booking",
  contacts: "contact",
};

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
  const intro = `${hi} this is Ori with York Garage Pros.`;
  const outro = "feel free to text me any details or photos in the meantime.";
  const generic =
    collection === "contacts" || !service || service === "general inquiry";

  if (generic) {
    return `${intro} Thanks for reaching out. I'll be in touch shortly, and ${outro}`;
  }
  if (collection === "bookings") {
    return `${intro} Thanks for your booking request. I'll be in touch shortly to confirm the time, and ${outro}`;
  }
  return `${intro} Thanks for reaching out about your ${service}. I'll be in touch shortly, and ${outro}`;
}

/** "New booking: John, broken spring, +19055550123" - empty fields left out. */
function buildOwnerAlert(collection, name, service, phone) {
  const type = LEAD_TYPES[collection] || "lead";
  const details = [name, service, phone].filter(Boolean).join(", ");
  return details ? `New ${type}: ${details}` : `New ${type}`;
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

/** Customer confirmation text. Returns true if sent. */
async function textCustomer(ctx, phone, text) {
  try {
    const response = await sendSms(phone, text);
    logger.info("Auto-text sent", { ...ctx, phone, text, response });
    return true;
  } catch (err) {
    logger.error("Auto-text failed", { ...ctx, phone, text, error: err.message });
    return false;
  }
}

/** Lead alert to the owner's phone. Returns true if sent. */
async function alertOwner(ctx, text) {
  const ownerPhone = normalizePhone(OWNER_PHONE.value());
  if (!ownerPhone) {
    logger.error("Owner alert failed: OWNER_PHONE secret is not a valid 10/11-digit number", ctx);
    return false;
  }
  try {
    const response = await sendSms(ownerPhone, text);
    logger.info("Owner alert sent", { ...ctx, text, response });
    return true;
  } catch (err) {
    logger.error("Owner alert failed", { ...ctx, text, error: err.message });
    return false;
  }
}

async function handleNewLead(event, collection) {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() || {};
  const ctx = { collection, docId: event.params.docId };

  // At-least-once delivery: never text the same lead twice.
  if (typeof data.autoTextSent === "boolean" || typeof data.ownerAlertSent === "boolean") {
    logger.info("Already processed, skipping", ctx);
    return;
  }

  const writeResult = (fields) =>
    snap.ref.update(fields).catch((err) =>
      logger.error("Failed to write result fields", { ...ctx, fields, error: err.message })
    );

  const name = pick(data.name, data.fullName);
  const rawPhone = pick(data.phone);
  const rawService = pick(data.service);
  const notes = pick(data.notes, data.message);

  // 1. Spam guard: any link in the fields we read -> skip everything.
  const linkField = Object.entries({ name, phone: rawPhone, service: rawService, notes })
    .find(([, v]) => LINK_RE.test(v));
  if (linkField) {
    logger.warn("Skipped: link detected", { ...ctx, field: linkField[0], value: linkField[1] });
    await writeResult({ autoTextSent: false, ownerAlertSent: false });
    return;
  }

  const phone = normalizePhone(rawPhone);
  const service = serviceToWords(rawService);

  // 2. Customer text (only with a valid phone).
  let autoTextSent = false;
  if (phone) {
    autoTextSent = await textCustomer(ctx, phone, buildMessage(collection, name, service));
  } else {
    logger.warn("Customer text skipped: invalid phone", { ...ctx, phone: rawPhone });
  }

  // 3. Owner alert (sent even if the customer's phone was invalid).
  const ownerAlertSent = await alertOwner(
    ctx,
    buildOwnerAlert(collection, name, service, phone || rawPhone)
  );

  await writeResult({ autoTextSent, ownerAlertSent });
}

const opts = (collection) => ({
  document: `${collection}/{docId}`,
  region: "northamerica-northeast2", // must match the Firestore database location
  secrets: [SMSGATE_USERNAME, SMSGATE_PASSWORD, OWNER_PHONE],
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
exports._test = { normalizePhone, serviceToWords, buildMessage, buildOwnerAlert, LINK_RE };
