"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { LogOut, ClipboardList, AlertTriangle, FileBarChart, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

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

export default function DashboardPage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [weeklyCount, setWeeklyCount] = useState(0);

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
  }, []);

  const activitiesCount = useCountUp(weeklyCount);
  const incidentsCount = useCountUp(0);
  const alertsCount = useCountUp(0);

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
          <span className="stat-label">Security alerts</span>
        </div>
        <div className="stat-card stat-good">
          <span className="stat-value">OK</span>
          <span className="stat-label">Backup status</span>
        </div>
      </section>

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
