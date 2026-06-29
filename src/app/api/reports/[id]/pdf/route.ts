import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateReportPdf } from "@/lib/pdf-generator";
import type { WeeklyReport } from "@/lib/report-builder";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("user_id, content")
    .eq("id", id)
    .single();

  if (error || !data || data.user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const report = data.content as WeeklyReport;
  const buffer = await generateReportPdf(report);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tazama-report-${report.periodStart}.pdf"`,
    },
  });
}
