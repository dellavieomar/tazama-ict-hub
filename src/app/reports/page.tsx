"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileBarChart } from "lucide-react";
import AppNav from "@/components/AppNav";

type SavedReport = {
  id: number;
  title: string;
  summary: string;
  content: {
    coreActivities: { type: string; title: string; description: string | null; created_at: string }[];
    securityIncidents: { title: string; severity: string; status: string; created_at: string }[];
    systemStatus: { label: string; value: string }[];
  };
  recommendations: string[];
  period_start: string;
  period_end: string;
  created_at: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (res.ok) {
        setReports(json.reports ?? []);
        if (json.reports?.length > 0) setActiveId(json.reports[0].id);
      } else setError(json.error ?? "Failed to load reports");
    } catch {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function generateReport() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate report");
      await loadReports();
      setActiveId(json.report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  const active = reports.find((r) => r.id === activeId);

  return (
    <main className="dash-page">
      <div className="mesh-bg" aria-hidden="true">
        <div className="blob blob-teal" />
        <div className="blob blob-deep" />
      </div>

      <AppNav />
      <header className="dash-header">
        <div>
          <Link href="/dashboard" className="back-link">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="dash-title">Reports</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {active && (
            <>
              <a className="btn-small" href={`/api/reports/${active.id}/pdf`}>Download PDF</a>
              <a className="btn-small" href={`/api/reports/${active.id}/docx`}>Download Word</a>
            </>
          )}
          <button className="btn-primary" onClick={generateReport} disabled={generating} style={{ border: "none", cursor: "pointer" }}>
            {generating ? "Generating…" : "Generate this week's report"}
          </button>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}

      <section className="activity-layout">
        <div className="activity-list">
          <p className="eyebrow">PAST REPORTS</p>
          {loading && <p className="muted-text">Loading…</p>}
          {!loading && reports.length === 0 && (
            <p className="muted-text">No reports yet — generate your first one.</p>
          )}
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveId(r.id)}
              className={`report-list-item ${r.id === activeId ? "active" : ""}`}
            >
              <FileBarChart size={16} />
              <div>
                <strong>{r.period_start} → {r.period_end}</strong>
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="report-view">
          {!active && <p className="muted-text">Select or generate a report to view it.</p>}
          {active && (
            <>
              <h2 className="report-title">{active.title}</h2>
              <p className="report-summary">{active.summary}</p>

              <h3 className="report-section-heading">System Status</h3>
              <div className="report-stat-row">
                {active.content.systemStatus.map((s) => (
                  <div key={s.label} className="report-stat">
                    <span className="report-stat-value">{s.value}</span>
                    <span className="report-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              <h3 className="report-section-heading">Core Activities</h3>
              {active.content.coreActivities.length === 0 && (
                <p className="muted-text">No activities logged this period.</p>
              )}
              {active.content.coreActivities.map((a, i) => (
                <div key={i} className="report-item">
                  <span className="activity-type">{a.type.replace(/_/g, " ")}</span>
                  <strong>{a.title}</strong>
                  {a.description && <p>{a.description}</p>}
                </div>
              ))}

              <h3 className="report-section-heading">Security Incidents</h3>
              {active.content.securityIncidents.length === 0 && (
                <p className="muted-text">No incidents reported this period.</p>
              )}
              {active.content.securityIncidents.map((inc, i) => (
                <div key={i} className="report-item">
                  <span className={`severity-tag severity-${inc.severity}`}>{inc.severity}</span>
                  <strong>{inc.title}</strong>
                  <p className="activity-meta">{inc.status}</p>
                </div>
              ))}

              <h3 className="report-section-heading">Summary &amp; Next Steps</h3>
              <ul className="report-recs">
                {active.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
