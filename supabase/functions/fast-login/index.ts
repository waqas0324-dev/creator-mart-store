import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type LoginRole = "developer" | "admin";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const { email, password, role } = await req.json() as {
      email?: string;
      password?: string;
      role?: LoginRole;
    };

    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    if (!normalizedEmail || !password || (role !== "developer" && role !== "admin")) {
      return json({ error: "Email, password and access role are required." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Authentication service is not configured." }, 500);
    }

    const tokenResponse = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: { apikey: anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      },
    );

    const tokenPayload = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenPayload.access_token || !tokenPayload.refresh_token) {
      return json(
        { error: tokenPayload.error_description || tokenPayload.msg || "Invalid email or password." },
        tokenResponse.status >= 400 && tokenResponse.status < 500 ? 401 : 502,
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const table = role === "developer" ? "developer_users" : "admin_users";
    const { data: accessRow, error: accessError } = await supabaseAdmin
      .from(table)
      .select("id")
      .eq("user_id", tokenPayload.user.id)
      .maybeSingle();

    if (accessError) {
      console.error("Access lookup failed:", accessError);
      return json({ error: "Could not verify account access. Please try again." }, 503);
    }

    if (!accessRow) {
      return json({
        error:
          role === "developer"
            ? "Access denied. You are not authorized for Developer Studio."
            : "Access denied. You are not authorized to access the admin panel.",
      }, 403);
    }

    return json({
      session: {
        access_token: tokenPayload.access_token,
        refresh_token: tokenPayload.refresh_token,
        expires_in: tokenPayload.expires_in,
        expires_at: tokenPayload.expires_at,
        token_type: tokenPayload.token_type,
      },
      user: tokenPayload.user,
    });
  } catch (error) {
    console.error("Fast login error:", error);
    return json({ error: "Unable to sign in right now. Please try again." }, 500);
  }
});
