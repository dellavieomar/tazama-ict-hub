"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Activity = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
};

const TYPE_OPTIONS = [
  "daily_log",
  "incident",
  "support_task",
  "network_activity",
  "security_event",
  "backup_activity",
  "maintenance",
  "project",
];

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState("daily_log");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  async function loadActivities() {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      const json = await res.json();
      if (res.ok) setActivities(json.activities ?? []);
      else setError(json.error ?? "Failed to load activities");
    } catch {
      setError("Failed to load activities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivities();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, description, priority }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save activity");
      setTitle("");
      setDescription("");
      await loadActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save activity");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="dash-page">
      <div className="mesh-bg" aria-hidden="true">
        <div className="blob blob-teal" />
        <div className="blob blob-deep" />
      </div>

      <header className="dash-header">
        <div>
          <Link href="/dashboard" className="back-link">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="dash-title">Log an activity</h1>
        </div>
      </header>

      <section className="activity-layout">
        <form className="activity-form" onSubmit={handleSubmit}>
          <label className="form-label">Type</label>
          <select
            className="form-input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <label className="form-label">Title</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Restarted core switch after outage"
            required
          />

          <label className="form-label">Description</label>
          <textarea
            className="form-input form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened, what you did, any follow-up needed…"
            rows={4}
          />

          <label className="form-label">Priority</label>
          <select
            className="form-input"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {error && <p className="form-error">{error}</p>}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save activity"}
          </button>
        </form>

        <div className="activity-list">
          <p className="eyebrow">RECENT ACTIVITY</p>
          {loading && <p className="muted-text">Loading…</p>}
          {!loading && activities.length === 0 && (
            <p className="muted-text">No activities logged yet — add your first one.</p>
          )}
          {activities.map((a) => (
            <div key={a.id} className="activity-row">
              <span className="activity-type">{a.type.replace(/_/g, " ")}</span>
              <h4>{a.title}</h4>
              {a.description && <p>{a.description}</p>}
              <span className="activity-meta">
                {a.priority} · {a.status} ·{" "}
                {new Date(a.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
