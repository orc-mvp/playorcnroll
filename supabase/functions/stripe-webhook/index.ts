import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function resolveUserId(customerId: string, fallbackEmail?: string | null): Promise<string | null> {
  // Try existing subscription row
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (existing?.user_id) return existing.user_id;

  // Try Stripe customer metadata
  try {
    const c = await stripe.customers.retrieve(customerId);
    if (!c.deleted) {
      const uid = (c as Stripe.Customer).metadata?.user_id;
      if (uid) return uid;
      const email = (c as Stripe.Customer).email || fallbackEmail;
      if (email) {
        const { data } = await supabase.auth.admin.listUsers();
        const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
        if (u) return u.id;
      }
    }
  } catch (e) {
    console.error("resolveUserId stripe error", e);
  }
  return null;
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }
  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (e) {
    console.error("Webhook signature failed", e);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId = await resolveUserId(customerId);
        if (!userId) break;
        const status =
          sub.status === "active" || sub.status === "trialing"
            ? "active"
            : sub.status === "past_due"
            ? "past_due"
            : sub.status === "canceled" || sub.status === "unpaid"
            ? "canceled"
            : sub.status;
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          status,
          payment_method: "card",
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (!userId) break;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", cancel_at_period_end: true })
          .eq("user_id", userId);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const userId = await resolveUserId(inv.customer as string);
        if (!userId) break;
        await supabase.from("subscriptions").update({ status: "past_due" }).eq("user_id", userId);
        break;
      }
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        if (cs.mode === "subscription" && cs.payment_status === "paid") {
          const customerId = cs.customer as string;
          const userId = await resolveUserId(customerId, cs.customer_email);
          if (!userId) break;

          await supabase.from("subscriptions").upsert({
            user_id: userId,
            status: "active",
            payment_method: "card",
            stripe_customer_id: customerId,
            stripe_subscription_id: cs.subscription as string,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: false,
          });
        }
        break;
      }
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook handler error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
