import PDFDocument from 'pdfkit';
import { IInvoice } from '../models/Invoice';

export const generateInvoicePDF = (invoice: IInvoice & {
  clientId: { name: string; company: string; email: string };
}): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primary = '#6366f1';  // indigo-500
    const dark = '#0f172a';     // slate-950
    const gray = '#64748b';     // slate-500
    const light = '#f1f5f9';    // slate-100

    // ─── Header Band ────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 120).fill(dark);

    doc.fillColor('#ffffff')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('FreelanceFlow', 50, 35);

    doc.fillColor(primary)
      .fontSize(11)
      .font('Helvetica')
      .text('AI-Powered Freelance Management', 50, 68);

    // Invoice label (right side)
    doc.fillColor('#ffffff')
      .fontSize(32)
      .font('Helvetica-Bold')
      .text('INVOICE', 0, 35, { align: 'right' });

    doc.fillColor(primary)
      .fontSize(12)
      .font('Helvetica')
      .text(invoice.invoiceNumber, 0, 75, { align: 'right' });

    // ─── Bill To / Dates Section ─────────────────────────────────────────────
    const y = 145;

    doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, y);
    doc.fillColor(dark)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(invoice.clientId.company || invoice.clientId.name, 50, y + 14);
    doc.fillColor(gray)
      .fontSize(10)
      .font('Helvetica')
      .text(invoice.clientId.name, 50, y + 30)
      .text(invoice.clientId.email, 50, y + 44);

    // Right column: dates
    const rightX = 350;
    const labelW = 90;

    const dateRow = (label: string, value: string, rowY: number) => {
      doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text(label, rightX, rowY);
      doc.fillColor(dark).fontSize(10).font('Helvetica').text(value, rightX + labelW, rowY);
    };

    const fmt = (d: Date) => new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    dateRow('ISSUE DATE', fmt(invoice.createdAt), y);
    dateRow('DUE DATE', fmt(invoice.dueDate), y + 18);
    dateRow('STATUS', invoice.status.toUpperCase(), y + 36);

    // ─── Status Badge ─────────────────────────────────────────────────────────
    const statusColor: Record<string, string> = {
      Draft: '#94a3b8',
      Sent: '#6366f1',
      Paid: '#10b981',
      Overdue: '#ef4444',
    };
    const badgeColor = statusColor[invoice.status] || gray;
    const badgeX = rightX + labelW;
    doc.rect(badgeX, y + 33, 60, 16).fill(badgeColor);
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
      .text(invoice.status.toUpperCase(), badgeX + 4, y + 37, { width: 52, align: 'center' });

    // ─── Line Items Table ─────────────────────────────────────────────────────
    const tableY = y + 90;
    const colX = { desc: 50, qty: 310, rate: 380, amount: 470 };
    const tableWidth = doc.page.width - 100;

    // Table header
    doc.rect(50, tableY, tableWidth, 24).fill(dark);
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('DESCRIPTION', colX.desc + 6, tableY + 8);
    doc.text('QTY', colX.qty, tableY + 8, { width: 60, align: 'right' });
    doc.text('RATE', colX.rate, tableY + 8, { width: 70, align: 'right' });
    doc.text('AMOUNT', colX.amount, tableY + 8, { width: 75, align: 'right' });

    let rowY = tableY + 24;
    invoice.lineItems.forEach((item, idx) => {
      if (idx % 2 === 0) doc.rect(50, rowY, tableWidth, 22).fill(light);
      doc.fillColor(dark).fontSize(10).font('Helvetica');
      doc.text(item.description, colX.desc + 6, rowY + 6, { width: 240, ellipsis: true });
      doc.text(String(item.quantity), colX.qty, rowY + 6, { width: 60, align: 'right' });
      doc.text(`$${item.rate.toFixed(2)}`, colX.rate, rowY + 6, { width: 70, align: 'right' });
      doc.text(`$${item.amount.toFixed(2)}`, colX.amount, rowY + 6, { width: 75, align: 'right' });
      rowY += 22;
    });

    // ─── Totals Section ───────────────────────────────────────────────────────
    const totalsY = rowY + 16;
    const totalsX = 380;

    const totalRow = (label: string, value: string, bold = false, rowY2: number) => {
      doc.fillColor(gray).fontSize(10).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(label, totalsX, rowY2);
      doc.fillColor(bold ? primary : dark).fontSize(10).font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(value, totalsX + 90, rowY2, { width: 65, align: 'right' });
    };

    doc.moveTo(380, totalsY - 4).lineTo(doc.page.width - 50, totalsY - 4).stroke(light);
    totalRow('Subtotal', `$${invoice.subtotal.toFixed(2)}`, false, totalsY);
    totalRow(`Tax (${invoice.taxRate}%)`, `$${invoice.taxAmount.toFixed(2)}`, false, totalsY + 18);
    doc.rect(totalsX - 4, totalsY + 38, doc.page.width - 50 - totalsX + 4, 26).fill(primary);
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold')
      .text('TOTAL DUE', totalsX + 2, totalsY + 45)
      .text(`$${invoice.total.toFixed(2)}`, totalsX + 90, totalsY + 45, { width: 65, align: 'right' });

    // ─── Notes Footer ─────────────────────────────────────────────────────────
    if (invoice.notes) {
      const notesY = totalsY + 80;
      doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('NOTES', 50, notesY);
      doc.fillColor(dark).fontSize(10).font('Helvetica').text(invoice.notes, 50, notesY + 14, { width: 400 });
    }

    // Footer line
    const footerY = doc.page.height - 60;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).stroke(light);
    doc.fillColor(gray).fontSize(8).font('Helvetica')
      .text('Generated by FreelanceFlow · freelanceflow.app', 50, footerY + 10, { align: 'center' });

    doc.end();
  });
};
