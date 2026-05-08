import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret || !sig) {
      console.error("Webhook misconfigured: missing secret or signature");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const userId = metadata.user_id;
      const credits = parseInt(metadata.credits || "0");
      const purchaseId = metadata.purchase_id;

      if (!userId || !credits) {
        console.error("Missing metadata in session:", session.id);
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Processing payment: user=${userId}, credits=${credits}, purchase=${purchaseId}`);

      if (purchaseId) {
        await adminClient
          .from("credit_purchases")
          .update({
            status: "completed",
            stripe_payment_intent_id: session.payment_intent as string,
            completed_at: new Date().toISOString(),
          })
          .eq("id", purchaseId);
      }

      const { data: profile } = await adminClient
        .from("profiles")
        .select("time_credits")
        .eq("user_id", userId)
        .single();

      if (profile) {
        await adminClient
          .from("profiles")
          .update({
            time_credits: profile.time_credits + credits,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }

      await adminClient.from("transactions").insert({
        sender_id: userId,
        receiver_id: userId,
        amount: credits,
        transaction_type: "bonus",
        status: "completed",
        description: `Purchased ${credits} credits via Stripe`,
        completed_at: new Date().toISOString(),
      });

      console.log(`Successfully added ${credits} credits to user ${userId}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
