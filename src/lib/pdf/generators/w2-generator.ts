import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface W2FormData {
  taxYear: number;
  // Boxes a-f (identification)
  boxA_EmployeeSSN: string;
  boxB_EmployerEIN: string;
  boxC_EmployerName: string;
  boxC_EmployerStreet: string;
  boxC_EmployerCity: string;
  boxC_EmployerState: string;
  boxC_EmployerZip: string;
  boxD_ControlNumber: string;
  boxE_EmployeeName: string;
  boxF_EmployeeStreet: string;
  boxF_EmployeeCity: string;
  boxF_EmployeeState: string;
  boxF_EmployeeZip: string;
  // Numeric boxes
  box1_Wages: number;
  box2_FederalTax: number;
  box3_SSWages: number;
  box4_SSTax: number;
  box5_MedicareWages: number;
  box6_MedicareTax: number;
  box7_SSTips: number;
  box8_AllocatedTips: number;
  box10_DependentCare: number;
  box11_NonqualifiedPlans: number;
  box12Codes: Array<{ code: string; amount: number }>;
  box13_StatutoryEmployee: boolean;
  box13_RetirementPlan: boolean;
  box13_ThirdPartySickPay: boolean;
  box14Other: Array<{ description: string; amount: number }>;
  // State/local
  box15_State: string;
  box15_EmployerStateId: string;
  box16_StateWages: number;
  box17_StateTax: number;
  box18_LocalWages: number;
  box19_LocalTax: number;
  box20_LocalityName: string;
}

const fmt = (n: number) =>
  n > 0 ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';

const fmtNum = (n: number) =>
  n > 0 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

