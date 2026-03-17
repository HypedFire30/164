import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface RentRollUnit {
  unitNumber: string;
  unitType: string;
  squareFootage: number;
  tenantName: string;
  leaseStart: string;
  leaseEnd: string;
  marketRent: number;
  actualRent: number;
  status: 'Current' | 'Past Due' | 'Vacant' | 'Notice';
  notes?: string;
}

export interface RentRollProperty {
  address: string;
  ownershipPercentage: number;
  units: RentRollUnit[];
}

export interface RentRollData {
  portfolioName: string;
  asOfDate: string;
  properties: RentRollProperty[];
}

const fmtCurrency = (n: number) =>
  n > 0 ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—';

const fmtDate = (iso: string) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

export async function generateRentRollPDF(data: RentRollData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const medGray = rgb(0.55, 0.55, 0.55);
  const lightGray = rgb(0.93, 0.93, 0.93);
  const white = rgb(1, 1, 1);
  const navy = rgb(0.1, 0.2, 0.4);
  const green = rgb(0.1, 0.5, 0.15);
  const red = rgb(0.7, 0.1, 0.1);
  const yellow = rgb(0.6, 0.4, 0.0);
  const headerBlue = rgb(0.85, 0.9, 0.98);
  const propHeaderBg = rgb(0.2, 0.35, 0.6);

  const PW = 612;
  const PH = 792;
  const MARGIN = 28;
  const CONTENT_W = PW - MARGIN * 2;

  // Column definitions for unit table
  const unitCols = [
    { key: 'unitNumber', label: 'Unit', w: 38 },
    { key: 'unitType', label: 'Type', w: 52 },
    { key: 'squareFootage', label: 'Sq Ft', w: 42 },
    { key: 'tenantName', label: 'Tenant Name', w: 110 },
    { key: 'leaseStart', label: 'Lease Start', w: 62 },
    { key: 'leaseEnd', label: 'Lease End', w: 62 },
    { key: 'marketRent', label: 'Market Rent', w: 62 },
    { key: 'actualRent', label: 'Actual Rent', w: 62 },
    { key: 'status', label: 'Status', w: 62 },
  ];

  const HEADER_H = 44;
  const COL_HDR_H = 20;
  const ROW_H = 16;
  const PROP_HDR_H = 22;
  const SUBTOTAL_H = 16;

  // Track all items to place across pages
  type Item =
    | { type: 'pageHeader' }
    | { type: 'colHeader' }
    | { type: 'propHeader'; prop: RentRollProperty }
    | { type: 'unitRow'; unit: RentRollUnit; isEven: boolean }
    | { type: 'propSubtotal'; prop: RentRollProperty }
    | { type: 'grandTotal' }
    | { type: 'footer' };

  const items: Item[] = [];

  // Compute grand totals upfront
  const grandTotalUnits = data.properties.reduce((s, p) => s + p.units.length, 0);
  const grandOccupied = data.properties.reduce((s, p) => s + p.units.filter(u => u.status !== 'Vacant').length, 0);
  const grandMarketRent = data.properties.reduce((s, p) => s + p.units.reduce((ss, u) => ss + u.marketRent, 0), 0);
  const grandActualRent = data.properties.reduce((s, p) => s + p.units.filter(u => u.status !== 'Vacant').reduce((ss, u) => ss + u.actualRent, 0), 0);

  // Build render list
  for (const prop of data.properties) {
    items.push({ type: 'propHeader', prop });
    let unitIndex = 0;
    for (const unit of prop.units) {
      items.push({ type: 'unitRow', unit, isEven: unitIndex % 2 === 0 });
      unitIndex++;
    }
    items.push({ type: 'propSubtotal', prop });
  }
  items.push({ type: 'grandTotal' });

  // Paginate
  const itemHeights: Record<Item['type'], number> = {
    pageHeader: HEADER_H,
    colHeader: COL_HDR_H,
    propHeader: PROP_HDR_H,
    unitRow: ROW_H,
    propSubtotal: SUBTOTAL_H,
    grandTotal: 60,
    footer: 20,
  };

  let curPage: ReturnType<typeof pdfDoc.addPage> | null = null;
  let curY = 0;
  let pageNum = 0;

  const newPage = () => {
    pageNum++;
    curPage = pdfDoc.addPage([PW, PH]);
    curY = PH;
    renderPageHeader();
    renderColHeader();
  };

  const ensureSpace = (h: number) => {
    if (!curPage || curY - h < 40) newPage();
  };

  const renderPageHeader = () => {
    if (!curPage) return;
    curPage.drawRectangle({ x: 0, y: curY - HEADER_H, width: PW, height: HEADER_H, color: navy });
    curPage.drawText('RENT ROLL', { x: MARGIN, y: curY - 22, size: 16, font: boldFont, color: white });
    curPage.drawText(data.portfolioName, { x: MARGIN, y: curY - 36, size: 9, font, color: rgb(0.75, 0.85, 1) });
    curPage.drawText(`As of: ${data.asOfDate}`, { x: PW - 130, y: curY - 22, size: 9, font, color: white });
    curPage.drawText(`Page ${pageNum}`, { x: PW - 75, y: curY - 36, size: 8, font, color: rgb(0.7, 0.8, 0.95) });
    curY -= HEADER_H;
  };

  const renderColHeader = () => {
    if (!curPage) return;
    let x = MARGIN;
    for (const col of unitCols) {
      curPage.drawRectangle({ x, y: curY - COL_HDR_H, width: col.w, height: COL_HDR_H, color: headerBlue, borderColor: darkGray, borderWidth: 0.4 });
      curPage.drawText(col.label, { x: x + 2, y: curY - COL_HDR_H + 6, size: 7, font: boldFont, color: navy });
      x += col.w;
    }
    curY -= COL_HDR_H;
  };

  // Start first page
  newPage();

  for (const item of items) {
    const h = itemHeights[item.type];
    ensureSpace(h);
    if (!curPage) continue;

    if (item.type === 'propHeader') {
      const prop = item.prop;
      const propOccupied = prop.units.filter(u => u.status !== 'Vacant').length;
      const propOccRate = prop.units.length > 0 ? Math.round((propOccupied / prop.units.length) * 100) : 0;

      curPage.drawRectangle({ x: MARGIN, y: curY - PROP_HDR_H, width: CONTENT_W, height: PROP_HDR_H, color: propHeaderBg });
      curPage.drawText(prop.address, { x: MARGIN + 4, y: curY - 14, size: 8.5, font: boldFont, color: white });
      curPage.drawText(`${prop.ownershipPercentage}% owned`, { x: MARGIN + 340, y: curY - 14, size: 7.5, font, color: rgb(0.75, 0.85, 1) });
      curPage.drawText(`${propOccupied}/${prop.units.length} units occupied (${propOccRate}%)`, {
        x: PW - MARGIN - 150, y: curY - 14, size: 7.5, font, color: white,
      });
      curY -= PROP_HDR_H;

    } else if (item.type === 'unitRow') {
      const u = item.unit;
      const bg = item.isEven ? white : rgb(0.97, 0.97, 0.99);
      const statusColor = u.status === 'Current' ? green : u.status === 'Vacant' ? medGray : u.status === 'Past Due' ? red : yellow;

      const rowValues: Record<string, string> = {
        unitNumber: u.unitNumber,
        unitType: u.unitType,
        squareFootage: u.squareFootage > 0 ? u.squareFootage.toLocaleString() : '—',
        tenantName: u.status === 'Vacant' ? '— Vacant —' : u.tenantName,
        leaseStart: u.status === 'Vacant' ? '—' : fmtDate(u.leaseStart),
        leaseEnd: u.status === 'Vacant' ? '—' : fmtDate(u.leaseEnd),
        marketRent: fmtCurrency(u.marketRent),
        actualRent: u.status === 'Vacant' ? '—' : fmtCurrency(u.actualRent),
        status: u.status,
      };

      let x = MARGIN;
      for (const col of unitCols) {
        curPage.drawRectangle({ x, y: curY - ROW_H, width: col.w, height: ROW_H, color: bg, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.3 });
        const val = rowValues[col.key];
        const isStatus = col.key === 'status';
        const isTenant = col.key === 'tenantName';
        curPage.drawText(val, {
          x: x + 2, y: curY - ROW_H + 4,
          size: isTenant ? 7 : 7.5,
          font: isStatus ? boldFont : font,
          color: isStatus ? statusColor : darkGray,
        });
        x += col.w;
      }
      curY -= ROW_H;

    } else if (item.type === 'propSubtotal') {
      const prop = item.prop;
      const propOccupied = prop.units.filter(u => u.status !== 'Vacant').length;
      const propMarket = prop.units.reduce((s, u) => s + u.marketRent, 0);
      const propActual = prop.units.filter(u => u.status !== 'Vacant').reduce((s, u) => s + u.actualRent, 0);

      curPage.drawRectangle({ x: MARGIN, y: curY - SUBTOTAL_H, width: CONTENT_W, height: SUBTOTAL_H, color: lightGray, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.4 });
      curPage.drawText(`Subtotal: ${propOccupied}/${prop.units.length} occupied`, {
        x: MARGIN + 2, y: curY - SUBTOTAL_H + 4, size: 7.5, font: boldFont, color: darkGray,
      });
      curPage.drawText(`Market: ${fmtCurrency(propMarket)} / mo`, {
        x: MARGIN + 260, y: curY - SUBTOTAL_H + 4, size: 7.5, font, color: darkGray,
      });
      curPage.drawText(`Actual: ${fmtCurrency(propActual)} / mo`, {
        x: MARGIN + 380, y: curY - SUBTOTAL_H + 4, size: 7.5, font: boldFont, color: green,
      });
      curY -= SUBTOTAL_H + 6;

    } else if (item.type === 'grandTotal') {
      const GT_H = 56;
      ensureSpace(GT_H + 24);
      if (!curPage) continue;

      curY -= 8;
      curPage.drawRectangle({ x: MARGIN, y: curY - GT_H, width: CONTENT_W, height: GT_H, color: navy, borderColor: white, borderWidth: 0 });
      curPage.drawText('PORTFOLIO TOTALS', { x: MARGIN + 8, y: curY - 14, size: 9, font: boldFont, color: white });

      const summaryItems = [
        [`Properties: ${data.properties.length}`, `Total Units: ${grandTotalUnits}`],
        [`Occupied: ${grandOccupied} (${grandTotalUnits > 0 ? Math.round(grandOccupied / grandTotalUnits * 100) : 0}%)`, `Vacant: ${grandTotalUnits - grandOccupied}`],
        [`Market Rent: ${fmtCurrency(grandMarketRent)}/mo`, `Collected: ${fmtCurrency(grandActualRent)}/mo`],
        [`Annual Income: ${fmtCurrency(grandActualRent * 12)}`, ''],
      ];
      summaryItems.forEach(([left, right], i) => {
        curPage!.drawText(left, { x: MARGIN + 8, y: curY - 24 - i * 10, size: 8, font: i === 2 || i === 3 ? boldFont : font, color: white });
        if (right) {
          curPage!.drawText(right, { x: MARGIN + 200, y: curY - 24 - i * 10, size: 8, font, color: rgb(0.75, 0.85, 1) });
        }
      });
      curY -= GT_H;

      // Footer
      curY -= 10;
      curPage.drawText(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, {
        x: MARGIN, y: curY, size: 7, font, color: medGray,
      });
      curPage.drawText('This document is for internal use only.', {
        x: PW - MARGIN - 160, y: curY, size: 7, font, color: medGray,
      });
    }
  }

  return pdfDoc.save();
}

export function downloadRentRollPDF(pdfBytes: Uint8Array, portfolioName?: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RentRoll-${(portfolioName || 'Portfolio').replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
