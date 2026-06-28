type Activity = {
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
};

type Incident = {
  title: string;
  description: string | null;
  severity: string;
  status: string;
  affected_systems: string | null;
  created_at: string;
};

export type WeeklyReport = {
  title: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  coreActivities: Activity[];
  securityIncidents: Incident[];
  systemStatus: { label: string; value: string }[];
  recommendations: string[];
  activitiesCount: number;
  incidentsCount: number;
};

function ruleBasedSummary(activities: Activity[], incidents: Incident[]): { summary: string; recommendations: string[] } {
  const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "in_progress");
  const criticalIncidents = incidents.filter((i) => i.severity === "critical" || i.severity === "high");

  const parts: string[] = [];
  parts.push(`${activities.length} activit${activities.length === 1 ? "y" : "ies"} logged this period.`);
  if (incidents.length === 0) {
    parts.push("No incidents reported.");
  } else {
    parts.push(`${incidents.length} incident${incidents.length === 1 ? "" : "s"} reported, ${openIncidents.length} still open.`);
    if (criticalIncidents.length > 0) {
      parts.push(`${criticalIncidents.length} flagged high/critical severity and need priority attention.`);
    }
  }

  const recs: string[] = [];
  if (openIncidents.length > 0) {
    recs.push(`Follow up on ${openIncidents.length} unresolved incident(s) before next report.`);
  }
  if (!activities.some((a) => a.type === "backup_activity")) {
    recs.push("No backup activity logged this period — confirm backups ran and verify status.");
  }
  if (recs.length === 0) recs.push("No outstanding issues — maintain current monitoring cadence.");

  return { summary: parts.join(" "), recommendations: recs };
}

async function generateWithGemini(
  activities: Activity[],
  incidents: Incident[]
): Promise<{ summary: string; recommendations: string[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const activityText = activities
    .map((a) => `- [${a.type}] ${a.title}${a.description ? `: ${a.description}` : ""} (${a.status})`)
    .join("\n") || "None logged.";
  const incidentText = incidents
    .map((i) => `- [${i.severity}] ${i.title}${i.description ? `: ${i.description}` : ""} (${i.status})`)
    .join("\n") || "None reported.";

  const prompt = `You are writing the summary section of a weekly ICT operations report for a container depot's ICT team.

Activities logged this week:
${activityText}

Incidents reported this week:
${incidentText}

Respond with ONLY valid JSON, no markdown, no code fences, in this exact shape:
{"summary": "2-3 sentence professional summary of the week", "recommendations": ["short actionable recommendation", "..."]}

Keep the summary factual and concise, written for an ICT manager. Recommendations should be specific and actionable, max 4 items.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API error:", await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (typeof parsed.summary === "string" && Array.isArray(parsed.recommendations)) {
      const cleanedRecs = parsed.recommendations.map((r: string) =>
        r.replace(/^[\s*\-•]+/, "").trim()
      );
      return { summary: parsed.summary, recommendations: cleanedRecs };
    }
    return null;
  } catch (err) {
    console.error("Gemini generation failed, falling back:", err);
    return null;
  }
}

export async function buildWeeklyReport(
  activities: Activity[],
  incidents: Incident[],
  periodStart: string,
  periodEnd: string
): Promise<WeeklyReport> {
  const aiResult = await generateWithGemini(activities, incidents);
  const { summary, recommendations } = aiResult ?? ruleBasedSummary(activities, incidents);

  return {
    title: `Weekly ICT Report — ${periodStart} to ${periodEnd}`,
    periodStart,
    periodEnd,
    summary,
    coreActivities: activities,
    securityIncidents: incidents,
    systemStatus: [
      { label: "Activities logged", value: String(activities.length) },
      { label: "Incidents reported", value: String(incidents.length) },
      {
        label: "Open incidents",
        value: String(incidents.filter((i) => i.status === "open" || i.status === "in_progress").length),
      },
    ],
    recommendations,
    activitiesCount: activities.length,
    incidentsCount: incidents.length,
  };
}
