import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_ORIGINS = [
  "https://playorcnroll.lovable.app",
  "https://play.orcnroll.com",
  "http://localhost:8080",
];

function safeOrigin(req: Request): string {
  const raw = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(raw) ? raw : "https://playorcnroll.lovable.app";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const email = userData.user.email;

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data[0]) {
      return new Response(JSON.stringify({ error: "No customer" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const origin = safeOrigin(req);
    const portal = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/upgrade`,
    });
    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("customer-portal error", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
