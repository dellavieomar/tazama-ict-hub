import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import type { WeeklyReport } from "./report-builder";

export async function generateReportDocx(report: WeeklyReport): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({ text: report.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Period: ${report.periodStart} to ${report.periodEnd}`,
          color: "666666",
          size: 20,
        }),
      ],
    }),
    new Paragraph({ text: "" })
  );

  children.push(
    new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: report.summary }),
    new Paragraph({ text: "" })
  );

  children.push(new Paragraph({ text: "System Status", heading: HeadingLevel.HEADING_2 }));
  report.systemStatus.forEach((s) => {
    children.push(new Paragraph({ text: `${s.label}: ${s.value}` }));
  });
  children.push(new Paragraph({ text: "" }));

  children.push(new Paragraph({ text: "Core Activities", heading: HeadingLevel.HEADING_2 }));
  if (report.coreActivities.length === 0) {
    children.push(new Paragraph({ text: "No activities logged this period." }));
  } else {
    report.coreActivities.forEach((a) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: a.title, bold: true }),
            new TextRun({ text: `  (${a.type.replace(/_/g, " ")})`, color: "888888" }),
          ],
        })
      );
      if (a.description) children.push(new Paragraph({ text: a.description }));
    });
  }
  children.push(new Paragraph({ text: "" }));

  children.push(new Paragraph({ text: "Security Incidents", heading: HeadingLevel.HEADING_2 }));
  if (report.securityIncidents.length === 0) {
    children.push(new Paragraph({ text: "No incidents reported this period." }));
  } else {
    report.securityIncidents.forEach((inc) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: inc.title, bold: true }),
            new TextRun({ text: `  [${inc.severity.toUpperCase()}]`, color: "B45309" }),
          ],
        })
      );
      children.push(new Paragraph({ text: `Status: ${inc.status}` }));
      if (inc.description) children.push(new Paragraph({ text: inc.description }));
    });
  }
  children.push(new Paragraph({ text: "" }));

  children.push(new Paragraph({ text: "Summary & Next Steps", heading: HeadingLevel.HEADING_2 }));
  report.recommendations.forEach((r) => {
    children.push(new Paragraph({ text: r, bullet: { level: 0 } }));
  });

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
