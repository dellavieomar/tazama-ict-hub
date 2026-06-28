import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "./supabase-admin";

export async function ensureProfile(userId: string) {
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
