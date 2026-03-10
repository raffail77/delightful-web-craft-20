import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

    const userId = claimsData.claims.sub as string;

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("stripe_connect_account_id, stripe_connect_onboarding_complete")
      .eq("user_id", userId)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({ connected: false, onboarding_complete: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    let account;
    try {
      account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    } catch (retrieveErr: any) {
      // Account is stale/invalid — clear it and return disconnected
      console.warn(`Stored Connect account ${profile.stripe_connect_account_id} is invalid, clearing.`, retrieveErr.message);
      await adminSupabase
        .from("profiles")
        .update({ stripe_connect_account_id: null, stripe_connect_onboarding_complete: false })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ connected: false, onboarding_complete: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isComplete = account.details_submitted === true;

    // Update onboarding status if changed
    if (isComplete && !profile.stripe_connect_onboarding_complete) {
      await adminSupabase
        .from("profiles")
        .update({ stripe_connect_onboarding_complete: true })
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({
        connected: true,
        onboarding_complete: isComplete,
        payouts_enabled: account.payouts_enabled,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stripe Connect status error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
