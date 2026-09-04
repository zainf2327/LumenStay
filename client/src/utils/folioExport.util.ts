import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface FolioExportData {
  confirmationCode: string;
  propertyName?: string | null;
  propertyAddress?: string | null;
  propertyPhone?: string | null;
  guestName?: string | null;
  roomNumber?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  charges: Array<{
    id?: string;
    category: string;
    description: string;
    amount: number;
    postedBy?: string | null;
    paymentRef?: string | null;
    createdAt?: string | null;
    postedAt?: string | null;
  }>;
  totalCharges: number;
  totalPayments: number;
  balanceDue: number;
}

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const cleanDescription = (desc: string): string => {
  if (!desc) return '';
  if (desc.includes('pi_') || desc.includes('Stripe Live Payment') || desc.includes('Settlement Payment')) {
    const matchLast4 = desc.match(/ending in (\d{4})/i);
    if (matchLast4) {
      return `Payment Received — Card ending in ${matchLast4[1]}`;
    }
    return 'Electronic Payment Received';
  }
  return desc;
};

const categoryNames: Record<string, string> = {
  room_rate: 'Room Charge',
  tax: 'Lodging Tax',
  resort_fee: 'Resort Fee',
  dining: 'Food & Beverage',
  minibar: 'In-Room Refreshment',
  parking: 'Valet Parking',
  spa: 'Spa & Wellness',
  late_checkout: 'Late Checkout Fee',
  adjustment: 'Manager Adjustment',
  payment: 'Payment Credit',
};

export const downloadFolioDocument = (data: FolioExportData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const generatedTimestamp = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Top Header Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(140, 98, 30); // Ochre / Muted Brass
  doc.text('LUMENSTAY BOUTIQUE HOSPITALITY GROUP', 14, 16);

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(28, 24, 21); // Charcoal #1C1815
  doc.text(data.propertyName || 'LumenStay Boutique Hotel', 14, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(115, 107, 99); // #736B63
  doc.text(data.propertyAddress || 'Aspen, Colorado', 14, 29);
  doc.text(`Tel: ${data.propertyPhone || '+1 (800) 555-0199'}  •  Tax ID: US-84-9102834`, 14, 33);

  // Right Aligned Invoice Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(28, 24, 21);
  doc.text('OFFICIAL FOLIO INVOICE', 198, 16, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(28, 24, 21);
  doc.text(`#${data.confirmationCode}`, 198, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(115, 107, 99);
  doc.text(`Issued: ${generatedTimestamp}`, 198, 27, { align: 'right' });

  // Horizontal divider
  doc.setDrawColor(229, 224, 216);
  doc.setLineWidth(0.4);
  doc.line(14, 37, 198, 37);

  // Guest & Itinerary Dossier Box
  doc.setFillColor(250, 248, 245); // #FAF8F5
  doc.roundedRect(14, 40, 184, 18, 2, 2, 'F');
  doc.setDrawColor(229, 224, 216);
  doc.roundedRect(14, 40, 184, 18, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setTextColor(115, 107, 99);
  doc.text('LEAD GUEST', 18, 45);
  doc.text('SUITE ALLOCATION', 68, 45);
  doc.text('CHECK-IN DATE', 118, 45);
  doc.text('CHECK-OUT DATE', 160, 45);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 24, 21);
  doc.text(data.guestName || 'Valued Guest', 18, 52);
  doc.text(`Room #${data.roomNumber || 'Assigned'}`, 68, 52);
  doc.text(data.checkInDate || '—', 118, 52);
  doc.text(data.checkOutDate || '—', 160, 52);

  // Table Data
  const tableRows = data.charges.map((c) => {
    const isPayment = c.amount < 0 || c.category === 'payment';
    const rawDate = c.createdAt || c.postedAt;
    const dateFormatted = formatDateTime(rawDate);
    const catLabel = categoryNames[c.category] || c.category;
    const descClean = cleanDescription(c.description);
    const descCell = `${catLabel} — ${descClean}`;
    const authorizerCell = c.paymentRef && !c.paymentRef.startsWith('ch_')
      ? `${c.postedBy || 'Online Prepayment'} (Ref: ${c.paymentRef})`
      : (c.postedBy || 'Online Prepayment');
    const amtFormatted = isPayment
      ? `-$${Math.abs(c.amount).toFixed(2)}`
      : `$${c.amount.toFixed(2)}`;

    return [dateFormatted, descCell, authorizerCell, amtFormatted];
  });

  autoTable(doc, {
    startY: 62,
    head: [['POSTED TIMESTAMP', 'CATEGORY & DESCRIPTION', 'AUTHORIZER / REF', 'AMOUNT ($ USD)']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [245, 243, 238],
      textColor: [28, 24, 21],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 35, 30],
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { cellWidth: 38, font: 'courier' },
      1: { cellWidth: 72 },
      2: { cellWidth: 44, textColor: [100, 95, 90] },
      3: { cellWidth: 30, halign: 'right', font: 'courier', fontStyle: 'bold' },
    },
    didDrawCell: (hookData) => {
      // Draw light horizontal separator
      if (hookData.section === 'body') {
        doc.setDrawColor(235, 230, 224);
        doc.setLineWidth(0.2);
        doc.line(hookData.cell.x, hookData.cell.y + hookData.cell.height, hookData.cell.x + hookData.cell.width, hookData.cell.y + hookData.cell.height);
      }
    },
  });

  // Calculate position after table
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Financial Summary Box
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(14, finalY, 184, 26, 2, 2, 'F');
  doc.setDrawColor(229, 224, 216);
  doc.roundedRect(14, finalY, 184, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 95, 90);
  doc.text('Total Lodging & Incidental Charges:', 20, finalY + 7);
  doc.setFont('courier', 'normal');
  doc.setTextColor(28, 24, 21);
  doc.text(`$${data.totalCharges.toFixed(2)} USD`, 190, finalY + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 95, 90);
  doc.text('Total Electronic Payments & Credits:', 20, finalY + 13);
  doc.setFont('courier', 'bold');
  doc.setTextColor(35, 100, 70); // Green
  doc.text(`-$${data.totalPayments.toFixed(2)} USD`, 190, finalY + 13, { align: 'right' });

  doc.setDrawColor(220, 215, 208);
  doc.line(20, finalY + 16.5, 192, finalY + 16.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(28, 24, 21);
  doc.text('Net Outstanding Balance Due:', 20, finalY + 22);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  if (data.balanceDue <= 0) {
    doc.setTextColor(35, 100, 70);
    doc.text('$0.00 USD  (Fully Settled & Closed)', 190, finalY + 22, { align: 'right' });
  } else {
    doc.setTextColor(140, 47, 34);
    doc.text(`$${data.balanceDue.toFixed(2)} USD`, 190, finalY + 22, { align: 'right' });
  }

  // Formal Signatures Block
  const sigY = finalY + 36;
  doc.setDrawColor(180, 175, 168);
  doc.line(20, sigY + 8, 85, sigY + 8);
  doc.line(125, sigY + 8, 190, sigY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(115, 107, 99);
  doc.text('GUEST SIGNATURE', 20, sigY + 12);
  doc.text('FRONT DESK CASHIER / AUDITOR', 125, sigY + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for choosing LumenStay. We look forward to welcoming you back.', 106, sigY + 22, { align: 'center' });

  // Save the genuine .pdf file directly
  doc.save(`LumenStay_Folio_${data.confirmationCode}.pdf`);
};
