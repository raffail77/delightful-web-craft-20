import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@22.1.1";
import { checkRateLimit, rateLimitHeaders, getRateLimitKey } from "../_shared/rate-limit.ts";

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
    // Rate limit: 5 checkout sessions per minute per IP
    const rlKey = getRateLimitKey(req, "checkout");
    const rl = checkRateLimit(rlKey, 5, 60_000);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, ...rateLimitHeaders(rl.remaining, rl.retryAfterMs), "Content-Type": "application/json" },
      });
    }

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

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;
    const userId = user.id;
    const userEmail = user.email;

    // Parse and validate body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { package_id } = body;
    if (!package_id || typeof package_id !== "string" || !isValidUUID(package_id)) {
      return new Response(JSON.stringify({ error: "Valid package_id (UUID) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch package
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: pkg, error: pkgError } = await adminClient
      .from("credit_packages")
      .select("*")
      .eq("id", package_id)
      .eq("is_active", true)
      .single();

    if (pkgError || !pkg) {
      return new Response(JSON.stringify({ error: "Package not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create purchase record
    const { data: purchase } = await adminClient
      .from("credit_purchases")
      .insert({
        user_id: userId,
        package_id: pkg.id,
        credits: pkg.credits,
        amount_usd: pkg.price_usd,
        status: "pending",
      })
      .select("id")
      .single();

    // Get origin for redirect — validate it's from our domain
    const rawOrigin = req.headers.get("origin") || "";
    const allowedOriginPattern = /^https?:\/\/(localhost(:\d+)?|.*\.lovable\.app)$/;
    const origin = allowedOriginPattern.test(rawOrigin)
      ? rawOrigin
      : "https://id-preview--a93a3514-3c80-4bad-bd2e-7da43ca74999.lovable.app";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${pkg.name} - ${pkg.credits} Credits`,
              description: `Purchase ${pkg.credits} platform credits`,
            },
            unit_amount: Math.round(Number(pkg.price_usd) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/wallet?payment=success`,
      cancel_url: `${origin}/buy-credits?payment=cancelled`,
      metadata: {
        purchase_id: purchase?.id || "",
        user_id: userId,
        credits: String(pkg.credits),
        package_id: pkg.id,
      },
    });

    // Update purchase with session ID
    if (purchase?.id) {
      await adminClient
        .from("credit_purchases")
        .update({ stripe_session_id: session.id })
        .eq("id", purchase.id);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
