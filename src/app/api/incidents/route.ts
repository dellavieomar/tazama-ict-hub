import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensureProfile } from "@/lib/ensure-profile";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureProfile(userId);

  const { data, error } = await supabaseAdmin
    .from("incidents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incidents: data });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureProfile(userId);

  const body = await req.json();
  const { title, description, severity, status, affected_systems } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("incidents")
    .insert({
      user_id: userId,
      title,
      description: description ?? null,
      severity: severity ?? "medium",
      status: status ?? "open",
      affected_systems: affected_systems ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incident: data }, { status: 201 });
}
