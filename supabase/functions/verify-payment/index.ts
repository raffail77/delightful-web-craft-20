import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@22.1.1";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("Auth error in verify-payment:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" });

    // Find pending purchases for this user
    const { data: pendingPurchases } = await adminClient
      .from("credit_purchases")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .not("stripe_session_id", "is", null);

    if (!pendingPurchases || pendingPurchases.length === 0) {
      return new Response(JSON.stringify({ message: "No pending purchases to verify" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let creditsAdded = 0;

    for (const purchase of pendingPurchases) {
      try {
        const session = await stripe.checkout.sessions.retrieve(purchase.stripe_session_id);

        if (session.payment_status === "paid") {
          // Atomic: only credit if THIS call flips status pending -> completed.
          const { data: locked } = await adminClient
            .from("credit_purchases")
            .update({
              status: "completed",
              stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
              completed_at: new Date().toISOString(),
            })
            .eq("id", purchase.id)
            .eq("status", "pending")
            .select("id")
            .maybeSingle();

          if (!locked) {
            console.log(`Purchase ${purchase.id} already credited by webhook, skipping`);
            continue;
          }



          // Add credits to user
          const { data: profile } = await adminClient
            .from("profiles")
            .select("time_credits, bonus_credits")
            .eq("user_id", userId)
            .single();

          if (profile) {
            await adminClient
              .from("profiles")
              .update({
                time_credits: profile.time_credits + purchase.credits,
                bonus_credits: profile.bonus_credits + purchase.credits,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);
          }

          // Record transaction
          await adminClient.from("transactions").insert({
            sender_id: userId,
            receiver_id: userId,
            amount: purchase.credits,
            transaction_type: "bonus",
            status: "completed",
            description: `Purchased ${purchase.credits} credits via Stripe`,
            completed_at: new Date().toISOString(),
          });

          creditsAdded += purchase.credits;
          console.log(`Verified and completed purchase ${purchase.id}: ${purchase.credits} credits`);
        }
      } catch (err) {
        console.error(`Error verifying purchase ${purchase.id}:`, err.message);
      }
    }

    return new Response(JSON.stringify({ success: true, credits_added: creditsAdded }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
