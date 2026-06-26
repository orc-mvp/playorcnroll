import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const log = (step: string, details?: unknown) => {
  console.log(`[SYNC-SUBSCRIPTION] ${step}`, details ? JSON.stringify(details) : "");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr) throw new Error(`Auth error: ${userErr.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User has no email");
    log("user", { id: user.id, email: user.email });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      log("no stripe customer");
      // Clear any stale active row tied to this user (defensive — keeps history minimal).
      return new Response(
        JSON.stringify({ subscribed: false, reason: "no_customer" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }
    const customer = customers.data[0];
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 5,
    });

    // Pick the most relevant: active/trialing first, then most-recent.
    const active = subs.data.find((s) =>
      ["active", "trialing", "past_due"].includes(s.status)
    ) ?? subs.data.sort((a, b) => b.created - a.created)[0];

    if (!active) {
      log("no subscriptions");
      return new Response(
        JSON.stringify({ subscribed: false, reason: "no_subscription" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const normalized =
      active.status === "active" || active.status === "trialing"
        ? "active"
        : active.status === "past_due"
        ? "past_due"
        : active.status === "canceled" || active.status === "unpaid"
        ? "canceled"
        : active.status;

    const periodEnd = new Date(active.current_period_end * 1000).toISOString();

    const { error: upsertErr } = await admin.from("subscriptions").upsert({
      user_id: user.id,
      status: normalized,
      payment_method: "card",
      stripe_customer_id: customer.id,
      stripe_subscription_id: active.id,
      current_period_end: periodEnd,
      cancel_at_period_end: active.cancel_at_period_end,
    });
    if (upsertErr) throw new Error(`Upsert failed: ${upsertErr.message}`);

    log("synced", { status: normalized, periodEnd });

    return new Response(
      JSON.stringify({
        subscribed: normalized === "active",
        status: normalized,
        current_period_end: periodEnd,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[SYNC-SUBSCRIPTION] error", msg);
    return new Response(JSON.stringify({ error: "sync_failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
