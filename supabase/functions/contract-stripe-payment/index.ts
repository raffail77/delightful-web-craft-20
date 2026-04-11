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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!stripeKey) throw new Error("Stripe not configured");

    // Auth
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { contract_id } = await req.json();
    if (!contract_id) throw new Error("Missing contract_id");

    // Fetch contract
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: contract, error: fetchError } = await adminClient
      .from("contracts")
      .select("*")
      .eq("id", contract_id)
      .single();

    if (fetchError || !contract) throw new Error("Contract not found");
    if (contract.client_id !== user.id) throw new Error("Only the client can pay");
    if (contract.status !== "pending_payment") throw new Error("Contract is not awaiting payment");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Calculate USD amount ($2 per credit)
    const amountCents = contract.agreed_credits * 200;

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const origin = req.headers.get("origin") || "https://lovable.dev";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Contract Payment: ${contract.title}`,
              description: `Service contract - ${contract.agreed_credits} credits equivalent`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        capture_method: "automatic",
        metadata: {
          contract_id: contract.id,
          client_id: user.id,
          provider_id: contract.provider_id,
        },
      },
      metadata: {
        contract_id: contract.id,
        type: "contract_payment",
      },
      success_url: `${origin}/contracts?payment=success&contract=${contract.id}`,
      cancel_url: `${origin}/contracts?payment=cancelled&contract=${contract.id}`,
    });

    // Store the session ID for verification
    await adminClient
      .from("contracts")
      .update({ stripe_payment_intent_id: session.id })
      .eq("id", contract.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Contract payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
