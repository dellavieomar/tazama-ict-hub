"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { LogOut, ClipboardList, AlertTriangle, FileBarChart, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let frame: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

type Analytics = {
  activitiesByType: { type: string; count: number }[];
  incidentsBySeverity: { severity: string; count: number }[];
  dailyActivity: { date: string; count: number }[];
  securityAlertsThisWeek: number;
  backupStatus: string;
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "#00d4b8",
  medium: "#ff6b35",
  high: "#ff9f0a",
  critical: "#ff453a",
};

export default function DashboardPage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [openIncidents, setOpenIncidents] = useState(0);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/activities")
      .then((r) => r.json())
      .then((json) => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = (json.activities ?? []).filter(
          (a: { created_at: string }) => new Date(a.created_at).getTime() > weekAgo
        );
        setWeeklyCount(recent.length);
      })
      .catch(() => {});

    fetch("/api/incidents")
      .then((r) => r.json())
      .then((json) => {
        const open = (json.incidents ?? []).filter(
          (i: { status: string }) => i.status === "open" || i.status === "in_progress"
        );
        setOpenIncidents(open.length);
      })
      .catch(() => {});

    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => {});
  }, []);

  const activitiesCount = useCountUp(weeklyCount);
  const incidentsCount = useCountUp(openIncidents);
  const alertsCount = useCountUp(analytics?.securityAlertsThisWeek ?? 0);
  const backupStatus = analytics?.backupStatus ?? "…";

  return (
    <main className="dash-page">
      <div className="mesh-bg" aria-hidden="true">
        <div className="blob blob-teal" />
        <div className="blob blob-deep" />
      </div>

      <header className="dash-header">
        <div>
          <p className="eyebrow">TAZAMA ICT HUB</p>
          <h1 className="dash-title">Welcome back, {user?.firstName ?? "there"}.</h1>
        </div>
        <button onClick={() => signOut()} className="signout-btn">
          <LogOut size={16} /> Sign out
        </button>
      </header>

      <section className="stat-strip">
        <div className="stat-card">
          <span className="stat-value">{activitiesCount}</span>
          <span className="stat-label">Activities this week</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{incidentsCount}</span>
          <span className="stat-label">Open incidents</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{alertsCount}</span>
          <span className="stat-label">Security alerts this week</span>
        </div>
        <div className={`stat-card ${backupStatus === "OK" ? "stat-good" : ""}`}>
          <span className="stat-value">{backupStatus}</span>
          <span className="stat-label">Backup logged this week</span>
        </div>
      </section>

      {analytics && (
        <section className="chart-grid">
          <div className="chart-card">
            <p className="eyebrow">ACTIVITY TREND — LAST 14 DAYS</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.dailyActivity}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4b8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00d4b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#8b95a5" fontSize={11} />
                <YAxis stroke="#8b95a5" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#12161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#f5f7fa" }}
                />
                <Area type="monotone" dataKey="count" stroke="#00d4b8" fill="url(#trendFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <p className="eyebrow">ACTIVITIES BY TYPE</p>
            {analytics.activitiesByType.length === 0 ? (
              <p className="muted-text">No activities logged in the last 14 days.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.activitiesByType} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" stroke="#8b95a5" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="type" type="category" stroke="#8b95a5" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{ background: "#12161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    labelStyle={{ color: "#f5f7fa" }}
                  />
                  <Bar dataKey="count" fill="#00d4b8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <p className="eyebrow">INCIDENTS BY SEVERITY</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.incidentsBySeverity}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="severity" stroke="#8b95a5" fontSize={11} />
                <YAxis stroke="#8b95a5" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#12161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#f5f7fa" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics.incidentsBySeverity.map((entry) => (
                    <Bar key={entry.severity} dataKey="count" fill={SEVERITY_COLORS[entry.severity]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="dash-grid">
        <Link href="/activities" className="dash-tile">
          <ClipboardList size={22} className="tile-icon" />
          <h3>Activities</h3>
          <p>Log daily tasks and events</p>
        </Link>
        <Link href="/incidents" className="dash-tile tile-amber">
          <AlertTriangle size={22} className="tile-icon" />
          <h3>Incidents</h3>
          <p>Report system issues</p>
        </Link>
        <Link href="/reports" className="dash-tile">
          <FileBarChart size={22} className="tile-icon" />
          <h3>Reports</h3>
          <p>View generated reports</p>
        </Link>
        <Link href="/profile" className="dash-tile">
          <UserCircle size={22} className="tile-icon" />
          <h3>Profile</h3>
          <p>Manage your account</p>
        </Link>
      </section>
    </main>
  );
}
