import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data: activities } = await supabaseAdmin
    .from("activities")
    .select("type, created_at")
    .eq("user_id", userId)
    .gte("created_at", fourteenDaysAgo.toISOString());

  const { data: incidents } = await supabaseAdmin
    .from("incidents")
    .select("severity, status, created_at")
    .eq("user_id", userId)
    .gte("created_at", fourteenDaysAgo.toISOString());

  const allActivities = activities ?? [];
  const allIncidents = incidents ?? [];

  // Activities by type
  const typeCounts: Record<string, number> = {};
  allActivities.forEach((a) => {
    typeCounts[a.type] = (typeCounts[a.type] ?? 0) + 1;
  });
  const activitiesByType = Object.entries(typeCounts).map(([type, count]) => ({
    type: type.replace(/_/g, " "),
    count,
  }));

  // Incidents by severity
  const severityOrder = ["low", "medium", "high", "critical"];
  const severityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  allIncidents.forEach((i) => {
    if (severityCounts[i.severity] !== undefined) severityCounts[i.severity]++;
  });
  const incidentsBySeverity = severityOrder.map((s) => ({ severity: s, count: severityCounts[s] }));

  // Daily activity trend, last 14 days
  const dailyMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = 0;
  }
  allActivities.forEach((a) => {
    const key = a.created_at.slice(0, 10);
    if (dailyMap[key] !== undefined) dailyMap[key]++;
  });
  const dailyActivity = Object.entries(dailyMap).map(([date, count]) => ({
    date: date.slice(5),
    count,
  }));

  // Security alerts this week (activities logged as security_event type)
  const securityAlertsThisWeek = allActivities.filter(
    (a) => a.type === "security_event" && new Date(a.created_at) >= sevenDaysAgo
  ).length;

  // Backup status: was a backup_activity logged in the last 7 days?
  const hasRecentBackup = allActivities.some(
    (a) => a.type === "backup_activity" && new Date(a.created_at) >= sevenDaysAgo
  );

  return NextResponse.json({
    activitiesByType,
    incidentsBySeverity,
    dailyActivity,
    securityAlertsThisWeek,
    backupStatus: hasRecentBackup ? "OK" : "None",
  });
}
