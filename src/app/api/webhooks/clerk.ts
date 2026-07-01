import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  const body = await req.text();
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: any;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    return new Response("Error occured", {
      status: 400,
    });
  }

  const eventType: string = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses[0]?.email_address;

    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    try {
      // Create user profile in Supabase
      const { error } = await supabase.from("profiles").insert([
        {
          id,
          email,
          full_name: `${first_name || ""} ${last_name || ""}`.trim(),
          role: "staff",
          is_active: true,
        },
      ]);

      if (error) {
        console.error("Error creating profile:", error);
        return new Response("Error creating profile", { status: 500 });
      }

      return new Response("Profile created successfully", { status: 200 });
    } catch (error) {
      console.error("Error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }

  return new Response("Event received", { status: 200 });
}
