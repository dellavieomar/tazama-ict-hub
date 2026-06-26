import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function ensureProfile(userId: string) {
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (existing) return;

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? `${userId}@unknown.local`;
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  await supabaseAdmin.from("profiles").insert({
    id: userId,
    email,
    full_name: fullName || email,
    role: "staff",
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureProfile(userId);

  const { data, error } = await supabaseAdmin
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activities: data });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureProfile(userId);

  const body = await req.json();
  const { type, title, description, priority, status } = body;

  if (!type || !title) {
    return NextResponse.json({ error: "Type and title are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("activities")
    .insert({
      user_id: userId,
      type,
      title,
      description: description ?? null,
      priority: priority ?? "medium",
      status: status ?? "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activity: data }, { status: 201 });
}
