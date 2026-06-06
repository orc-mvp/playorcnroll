import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRICE_BRL_CENTS = 490; // R$ 4,90

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await supabase.auth.getClaims(token);
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const userId = claims.claims.sub as string;
    const email = claims.claims.email as string;

    const body = await req.json().catch(() => ({}));
    const method = body.method === "pix" ? "pix" : "card";

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Find or create customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    let customerId = existing.data[0]?.id;
    if (!customerId) {
      const c = await stripe.customers.create({ email, metadata: { user_id: userId } });
      customerId = c.id;
    }

    const origin = req.headers.get("origin") || req.headers.get("referer") || "https://playorcnroll.lovable.app";
    const successUrl = `${origin}/upgrade?status=success`;
    const cancelUrl = `${origin}/upgrade?status=cancel`;

    let session;
    if (method === "card") {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              recurring: { interval: "month" },
              product_data: { name: "Apoiador Orc'n Roll" },
              unit_amount: PRICE_BRL_CENTS,
            },
            quantity: 1,
          },
        ],
        metadata: { user_id: userId },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        payment_method_types: ["pix"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: { name: "Apoiador Orc'n Roll (1 mês via PIX)" },
              unit_amount: PRICE_BRL_CENTS,
            },
            quantity: 1,
          },
        ],
        metadata: { user_id: userId, payment_kind: "pix_monthly" },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
