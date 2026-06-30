"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppNav from "@/components/AppNav";

type Incident = {
  id: number;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  affected_systems: string | null;
  created_at: string;
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Incident>>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [affectedSystems, setAffectedSystems] = useState("");

  async function loadIncidents() {
    setLoading(true);
    try {
      const res = await fetch("/api/incidents");
      const json = await res.json();
      if (res.ok) setIncidents(json.incidents ?? []);
      else setError(json.error ?? "Failed to load incidents");
    } catch {
      setError("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, severity, affected_systems: affectedSystems }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save incident");
      setTitle("");
      setDescription("");
      setAffectedSystems("");
      await loadIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save incident");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(inc: Incident) {
    setEditingId(inc.id);
    setEditDraft({
      title: inc.title,
      description: inc.description,
      severity: inc.severity,
      status: inc.status,
      affected_systems: inc.affected_systems,
    });
  }

  async function saveEdit(id: number) {
    const res = await fetch(`/api/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    if (res.ok) {
      setEditingId(null);
      await loadIncidents();
    } else {
      const json = await res.json();
      setError(json.error ?? "Failed to update incident");
    }
  }

  async function deleteIncident(id: number) {
    if (!confirm("Delete this incident? This can't be undone.")) return;
    const res = await fetch(`/api/incidents/${id}`, { method: "DELETE" });
    if (res.ok) await loadIncidents();
    else setError("Failed to delete incident");
  }

  return (
    <main className="dash-page">
      <div className="mesh-bg" aria-hidden="true">
        <div className="blob blob-amber" />
        <div className="blob blob-deep" />
      </div>

      <AppNav />
      <header className="dash-header">
        <div>
          <Link href="/dashboard" className="back-link">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="dash-title">Report an incident</h1>
        </div>
      </header>

      <section className="activity-layout">
        <form className="activity-form" onSubmit={handleSubmit}>
          <label className="form-label">Title</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Core switch went down at 14:20"
            required
          />

          <label className="form-label">Description</label>
          <textarea
            className="form-input form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened, impact, what's been done so far…"
            rows={4}
          />

          <label className="form-label">Severity</label>
          <select className="form-input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <label className="form-label">Affected systems</label>
          <input
            className="form-input"
            value={affectedSystems}
            onChange={(e) => setAffectedSystems(e.target.value)}
            placeholder="e.g. Core switch, Dynamics NAV"
          />

          {error && <p className="form-error">{error}</p>}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save incident"}
          </button>
        </form>

        <div className="activity-list">
          <p className="eyebrow">OPEN &amp; RECENT INCIDENTS</p>
          {loading && <p className="muted-text">Loading…</p>}
          {!loading && incidents.length === 0 && (
            <p className="muted-text">No incidents reported — hopefully it stays that way.</p>
          )}
          {incidents.map((inc) =>
            editingId === inc.id ? (
              <div key={inc.id} className="incident-row edit-form">
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
                  value={editDraft.severity ?? "medium"}
                  onChange={(e) => setEditDraft({ ...editDraft, severity: e.target.value })}
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
                  <option value="completed">Resolved</option>
                  <option value="on_hold">On hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input
                  className="form-input"
                  value={editDraft.affected_systems ?? ""}
                  onChange={(e) => setEditDraft({ ...editDraft, affected_systems: e.target.value })}
                  placeholder="Affected systems"
                />
                <div className="edit-actions">
                  <button className="btn-small" onClick={() => saveEdit(inc.id)}>Save</button>
                  <button className="btn-small" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div key={inc.id} className="incident-row">
                <span className={`severity-tag severity-${inc.severity}`}>{inc.severity}</span>
                <h4>{inc.title}</h4>
                {inc.description && <p>{inc.description}</p>}
                {inc.affected_systems && (
                  <p className="activity-meta">Affected: {inc.affected_systems}</p>
                )}
                <span className="activity-meta">
                  {inc.status} · {new Date(inc.created_at).toLocaleString()}
                </span>
                <div className="row-actions">
                  <button className="btn-small" onClick={() => startEdit(inc)}>Edit</button>
                  <button className="btn-small btn-danger" onClick={() => deleteIncident(inc.id)}>Delete</button>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
