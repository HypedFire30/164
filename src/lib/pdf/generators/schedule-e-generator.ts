import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ScheduleEProperty {
  address: string;
  propertyType: 'Residential' | 'Commercial';
  purchasePrice: number;
  // Schedule E line items (annual amounts)
  rentsReceived: number;
  advertising: number;
  autoAndTravel: number;
  cleaningAndMaintenance: number;
  commissions: number;
  insurance: number;
  legalAndProfessional: number;
  managementFees: number;
  mortgageInterest: number;
  otherInterest: number;
  repairs: number;
  supplies: number;
  taxes: number;
  utilities: number;
  depreciation: number;
  other: number;
}

export interface ScheduleEData {
  taxYear: number;
  taxpayerName: string;
  taxpayerSSN: string;
  properties: ScheduleEProperty[];
}

const fmtCurrency = (n: number) =>
  n !== 0 ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '';

const calcTotalExpenses = (p: ScheduleEProperty) =>
  p.advertising + p.autoAndTravel + p.cleaningAndMaintenance + p.commissions +
  p.insurance + p.legalAndProfessional + p.managementFees + p.mortgageInterest +
  p.otherInterest + p.repairs + p.supplies + p.taxes + p.utilities + p.depreciation + p.other;

const calcNet = (p: ScheduleEProperty) => p.rentsReceived - calcTotalExpenses(p);

