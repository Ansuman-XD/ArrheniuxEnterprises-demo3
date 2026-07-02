import jsPDF from "jspdf";
import type { Order } from "./authStore";

const BRAND = "ARRHENIX";
const ADDRESS = "Niladri Vihar, Bhubaneswar, Odisha 751021";
const EMAIL = "info@arrhenix.com";
const PHONE = "+91 82603 68742";

export const downloadInvoice = (order: Order) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  let y = 40;

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(BRAND, 40, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(ADDRESS, 40, y + 14);
  doc.text(`${EMAIL} · ${PHONE}`, 40, y + 26);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", w - 40, y, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ARR-${order.id.slice(0, 8).toUpperCase()}`, w - 40, y + 14, { align: "right" });
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, w - 40, y + 26, { align: "right" });
  const expected = new Date(new Date(order.createdAt).getTime() + 10 * 86400000);
  doc.text(`Expected Delivery: ${expected.toLocaleDateString()}`, w - 40, y + 38, { align: "right" });

  y += 70;
  doc.setDrawColor(200);
  doc.line(40, y, w - 40, y);

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("BILL TO", 40, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const cust = order.customer || {};
  const lines = [
    cust.fullName || "Customer",
    cust.company || "",
    cust.email || "",
    cust.phone || "",
    [cust.address, cust.city, cust.state, cust.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);
  lines.forEach((l) => { doc.text(String(l), 40, y); y += 12; });

  y += 20;
  // Line item table
  doc.setFillColor(20);
  doc.rect(40, y, w - 80, 22, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PRODUCT", 48, y + 14);
  doc.text("QTY", w - 220, y + 14);
  doc.text("UNIT", w - 160, y + 14);
  doc.text("AMOUNT", w - 48, y + 14, { align: "right" });
  y += 30;
  doc.setTextColor(20);
  doc.setFont("helvetica", "normal");
  doc.text(`${order.productName}`, 48, y);
  if (order.productCode) doc.text(`Code: ${order.productCode}`, 48, y + 12);
  doc.text(`${order.qty}`, w - 220, y);
  doc.text(`₹${order.unitPrice}`, w - 160, y);
  doc.text(`₹${(order.unitPrice * order.qty).toLocaleString("en-IN")}`, w - 48, y, { align: "right" });
  y += 30;

  doc.setDrawColor(220);
  doc.line(40, y, w - 40, y);
  y += 16;

  const addRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9);
    doc.text(label, w - 200, y);
    doc.text(value, w - 48, y, { align: "right" });
    y += bold ? 18 : 14;
  };

  addRow("Subtotal", `₹${order.subtotal.toLocaleString("en-IN")}`);
  if (order.printCharge && order.printCharge > 0)
    addRow(`Printing (${order.printType || "Print"})`, `₹${order.printCharge.toLocaleString("en-IN")}`);
  if (order.discountAmt > 0)
    addRow(`Discount (${order.discountPct}%)`, `−₹${order.discountAmt.toLocaleString("en-IN")}`);
  addRow("Courier", `₹${order.courier.toLocaleString("en-IN")}`);
  addRow("GST (5%)", `₹${order.gst.toLocaleString("en-IN")}`);
  y += 4;
  doc.setDrawColor(20);
  doc.line(w - 220, y, w - 40, y);
  y += 14;
  addRow("Total", `₹${order.total.toLocaleString("en-IN")}`, true);
  addRow("Paid", `₹${order.paid.toLocaleString("en-IN")}`);
  const due = Math.max(0, order.total - order.paid);
  addRow("Balance", due === 0 ? "PAID" : `₹${due.toLocaleString("en-IN")}`, due > 0);

  y += 20;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120);
  doc.text("Thank you for your order.", 40, y);
  doc.text(`Payment Status: ${due === 0 ? "PAID" : "PENDING BALANCE"} · Ref: ${order.paymentRef || "—"}`, 40, y + 12);

  doc.save(`invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`);
};
