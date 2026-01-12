import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveDocToCloud } from "./dbDocService";
import "../utils/Montserrat-Bold.js";
import "../utils/Montserrat.js";

const business = {
  phone: "(905) 960-9947",
  email: "info@yorkgaragepros.com",
  website: "yorkgaragepros.com",
  address: "Newmarket, ON L3X 2B1",
};

/**
 * Helper to convert local assets to Base64 for jsPDF
 */
const getLogoBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
  });
};

/**
 * Main Service: Generates PDF, Saves to Firebase, Returns URL
 */
export const generateAndUploadPDF = async (formData, totals) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const primaryAmber = [245, 158, 11];
  const deepSlate = [30, 41, 59];

  // 1. HEADER & LOGO
  doc.setFillColor(deepSlate[0], deepSlate[1], deepSlate[2]);
  doc.rect(0, 0, 600, 120, "F");
  doc.setFillColor(primaryAmber[0], primaryAmber[1], primaryAmber[2]);
  doc.rect(0, 120, 600, 5, "F");

  const logoData = await getLogoBase64("/logoonly-removebg-preview.png");
  if (logoData) {
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(38, 23, 64, 64, 8, 8, "F");
    doc.addImage(logoData, "PNG", 40, 25, 60, 60);
  }

  // 2. FONTS & COMPANY INFO
  try {
    doc.setFont("Montserrat-Bold", "bold");
  } catch (e) {
    doc.setFont("Montserrat", "bold");
  }

  const textStartX = logoData ? 115 : 40;
  doc.setFontSize(20).setTextColor(primaryAmber[0], primaryAmber[1], primaryAmber[2]);
  doc.text("YORK GARAGE PROS", textStartX, 50);

  doc.setFontSize(8).setTextColor(200, 200, 200);
  doc.text(`${business.website} | ${business.email}`, textStartX, 63);
  doc.text(`${business.phone} | ${business.address}`, textStartX, 73);

  doc.setFontSize(24).setTextColor(255, 255, 255);
  doc.text(formData.type, 550, 75, { align: "right" });

  // 3. CLIENT DETAILS
  let clientY = 160;
  let clientHeader = formData.type === "RECEIPT" ? "CUSTOMER DETAILS:" : 
                     formData.type === "QUOTE" ? "PROPOSAL FOR:" : "BILL TO:";

  doc.setTextColor(deepSlate[0]).setFontSize(10).setFont("Montserrat-Bold", "bold");
  doc.text(clientHeader, 40, clientY);

  doc.setFont("Montserrat-Bold", "bold").setFontSize(11).setTextColor(0);
  doc.text(formData.clientName || "Valued Customer", 40, clientY + 15);

  doc.setFont("Montserrat", "normal").setFontSize(9).setTextColor(80);
  const clientLines = [formData.address, formData.phone, formData.email].filter(Boolean);
  doc.text(clientLines, 40, clientY + 30);

  // Right Side: Doc Info
  const infoX = 420;
  doc.setFont("Montserrat-Bold", "bold").setFontSize(10).setTextColor(deepSlate[0]);
  doc.text("DOCUMENT INFO:", infoX, clientY);
  doc.setFont("Montserrat", "normal").setFontSize(9).setTextColor(80);
  doc.text(`${formData.type} #: ${formData.number || "---"}`, infoX, clientY + 15);
  doc.text(`Date: ${formData.issueDate}`, infoX, clientY + 30);

  if (formData.type !== "RECEIPT" && formData.dueDate) {
    const label = formData.type === "QUOTE" ? "Valid Until" : "Due Date";
    doc.text(`${label}: ${formData.dueDate}`, infoX, clientY + 45);
  } else if (formData.type === "RECEIPT") {
    doc.setFont("Montserrat-Bold", "bold").setTextColor(34, 197, 94);
    doc.text(`PAID VIA: ${formData.paymentMethod.toUpperCase()}`, infoX, clientY + 45);
  }

  // 4. THE TABLE
  autoTable(doc, {
    startY: 300,
    head: [["TITLE", "DESCRIPTION", "QTY", "PRICE", "TOTAL"]],
    body: formData.items.map((i) => [
      i.title,
      i.desc,
      i.qty,
      `$${Number(i.price).toFixed(2)}`,
      `$${(i.qty * i.price).toFixed(2)}`,
    ]),
    theme: "striped",
    headStyles: { fillColor: deepSlate, font: "Montserrat-Bold", fontStyle: "bold" },
    styles: { font: "Montserrat", fontSize: 9 },
  });

  // 5. TOTALS SECTION
  const pageHeight = doc.internal.pageSize.height;
  let finalY = Math.max(doc.lastAutoTable.finalY + 30, pageHeight / 2 + 100);

  doc.setFont("Montserrat", "normal").setFontSize(10).setTextColor(80);
  doc.text("Subtotal:", 365, finalY + 10);
  doc.text(`$${totals.subtotal.toFixed(2)}`, 550, finalY + 10, { align: "right" });

  doc.setFont("Montserrat-Bold", "bold").setFontSize(10).setTextColor(80);
  doc.text(`Discount (${formData.promoLabel || "Promo"}):`, 365, finalY + 25);
  doc.text(`-$${totals.discount.toFixed(2)}`, 550, finalY + 25, { align: "right" });

  doc.setFillColor(primaryAmber[0], primaryAmber[1], primaryAmber[2]);
  doc.roundedRect(350, finalY + 45, 210, 45, 8, 8, "F");
  doc.setFont("Montserrat-Bold", "bold").setFontSize(12).setTextColor(deepSlate[0]);
  
  const totalLabel = formData.type === "RECEIPT" ? "TOTAL PAID" : 
                     formData.type === "QUOTE" ? "ESTIMATED TOTAL" : "TOTAL DUE";
  doc.text(totalLabel, 365, finalY + 73);
  doc.text(`$${totals.grandTotal.toFixed(2)}`, 550, finalY + 73, { align: "right" });

  // 6. NOTES
  if (formData.notes) {
    const notesY = finalY + 180;
    doc.setFont("Montserrat-Bold", "bold").setFontSize(10).setTextColor(deepSlate[0]);
    doc.text("NOTES & REMARKS:", 40, notesY);
    doc.setFont("Montserrat", "normal").setFontSize(9).setTextColor(80);
    doc.text(doc.splitTextToSize(formData.notes, 520), 40, notesY + 15);
  }

  // 7. FILE OPERATIONS
  const fileName = `${formData.type}_${formData.number || "Draft"}`;
  doc.save(`${fileName}.pdf`);

  // 8. CLOUD UPLOAD
  const pdfBlob = doc.output("blob");
  const uploadData = { ...formData, grandTotal: totals.grandTotal, discountValue: totals.discount };
  return await saveDocToCloud(uploadData, pdfBlob, fileName);
};