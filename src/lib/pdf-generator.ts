import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { WeeklyReport } from "./report-builder";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateReportPdf(report: WeeklyReport): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPageIfNeeded(spaceNeeded: number) {
    if (y - spaceNeeded < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function writeText(text: string, opts: { size?: number; useFont?: PDFFont; color?: ReturnType<typeof rgb>; gap?: number } = {}) {
    const size = opts.size ?? 10;
    const useFont = opts.useFont ?? font;
    const color = opts.color ?? rgb(0, 0, 0);
    const lines = wrapText(text, useFont, size, MAX_WIDTH);

    for (const line of lines) {
      newPageIfNeeded(size + 4);
      page.drawText(line, { x: MARGIN, y, size, font: useFont, color });
      y -= size + 4;
    }
    y -= opts.gap ?? 0;
  }

  function heading(text: string) {
    newPageIfNeeded(24);
    y -= 6;
    page.drawText(text, { x: MARGIN, y, size: 13, font: bold, color: rgb(0, 0.45, 0.42) });
    y -= 8;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 16;
  }

  writeText(report.title, { size: 17, useFont: bold, gap: 4 });
  writeText(`Period: ${report.periodStart} to ${report.periodEnd}`, {
    size: 10,
    useFont: italic,
    color: rgb(0.4, 0.4, 0.4),
    gap: 14,
  });

  heading("Summary");
  writeText(report.summary, { gap: 8 });

  heading("System Status");
  report.systemStatus.forEach((s) => writeText(`${s.label}: ${s.value}`));
  y -= 8;

  heading("Core Activities");
  if (report.coreActivities.length === 0) {
    writeText("No activities logged this period.", { useFont: italic });
  } else {
    report.coreActivities.forEach((a) => {
      writeText(`${a.title}  (${a.type.replace(/_/g, " ")})`, { useFont: bold, gap: 2 });
      if (a.description) writeText(a.description, { gap: 6 });
    });
  }
  y -= 8;

  heading("Security Incidents");
  if (report.securityIncidents.length === 0) {
    writeText("No incidents reported this period.", { useFont: italic });
  } else {
    report.securityIncidents.forEach((inc) => {
      writeText(`${inc.title}  [${inc.severity.toUpperCase()}]`, { useFont: bold, gap: 2 });
      writeText(`Status: ${inc.status}`, { gap: 2 });
      if (inc.description) writeText(inc.description, { gap: 6 });
    });
  }
  y -= 8;

  heading("Summary & Next Steps");
  report.recommendations.forEach((r) => writeText(`•  ${r}`, { gap: 4 }));

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
