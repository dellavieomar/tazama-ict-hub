"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppNav from "@/components/AppNav";

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
  "daily_log", "incident", "support_task", "network_activity",
  "security_event", "backup_activity", "maintenance", "project",
];

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Activity>>({});

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

  function startEdit(a: Activity) {
    setEditingId(a.id);
    setEditDraft({ title: a.title, description: a.description, priority: a.priority, status: a.status });
  }

  async function saveEdit(id: number) {
    const res = await fetch(`/api/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    if (res.ok) {
      setEditingId(null);
      await loadActivities();
    } else {
      const json = await res.json();
      setError(json.error ?? "Failed to update activity");
    }
  }

  async function deleteActivity(id: number) {
    if (!confirm("Delete this activity? This can't be undone.")) return;
    const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
    if (res.ok) await loadActivities();
    else setError("Failed to delete activity");
  }

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
          <h1 className="dash-title">Log an activity</h1>
        </div>
      </header>

      <section className="activity-layout">
        <form className="activity-form" onSubmit={handleSubmit}>
          <label className="form-label">Type</label>
          <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
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
          <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
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
          {activities.map((a) =>
            editingId === a.id ? (
              <div key={a.id} className="activity-row edit-form">
                <input
                  className="form-input"
                  value={editDraft.title ?? ""}
                  onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                />
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  value={editDraft.description ?? ""}
                  onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                />
                <select
                  className="form-input"
                  value={editDraft.priority ?? "medium"}
                  onChange={(e) => setEditDraft({ ...editDraft, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <select
                  className="form-input"
                  value={editDraft.status ?? "open"}
                  onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="edit-actions">
                  <button className="btn-small" onClick={() => saveEdit(a.id)}>Save</button>
                  <button className="btn-small" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div key={a.id} className="activity-row">
                <span className="activity-type">{a.type.replace(/_/g, " ")}</span>
                <h4>{a.title}</h4>
                {a.description && <p>{a.description}</p>}
                <span className="activity-meta">
                  {a.priority} · {a.status} · {new Date(a.created_at).toLocaleString()}
                </span>
                <div className="row-actions">
                  <button className="btn-small" onClick={() => startEdit(a)}>Edit</button>
                  <button className="btn-small btn-danger" onClick={() => deleteActivity(a.id)}>Delete</button>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
