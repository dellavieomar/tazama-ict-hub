import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensureProfile } from "@/lib/ensure-profile";
import { buildWeeklyReport } from "@/lib/report-builder";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data });
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureProfile(userId);

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: activities } = await supabaseAdmin
    .from("activities")
    .select("type, title, description, status, priority, created_at")
    .eq("user_id", userId)
    .gte("created_at", periodStart.toISOString())
    .order("created_at", { ascending: false });

  const { data: incidents } = await supabaseAdmin
    .from("incidents")
    .select("title, description, severity, status, affected_systems, created_at")
    .eq("user_id", userId)
    .gte("created_at", periodStart.toISOString())
    .order("created_at", { ascending: false });

  const report = await buildWeeklyReport(
    activities ?? [],
    incidents ?? [],
    periodStart.toISOString().slice(0, 10),
    periodEnd.toISOString().slice(0, 10)
  );

  const { data: saved, error } = await supabaseAdmin
    .from("reports")
    .insert({
      user_id: userId,
      report_type: "weekly",
      title: report.title,
      summary: report.summary,
      content: report,
      period_start: report.periodStart,
      period_end: report.periodEnd,
      activities_included: report.activitiesCount,
      incidents_included: report.incidentsCount,
      recommendations: report.recommendations,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ report: saved }, { status: 201 });
}
