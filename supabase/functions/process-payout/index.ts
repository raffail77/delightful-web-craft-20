import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserId = claimsData.claims.sub as string;

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const { data: roleData } = await adminSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { withdrawal_id } = body;
    if (!withdrawal_id || typeof withdrawal_id !== "string" || !isValidUUID(withdrawal_id)) {
      return new Response(JSON.stringify({ error: "Valid withdrawal_id (UUID) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get withdrawal details
    const { data: withdrawal, error: wErr } = await adminSupabase
      .from("withdrawal_requests")
      .select("*")
      .eq("id", withdrawal_id)
      .single();

    if (wErr || !withdrawal) {
      return new Response(JSON.stringify({ error: "Withdrawal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (withdrawal.status !== "pending") {
      return new Response(JSON.stringify({ error: "Withdrawal already processed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's Stripe Connect account
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("stripe_connect_account_id, stripe_connect_onboarding_complete, time_credits, earned_credits")
      .eq("user_id", withdrawal.user_id)
      .single();

    if (!profile?.stripe_connect_account_id || !profile.stripe_connect_onboarding_complete) {
      await adminSupabase
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          notes: "User has not connected a Stripe account for payouts",
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawal_id);

      return new Response(
        JSON.stringify({ error: "User has not connected a Stripe payout account", rejected: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const netAmountCents = Math.round(Number(withdrawal.net_amount) * 100);

    const transfer = await stripe.transfers.create({
      amount: netAmountCents,
      currency: "usd",
      destination: profile.stripe_connect_account_id,
      description: `Withdrawal of ${withdrawal.credits_amount} credits`,
      metadata: {
        withdrawal_id: withdrawal.id,
        user_id: withdrawal.user_id,
      },
    });
    const transferId = transfer.id;

    // Deduct credits from profile
    await adminSupabase
      .from("profiles")
      .update({
        time_credits: profile.time_credits - withdrawal.credits_amount,
        earned_credits: profile.earned_credits - withdrawal.credits_amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", withdrawal.user_id);

    // Mark withdrawal as completed
    await adminSupabase
      .from("withdrawal_requests")
      .update({
        status: "completed",
        notes: `Stripe transfer: ${transferId}`,
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal_id);

    return new Response(
      JSON.stringify({ success: true, transfer_id: transferId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payout error:", error);
    const isStripeError = error?.type?.startsWith("Stripe");
    const status = isStripeError ? 400 : 500;
    const message = error?.code === "balance_insufficient"
      ? "Insufficient Stripe platform balance to process this payout. Please add funds to your Stripe account first."
      : error.message;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
