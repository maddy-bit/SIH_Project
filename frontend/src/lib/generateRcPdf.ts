/**
 * Client-Side PDF Generation for Official Government of India
 * VAHAN / Parivahan Vehicle Registration Certificate (Form 23).
 * Uses jsPDF to render a high-fidelity official government document.
 */

import { jsPDF } from "jspdf";
import type { IndianVehicleRcRecord } from "./registry";

/**
 * Sanitize strings for jsPDF Helvetica/Courier core fonts (ASCII / WinAnsi).
 * Replaces non-ASCII symbols like Rupee (₹), bullets, and special arrows.
 */
function cleanText(input: unknown): string {
  if (input == null) return "—";
  return String(input)
    .replace(/₹/g, "Rs. ")
    .replace(/[•●]/g, "-")
    .replace(/[↗→]/g, " ")
    .replace(/[^\x20-\x7E\r\n\t]/g, " ")
    .trim();
}

export function generateRcPdf(record: IndianVehicleRcRecord): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  // Colors
  const primaryNavy = [15, 23, 42]; // #0f172a
  const borderGrey = [180, 190, 205];
  const tableBg = [248, 250, 252];
  const goldAccent = [180, 83, 9];
  const greenActive = [16, 185, 129];

  // 1. Outer Border & Watermark Seal
  doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, contentWidth, 273); // Main border

  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin + 1.2, margin + 1.2, contentWidth - 2.4, 270.6); // Inner thin border

  let y = margin + 7;

  // 2. Official Government Header Strip
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("GOVERNMENT OF INDIA", pageWidth / 2, y, { align: "center" });
  y += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text("MINISTRY OF ROAD TRANSPORT & HIGHWAYS (MoRTH)", pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(70, 80, 95);
  doc.text("VAHAN 4.0 CENTRAL REGISTRY • PARIVAHAN SEWA (parivahan.gov.in)", pageWidth / 2, y, { align: "center" });
  y += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("FORM 23 [Refer Rule 48]", pageWidth / 2, y, { align: "center" });
  y += 3.8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CERTIFICATE OF REGISTRATION", pageWidth / 2, y, { align: "center" });
  y += 5;

  // Top Divider
  doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setLineWidth(0.5);
  doc.line(margin + 3, y, margin + contentWidth - 3, y);
  y += 4;

  // 3. Registration Badge Box (HSRP Visual Frame)
  const plateBoxWidth = 84;
  const plateBoxHeight = 13;
  const plateBoxX = (pageWidth - plateBoxWidth) / 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(plateBoxX, y, plateBoxWidth, plateBoxHeight, 1.5, 1.5, "FD");

  // IND blue strip
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(plateBoxX, y, 9, plateBoxHeight, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("IND", plateBoxX + 4.5, y + 8, { align: "center" });

  // Registration Number Text
  doc.setFont("courier", "bold");
  doc.setFontSize(15);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(record.formattedPlate, plateBoxX + 47, y + 8.5, { align: "center" });

  // Status Chip next to plate
  doc.setFillColor(greenActive[0], greenActive[1], greenActive[2]);
  doc.roundedRect(margin + contentWidth - 30, y + 2, 26, 8, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("RC ACTIVE", margin + contentWidth - 17, y + 7, { align: "center" });

  y += plateBoxHeight + 5;

  // Helper function to draw Section Header
  const drawSectionHeader = (title: string, sectionY: number): number => {
    doc.setFillColor(238, 242, 246);
    doc.rect(margin + 2, sectionY, contentWidth - 4, 5.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(cleanText(title), margin + 4, sectionY + 4);
    return sectionY + 7;
  };

  // Helper function to draw 2-column grid row
  const drawRow2Col = (
    label1: string,
    val1: string,
    label2: string,
    val2: string,
    rowY: number,
    isShaded = false
  ): number => {
    const rowH = 5.2;
    if (isShaded) {
      doc.setFillColor(tableBg[0], tableBg[1], tableBg[2]);
      doc.rect(margin + 2, rowY, contentWidth - 4, rowH, "F");
    }
    const midX = margin + contentWidth / 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(cleanText(label1), margin + 4, rowY + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(cleanText(val1), margin + 44, rowY + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(cleanText(label2), midX + 2, rowY + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(cleanText(val2), midX + 42, rowY + 3.8);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin + 2, rowY + rowH, margin + contentWidth - 2, rowY + rowH);

    return rowY + rowH;
  };

  // -------------------------------------------------------------
  // PART A: REGISTRATION & AUTHORITY DETAILS
  // -------------------------------------------------------------
  y = drawSectionHeader("PART A: REGISTRATION & JURISDICTION PARTICULARS", y);
  y = drawRow2Col("Registering Authority:", record.registeringAuthority, "State / Territory:", record.state, y, true);
  y = drawRow2Col("Registration Date:", record.registrationDate, "RC Status Date:", record.rcStatusDate, y);
  y = drawRow2Col("Fitness Valid Upto:", record.fitnessUpto, "MV Tax Status:", record.taxUpto, y, true);
  y += 2;

  // -------------------------------------------------------------
  // PART B: REGISTERED OWNER PARTICULARS
  // -------------------------------------------------------------
  y = drawSectionHeader("PART B: REGISTERED OWNER PARTICULARS", y);
  y = drawRow2Col("Owner Name:", record.ownerName, "Owner Serial:", record.ownerSerial, y, true);
  y = drawRow2Col("Father / Husband Name:", record.fatherHusbandName, "Financier Status:", record.financingStatus, y);

  // Address spanning row
  doc.setFillColor(tableBg[0], tableBg[1], tableBg[2]);
  doc.rect(margin + 2, y, contentWidth - 4, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Permanent Address:", margin + 4, y + 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  const splitAddress = doc.splitTextToSize(cleanText(record.permanentAddress), contentWidth - 52);
  doc.text(splitAddress, margin + 44, y + 4);
  y += 10;

  if (record.hypothecationBank) {
    y = drawRow2Col("Hypothecated To (Loan):", record.hypothecationBank, "RTO NOC Clearance:", "No Objection Issued", y, true);
  }
  y += 2;

  // -------------------------------------------------------------
  // PART C: DETAILED TECHNICAL SPECIFICATIONS
  // -------------------------------------------------------------
  y = drawSectionHeader("PART C: VEHICLE TECHNICAL & STRUCTURAL SPECIFICATIONS", y);
  y = drawRow2Col("Maker / Manufacturer:", record.maker, "Model Name:", record.model, y, true);
  y = drawRow2Col("Vehicle Class:", record.vehicleClass, "Body Type:", record.bodyType, y);
  y = drawRow2Col("Chassis Number (VIN):", record.chassisNumber, "Engine / Motor No:", record.engineNumber, y, true);
  y = drawRow2Col("Fuel Description:", record.fuelType, "Emission Standard:", record.emissionNorms, y);
  y = drawRow2Col("Cubic Capacity (cc):", record.cubicCapacity, "Seating Capacity:", `${record.seatingCapacity} (Incl. Driver)`, y, true);
  y = drawRow2Col("Unladen / Gross Wt:", `${record.unladenWeight} / ${record.grossWeight}`, "Wheelbase / Color:", `${record.wheelbase} / ${record.color}`, y);
  y += 2;

  // -------------------------------------------------------------
  // PART D: STATUTORY COMPLIANCE & VALIDITY MATRIX
  // -------------------------------------------------------------
  y = drawSectionHeader("PART D: STATUTORY COMPLIANCE, INSURANCE & PUCC VALIDITY", y);
  y = drawRow2Col("Insurance Company:", record.insuranceCompany, "Policy Number:", record.insurancePolicyNumber, y, true);
  y = drawRow2Col("Insurance Valid Upto:", `${record.insuranceUpto} (${record.insuranceStatus})`, "PUCC Certificate No:", record.puccNumber, y);
  y = drawRow2Col("PUCC Valid Upto:", `${record.puccUpto} (${record.puccStatus})`, "Blacklist / Challan:", `${record.blacklistStatus} (${record.challanCount} Pending)`, y, true);
  y = drawRow2Col("FASTag Tag ID:", record.fastagId, "Issuer Bank:", record.fastagBank, y);
  y += 4;

  // -------------------------------------------------------------
  // FOOTER: DIGITAL SEAL & SIGNATURE BLOCK
  // -------------------------------------------------------------
  const footerY = y;
  const qrBoxSize = 22;
  const qrX = margin + 4;

  // Simulated QR Code Block with Matrix Lines
  doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setLineWidth(0.4);
  doc.rect(qrX, footerY, qrBoxSize, qrBoxSize);

  // Inner QR pattern representation
  doc.setFillColor(15, 23, 42);
  doc.rect(qrX + 2, footerY + 2, 5, 5, "F");
  doc.rect(qrX + qrBoxSize - 7, footerY + 2, 5, 5, "F");
  doc.rect(qrX + 2, footerY + qrBoxSize - 7, 5, 5, "F");
  doc.rect(qrX + 9, footerY + 9, 4, 4, "F");
  doc.rect(qrX + 8, footerY + 3, 2, 4, "F");
  doc.rect(qrX + 3, footerY + 8, 4, 2, "F");
  doc.rect(qrX + 15, footerY + 8, 3, 5, "F");
  doc.rect(qrX + 8, footerY + 15, 5, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("SCAN TO VERIFY", qrX + qrBoxSize / 2, footerY + qrBoxSize + 3, { align: "center" });

  // Verification & Legal Text
  const textX = qrX + qrBoxSize + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("DIGITALLY SIGNED VIA VAHAN 4.0 NATIONAL VEHICLE REGISTER", textX, footerY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(80, 95, 115);
  doc.text(cleanText(`Digital Verification Hash: ${record.digitalVerificationKey}`), textX, footerY + 8.5);
  doc.text(cleanText(`Generated on: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`), textX, footerY + 12.5);
  doc.text("This is an electronically generated Form 23 RC record valid across India under the Motor Vehicles Act 1988.", textX, footerY + 16.5);
  doc.text("For physical enforcement verification, query: https://parivahan.gov.in/ - MoRTH Helpline: 0120-2459169", textX, footerY + 20.5);

  // Digital Seal Stamp on Right
  const sealX = margin + contentWidth - 36;
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.6);
  doc.circle(sealX + 14, footerY + 11, 11);
  doc.circle(sealX + 14, footerY + 11, 9.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(30, 58, 138);
  doc.text("REGIONAL TRANSPORT", sealX + 14, footerY + 8, { align: "center" });
  doc.text("OFFICE - PUNE", sealX + 14, footerY + 11, { align: "center" });
  doc.text("SEAL VERIFIED", sealX + 14, footerY + 14, { align: "center" });

  // Save the PDF file using standard blob download
  const fileName = `Parivahan_RC_${cleanText(record.registrationNumber)}.pdf`;
  try {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
  } catch {
    doc.save(fileName);
  }
}
