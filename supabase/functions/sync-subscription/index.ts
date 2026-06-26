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
    const email = user.email.trim().toLowerCase();
    log("user", { id: user.id, email });

    // 1) Look up Stripe customer by metadata.user_id first (most reliable),
    //    then fall back to email search (Stripe email match is case-insensitive but normalize anyway).
    let customer: Stripe.Customer | null = null;

    const byMeta = await stripe.customers.search({
      query: `metadata['user_id']:'${user.id}'`,
      limit: 1,
    }).catch(() => null);
    if (byMeta && byMeta.data.length > 0) {
      customer = byMeta.data[0];
      log("customer via metadata", { id: customer.id });
    } else {
      const byEmail = await stripe.customers.list({ email, limit: 10 });
      // Pick the customer that has a subscription (active preferred) if multiple share the email.
      if (byEmail.data.length > 0) {
        let best: Stripe.Customer | null = null;
        let bestScore = -1;
        for (const c of byEmail.data) {
          const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 5 });
          const score = subs.data.reduce((acc, s) => {
            if (s.status === "active" || s.status === "trialing") return Math.max(acc, 3);
            if (s.status === "past_due") return Math.max(acc, 2);
            return Math.max(acc, 1);
          }, 0);
          if (score > bestScore) {
            bestScore = score;
            best = c;
          }
        }
        customer = best ?? byEmail.data[0];
        log("customer via email", { id: customer.id, picked_from: byEmail.data.length });
      }
    }

    if (!customer) {
      log("no stripe customer");
      return new Response(
        JSON.stringify({ subscribed: false, reason: "no_customer" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 2) Stamp metadata.user_id on the Stripe customer so future webhooks resolve the right user_id.
    if (customer.metadata?.user_id !== user.id) {
      try {
        await stripe.customers.update(customer.id, {
          metadata: { ...(customer.metadata ?? {}), user_id: user.id },
        });
        log("customer metadata updated with user_id");
      } catch (e) {
        log("customer metadata update failed", String(e));
      }
    }

    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 5,
    });

    const active = subs.data.find((s) =>
      ["active", "trialing", "past_due"].includes(s.status)
    ) ?? subs.data.sort((a, b) => b.created - a.created)[0];

    if (!active) {
      log("no subscriptions for customer");
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

    // Resolve plan name from the subscription's first price product.
    let planName: string | null = null;
    try {
      const firstItem = active.items.data[0];
      const price = firstItem?.price;
      if (price) {
        const productId = typeof price.product === "string" ? price.product : price.product?.id;
        if (productId) {
          const product = await stripe.products.retrieve(productId);
          planName = product.name ?? null;
        }
      }
    } catch (e) {
      log("plan name resolution failed", String(e));
    }

    // 3) If a row exists with this stripe_customer_id but a different user_id (legacy duplicate),
    //    detach it so the current user takes ownership cleanly. PK is user_id, so we can't have
    //    two rows for the same user; but two rows for the same customer would be ambiguous.
    const { data: orphan } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customer.id)
      .neq("user_id", user.id)
      .maybeSingle();
    if (orphan) {
      log("detaching orphan row", { previous_user_id: orphan.user_id });
      await admin
        .from("subscriptions")
        .update({ stripe_customer_id: null, stripe_subscription_id: null, status: "canceled" })
        .eq("user_id", orphan.user_id);
    }

    const { error: upsertErr } = await admin.from("subscriptions").upsert({
      user_id: user.id,
      status: normalized,
      payment_method: "card",
      stripe_customer_id: customer.id,
      stripe_subscription_id: active.id,
      current_period_end: periodEnd,
      cancel_at_period_end: active.cancel_at_period_end,
      plan_name: planName,
    });
    if (upsertErr) throw new Error(`Upsert failed: ${upsertErr.message}`);

    log("synced", { user_id: user.id, status: normalized, periodEnd, planName });

    return new Response(
      JSON.stringify({
        subscribed: normalized === "active",
        status: normalized,
        current_period_end: periodEnd,
        plan_name: planName,
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