export async function generateScheduleEPDF(data: ScheduleEData): Promise<Uint8Array> {
  // Use landscape for the wide table
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.93, 0.93, 0.93);
  const navy = rgb(0.1, 0.2, 0.4);
  const medGray = rgb(0.5, 0.5, 0.5);
  const white = rgb(1, 1, 1);
  const successGreen = rgb(0.1, 0.5, 0.2);
  const lossRed = rgb(0.7, 0.1, 0.1);
  const headerBlue = rgb(0.85, 0.9, 0.98);

  // Landscape: 792w × 612h
  const PW = 792;
  const PH = 612;
  const MARGIN = 28;

  // Column layout for the expense table
  const cols = [
    { key: 'address', label: 'Property Address', w: 150 },
    { key: 'rentsReceived', label: 'Rents Rcvd', w: 52 },
    { key: 'advertising', label: 'Advert.', w: 36 },
    { key: 'autoAndTravel', label: 'Auto/\nTravel', w: 34 },
    { key: 'cleaningAndMaintenance', label: 'Clean/\nMaint.', w: 40 },
    { key: 'commissions', label: 'Comm.', w: 34 },
    { key: 'insurance', label: 'Insur.', w: 34 },
    { key: 'legalAndProfessional', label: 'Legal/\nProf.', w: 40 },
    { key: 'managementFees', label: 'Mgmt\nFees', w: 40 },
    { key: 'mortgageInterest', label: 'Mtg\nInt.', w: 40 },
    { key: 'repairs', label: 'Repairs', w: 40 },
    { key: 'taxes', label: 'Taxes', w: 40 },
    { key: 'utilities', label: 'Util.', w: 36 },
    { key: 'depreciation', label: 'Deprec.', w: 46 },
    { key: 'other', label: 'Other', w: 30 },
    { key: 'totalExpenses', label: 'Total Exp.', w: 56 },
    { key: 'netIncome', label: 'Net\nInc/Loss', w: 54 },
  ];

  const PROPS_PER_PAGE = 10; // rows per page
  const totalPages = Math.ceil(data.properties.length / PROPS_PER_PAGE);

  for (let pageNum = 0; pageNum < Math.max(totalPages, 1); pageNum++) {
    const page = pdfDoc.addPage([PW, PH]);
    const propsOnPage = data.properties.slice(pageNum * PROPS_PER_PAGE, (pageNum + 1) * PROPS_PER_PAGE);

    // ─── HEADER ─────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: PH - 42, width: PW, height: 42, color: navy });
    page.drawText('SCHEDULE E', { x: MARGIN, y: PH - 24, size: 14, font: boldFont, color: white });
    page.drawText('(Form 1040)', { x: MARGIN, y: PH - 36, size: 8, font, color: rgb(0.75, 0.85, 1) });
    page.drawText('Supplemental Income and Loss', { x: MARGIN + 90, y: PH - 24, size: 10, font: boldFont, color: white });
    page.drawText('Part I — Income or Loss From Rental Real Estate', { x: MARGIN + 90, y: PH - 36, size: 8, font, color: rgb(0.75, 0.85, 1) });
    page.drawText(`Tax Year ${data.taxYear}`, { x: PW - 100, y: PH - 26, size: 10, font: boldFont, color: white });
    if (totalPages > 1) {
      page.drawText(`Page ${pageNum + 1} of ${totalPages}`, { x: PW - 100, y: PH - 38, size: 7.5, font, color: rgb(0.7, 0.8, 0.95) });
    }

    // Taxpayer info row
    let curY = PH - 42;
    page.drawRectangle({ x: 0, y: curY - 18, width: PW, height: 18, color: lightGray });
    page.drawText(`Taxpayer: ${data.taxpayerName}`, { x: MARGIN, y: curY - 13, size: 8, font, color: darkGray });
    if (data.taxpayerSSN) {
      page.drawText(`SSN: ${data.taxpayerSSN}`, { x: MARGIN + 250, y: curY - 13, size: 8, font, color: darkGray });
    }
    curY -= 18;

    // ─── COLUMN HEADERS ─────────────────────────────────────────
    const HEADER_H = 28;
    let colX = MARGIN;
    page.drawRectangle({ x: MARGIN, y: curY - HEADER_H, width: PW - MARGIN * 2, height: HEADER_H, color: headerBlue });

    for (const col of cols) {
      page.drawRectangle({ x: colX, y: curY - HEADER_H, width: col.w, height: HEADER_H, color: headerBlue, borderColor: darkGray, borderWidth: 0.4 });
      // Multi-line header labels
      const lines = col.label.split('\n');
      lines.forEach((line, i) => {
        page.drawText(line, {
          x: colX + 2, y: curY - 11 - i * 9,
          size: 6.5, font: boldFont, color: navy,
        });
      });
      colX += col.w;
    }
    curY -= HEADER_H;

    // ─── PROPERTY ROWS ──────────────────────────────────────────
    const ROW_H = 18;
    for (let i = 0; i < propsOnPage.length; i++) {
      const p = propsOnPage[i];
      const rowBg = i % 2 === 0 ? white : rgb(0.97, 0.97, 0.99);
      const totalExp = calcTotalExpenses(p);
      const net = calcNet(p);

      const rowValues: Record<string, string> = {
        address: p.address.length > 22 ? p.address.slice(0, 20) + '…' : p.address,
        rentsReceived: fmtCurrency(p.rentsReceived),
        advertising: fmtCurrency(p.advertising),
        autoAndTravel: fmtCurrency(p.autoAndTravel),
        cleaningAndMaintenance: fmtCurrency(p.cleaningAndMaintenance),
        commissions: fmtCurrency(p.commissions),
        insurance: fmtCurrency(p.insurance),
        legalAndProfessional: fmtCurrency(p.legalAndProfessional),
        managementFees: fmtCurrency(p.managementFees),
        mortgageInterest: fmtCurrency(p.mortgageInterest),
        repairs: fmtCurrency(p.repairs),
        taxes: fmtCurrency(p.taxes),
        utilities: fmtCurrency(p.utilities),
        depreciation: fmtCurrency(p.depreciation),
        other: fmtCurrency(p.other),
        totalExpenses: fmtCurrency(totalExp),
        netIncome: fmtCurrency(Math.abs(net)),
      };

      colX = MARGIN;
      for (const col of cols) {
        page.drawRectangle({ x: colX, y: curY - ROW_H, width: col.w, height: ROW_H, color: rowBg, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.3 });
        const val = rowValues[col.key] || '';
        const isNet = col.key === 'netIncome';
        const textColor = isNet ? (net >= 0 ? successGreen : lossRed) : (col.key === 'address' ? darkGray : black);
        const prefix = isNet && net < 0 ? '(' : '';
        const suffix = isNet && net < 0 ? ')' : '';
        page.drawText(`${prefix}${val}${suffix}`, {
          x: colX + (col.key === 'address' ? 2 : 2),
          y: curY - ROW_H + 5,
          size: col.key === 'address' ? 7 : 7.5, font: isNet ? boldFont : font, color: textColor,
        });
        colX += col.w;
      }
      curY -= ROW_H;
    }

    // ─── TOTALS ROW (last page only) ─────────────────────────────
    if (pageNum === totalPages - 1) {
      const totRents = data.properties.reduce((s, p) => s + p.rentsReceived, 0);
      const totExp = data.properties.reduce((s, p) => s + calcTotalExpenses(p), 0);
      const totDeprec = data.properties.reduce((s, p) => s + p.depreciation, 0);
      const totNet = data.properties.reduce((s, p) => s + calcNet(p), 0);

      const totValues: Record<string, string> = {
        address: 'TOTALS',
        rentsReceived: fmtCurrency(totRents),
        advertising: '', autoAndTravel: '', cleaningAndMaintenance: '', commissions: '',
        insurance: '', legalAndProfessional: '', managementFees: '', mortgageInterest: '',
        repairs: '', taxes: '', utilities: '',
        depreciation: fmtCurrency(totDeprec),
        other: '',
        totalExpenses: fmtCurrency(totExp),
        netIncome: fmtCurrency(Math.abs(totNet)),
      };

      colX = MARGIN;
      for (const col of cols) {
        page.drawRectangle({ x: colX, y: curY - ROW_H, width: col.w, height: ROW_H, color: navy, borderColor: white, borderWidth: 0.3 });
        const val = totValues[col.key] || '';
        const isNet = col.key === 'netIncome';
        const prefix = isNet && totNet < 0 ? '(' : '';
        const suffix = isNet && totNet < 0 ? ')' : '';
        page.drawText(`${prefix}${val}${suffix}`, {
          x: colX + 2, y: curY - ROW_H + 5,
          size: col.key === 'address' ? 7 : 7.5, font: boldFont, color: white,
        });
        colX += col.w;
      }
      curY -= ROW_H;

      // ─── SUMMARY BOX ──────────────────────────────────────────
      curY -= 8;
      const SUM_H = 50;
      const summaryX = PW - MARGIN - 320;
      page.drawRectangle({ x: summaryX, y: curY - SUM_H, width: 320, height: SUM_H, color: lightGray, borderColor: navy, borderWidth: 1 });
      page.drawText('Summary', { x: summaryX + 6, y: curY - 12, size: 8, font: boldFont, color: navy });
      const netLabel = totNet >= 0 ? 'Net Rental Income' : 'Net Rental Loss';
      const summaryItems = [
        ['Total Rental Income', fmtCurrency(totRents)],
        ['Total Expenses', fmtCurrency(totExp)],
        ['Total Depreciation', fmtCurrency(totDeprec)],
        [netLabel, `${totNet < 0 ? '(' : ''}${fmtCurrency(Math.abs(totNet))}${totNet < 0 ? ')' : ''}`],
      ];
      summaryItems.forEach(([label, val], i) => {
        const sy = curY - 20 - i * 8;
        page.drawText(label + ':', { x: summaryX + 6, y: sy, size: 7.5, font, color: darkGray });
        const isNetRow = i === 3;
        page.drawText(val, {
          x: summaryX + 230, y: sy, size: 7.5,
          font: isNetRow ? boldFont : font,
          color: isNetRow ? (totNet >= 0 ? successGreen : lossRed) : black,
        });
      });

      // Disclaimer
      page.drawText('This document is for reference purposes. Consult a tax professional for official filing.', {
        x: MARGIN, y: 18, size: 6.5, font, color: medGray,
      });
      page.drawText(`Schedule E (Form 1040) — Tax Year ${data.taxYear}`, {
        x: PW - 200, y: 18, size: 6.5, font, color: medGray,
      });
    }
  }

  return pdfDoc.save();
}

export function downloadScheduleEPDF(pdfBytes: Uint8Array, taxYear: number) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ScheduleE-${taxYear}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