export async function generateW2PDF(data: W2FormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const medGray = rgb(0.5, 0.5, 0.5);
  const white = rgb(1, 1, 1);
  const navy = rgb(0.1, 0.2, 0.4);

  const copies = [
    { label: 'Copy B — To Be Filed With Employee\'s FEDERAL Tax Return', note: 'This information is being furnished to the Internal Revenue Service.' },
    { label: 'Copy C — For Employee\'s Records', note: 'Keep for your records.' },
    { label: 'Copy 2 — To Be Filed With Employee\'s State, City, or Local Income Tax Return', note: 'This information is being furnished to the state tax authority.' },
  ];

  for (const copy of copies) {
    const page = pdfDoc.addPage([612, 792]);
    const { height } = page.getSize();
    const W = 612;

    // Helper: draw a labeled box
    const drawBox = (
      x: number, y: number, w: number, h: number,
      label: string, value: string, labelSize = 6.5, valueSize = 9,
      bgColor = white, multiLine = false
    ) => {
      // Background
      page.drawRectangle({ x, y, width: w, height: h, color: bgColor, borderColor: darkGray, borderWidth: 0.5 });
      // Label
      page.drawText(label, { x: x + 3, y: y + h - labelSize - 2, size: labelSize, font, color: medGray });
      // Value
      if (multiLine && value.length > 0) {
        const lines = value.split('\n').slice(0, 3);
        lines.forEach((line, i) => {
          page.drawText(line.trim(), {
            x: x + 3, y: y + h - labelSize - 3 - (i + 1) * (valueSize + 1),
            size: valueSize - 1, font, color: black,
          });
        });
      } else if (value.length > 0) {
        // Word-wrap long values: split into chunks of ~32 chars at word boundaries and draw up to 2 lines
        const words = value.split(' ');
        const wrappedLines: string[] = [];
        let current = '';
        for (const word of words) {
          if ((current + (current ? ' ' : '') + word).length > 32) {
            if (current) wrappedLines.push(current);
            current = word;
          } else {
            current = current ? current + ' ' + word : word;
          }
        }
        if (current) wrappedLines.push(current);
        if (wrappedLines.length === 1) {
          page.drawText(wrappedLines[0], { x: x + 3, y: y + 5, size: valueSize, font, color: black });
        } else {
          wrappedLines.slice(0, 2).forEach((line, i) => {
            page.drawText(line, { x: x + 3, y: y + h - labelSize - 3 - (i + 1) * (valueSize + 1), size: valueSize, font, color: black });
          });
        }
      }
    };

    const drawCheckbox = (x: number, y: number, checked: boolean, label: string) => {
      page.drawRectangle({ x, y, width: 8, height: 8, color: white, borderColor: darkGray, borderWidth: 0.5 });
      if (checked) {
        page.drawText('✓', { x: x + 1, y: y + 1, size: 7, font: boldFont, color: black });
      }
      page.drawText(label, { x: x + 11, y: y + 1, size: 6.5, font, color: black });
    };

    // ─── HEADER ─────────────────────────────────────────────────
    // Navy header bar
    page.drawRectangle({ x: 0, y: height - 40, width: W, height: 40, color: navy });
    page.drawText('W-2', { x: 16, y: height - 28, size: 22, font: boldFont, color: white });
    page.drawText('Wage and Tax Statement', { x: 70, y: height - 22, size: 11, font: boldFont, color: white });
    page.drawText(`Tax Year ${data.taxYear}`, { x: 70, y: height - 34, size: 9, font, color: rgb(0.8, 0.9, 1) });
    page.drawText('Department of the Treasury — Internal Revenue Service', { x: W - 280, y: height - 22, size: 7.5, font, color: rgb(0.7, 0.8, 0.95) });

    // Copy label
    page.drawRectangle({ x: 0, y: height - 54, width: W, height: 14, color: lightGray });
    page.drawText(copy.label, { x: 8, y: height - 49, size: 7, font: boldFont, color: darkGray });

    // ─── ROW 1: Box a (SSN) | Box b (EIN) | Box c (Employer) ────
    let y = height - 54;
    const ROW1_H = 48;
    y -= ROW1_H;

    drawBox(0, y, 130, ROW1_H, 'a  Employee\'s social security number', data.boxA_EmployeeSSN, 6.5, 10, white);
    drawBox(130, y, 130, ROW1_H, 'b  Employer identification number (EIN)', data.boxB_EmployerEIN, 6.5, 10, white);
    const employerVal = [data.boxC_EmployerName, data.boxC_EmployerStreet, `${data.boxC_EmployerCity} ${data.boxC_EmployerState} ${data.boxC_EmployerZip}`].filter(Boolean).join('\n');
    drawBox(260, y, 352, ROW1_H, 'c  Employer\'s name, address, and ZIP code', employerVal, 6.5, 8, white, true);

    // ─── ROW 2: Box d (control) | Box e-f (Employee) ────────────
    const ROW2_H = 48;
    y -= ROW2_H;

    drawBox(0, y, 130, ROW2_H, 'd  Control number', data.boxD_ControlNumber, 6.5, 9, white);
    const employeeAddrVal = [`${data.boxF_EmployeeStreet}`, `${data.boxF_EmployeeCity} ${data.boxF_EmployeeState} ${data.boxF_EmployeeZip}`].filter(l => l.trim()).join('\n');
    drawBox(130, y, 482, ROW2_H, 'e  Employee\'s name, address, and ZIP code', [data.boxE_EmployeeName, employeeAddrVal].filter(Boolean).join('\n'), 6.5, 8, white, true);

    // ─── ROW 3: Boxes 1–4 ────────────────────────────────────────
    const NUM_H = 36;
    y -= NUM_H;
    const quarter = W / 4;

    drawBox(0, y, quarter, NUM_H, '1  Wages, tips, other compensation', fmt(data.box1_Wages), 6.5, 11, white);
    drawBox(quarter, y, quarter, NUM_H, '2  Federal income tax withheld', fmt(data.box2_FederalTax), 6.5, 11, white);
    drawBox(quarter * 2, y, quarter, NUM_H, '3  Social security wages', fmt(data.box3_SSWages), 6.5, 11, white);
    drawBox(quarter * 3, y, quarter, NUM_H, '4  Social security tax withheld', fmt(data.box4_SSTax), 6.5, 11, white);

    // ─── ROW 4: Boxes 5–8 ────────────────────────────────────────
    y -= NUM_H;
    drawBox(0, y, quarter, NUM_H, '5  Medicare wages and tips', fmt(data.box5_MedicareWages), 6.5, 11, white);
    drawBox(quarter, y, quarter, NUM_H, '6  Medicare tax withheld', fmt(data.box6_MedicareTax), 6.5, 11, white);
    drawBox(quarter * 2, y, quarter, NUM_H, '7  Social security tips', fmt(data.box7_SSTips), 6.5, 11, white);
    drawBox(quarter * 3, y, quarter, NUM_H, '8  Allocated tips', fmt(data.box8_AllocatedTips), 6.5, 11, white);

    // ─── ROW 5: Boxes 10–11 | Box 12a | Box 12b ─────────────────
    y -= NUM_H;
    const half = W / 2;
    const box12a = data.box12Codes[0];
    const box12b = data.box12Codes[1];

    drawBox(0, y, quarter, NUM_H, '10  Dependent care benefits', fmt(data.box10_DependentCare), 6.5, 11, white);
    drawBox(quarter, y, quarter, NUM_H, '11  Nonqualified plans', fmt(data.box11_NonqualifiedPlans), 6.5, 11, white);
    drawBox(half, y, quarter, NUM_H, '12a  See instructions for box 12', box12a ? `${box12a.code}   ${fmtNum(box12a.amount)}` : '', 6.5, 9, white);
    drawBox(half + quarter, y, quarter, NUM_H, '12b', box12b ? `${box12b.code}   ${fmtNum(box12b.amount)}` : '', 6.5, 9, white);

    // ─── ROW 6: Box 13 (checkboxes) | Box 12c | Box 12d | Box 14 ─
    const ROW6_H = 42;
    y -= ROW6_H;
    const box12c = data.box12Codes[2];
    const box12d = data.box12Codes[3];

    // Box 13
    page.drawRectangle({ x: 0, y, width: quarter, height: ROW6_H, color: white, borderColor: darkGray, borderWidth: 0.5 });
    page.drawText('13', { x: 3, y: y + ROW6_H - 10, size: 6.5, font, color: medGray });
    drawCheckbox(3, y + ROW6_H - 22, data.box13_StatutoryEmployee, 'Statutory employee');
    drawCheckbox(3, y + ROW6_H - 31, data.box13_RetirementPlan, 'Retirement plan');
    drawCheckbox(3, y + ROW6_H - 40, data.box13_ThirdPartySickPay, 'Third-party sick pay');

    drawBox(quarter, y, quarter, ROW6_H, '12c', box12c ? `${box12c.code}   ${fmtNum(box12c.amount)}` : '', 6.5, 9, white);
    drawBox(half, y, quarter, ROW6_H, '12d', box12d ? `${box12d.code}   ${fmtNum(box12d.amount)}` : '', 6.5, 9, white);

    // Box 14 — Oregon STT + other items
    const allBox14 = [...data.box14Other];
    if (data.box15_State === 'OR' && data.box1_Wages > 0) {
      const sttWages = data.box1_Wages;
      const sttWithheld = Math.round(sttWages * 0.001 * 100) / 100;
      // Only add if not already there
      if (!allBox14.find(e => e.description === 'STT')) {
        allBox14.unshift({ description: 'STP', amount: sttWithheld });
        allBox14.unshift({ description: 'STT', amount: sttWages });
      }
    }

    page.drawRectangle({ x: half + quarter, y, width: quarter, height: ROW6_H, color: white, borderColor: darkGray, borderWidth: 0.5 });
    page.drawText('14  Other', { x: half + quarter + 3, y: y + ROW6_H - 10, size: 6.5, font, color: medGray });
    {
      // Render all Box 14 items — use smaller font if more than 3 to avoid clipping
      const itemFontSize = allBox14.length > 3 ? 5.5 : 7;
      const itemSpacing = allBox14.length > 3 ? 7 : 9;
      allBox14.forEach((item, i) => {
        page.drawText(`${item.description}  ${fmtNum(item.amount)}`, {
          x: half + quarter + 3, y: y + ROW6_H - 18 - i * itemSpacing, size: itemFontSize, font, color: black,
        });
      });
    }

    // ─── ROW 7: State/Local ───────────────────────────────────────
    const ROW7_H = 36;
    y -= ROW7_H;
    const stateLabel = `15  State  ${data.box15_State || ''}     Employer's state ID no.  ${data.box15_EmployerStateId || ''}`;

    page.drawRectangle({ x: 0, y, width: W, height: ROW7_H, color: white, borderColor: darkGray, borderWidth: 0.5 });
    page.drawText('15', { x: 3, y: y + ROW7_H - 10, size: 6.5, font, color: medGray });
    page.drawText(`State: ${data.box15_State || '—'}`, { x: 3, y: y + ROW7_H - 19, size: 8, font, color: black });
    page.drawText(`State ID: ${data.box15_EmployerStateId || '—'}`, { x: 3, y: y + 5, size: 8, font, color: black });

    const stateW = 200;
    drawBox(stateW, y, 100, ROW7_H, '16  State wages, tips, etc.', fmt(data.box16_StateWages), 6.5, 9, white);
    drawBox(stateW + 100, y, 100, ROW7_H, '17  State income tax', fmt(data.box17_StateTax), 6.5, 9, white);
    drawBox(stateW + 200, y, 100, ROW7_H, '18  Local wages, tips, etc.', fmt(data.box18_LocalWages), 6.5, 9, white);
    drawBox(stateW + 300, y, 62, ROW7_H, '19  Local income tax', fmt(data.box19_LocalTax), 6.5, 9, white);
    drawBox(stateW + 362, y, W - stateW - 362, ROW7_H, '20  Locality name', data.box20_LocalityName, 6.5, 8, white);

    // ─── FOOTER ──────────────────────────────────────────────────
    y -= 20;
    page.drawText(copy.note, { x: 8, y: y + 5, size: 6.5, font, color: medGray });
    page.drawText('Form W-2 (Rev. 2024)', { x: W - 110, y: y + 5, size: 6.5, font, color: medGray });
  }

  return pdfDoc.save();
}

export function downloadW2PDF(pdfBytes: Uint8Array, taxYear: number, employeeName?: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `W2-${taxYear}${employeeName ? `-${employeeName.replace(/\s+/g, '_')}` : ''}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
