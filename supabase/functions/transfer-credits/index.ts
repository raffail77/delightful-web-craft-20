import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitHeaders, getRateLimitKey } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Inline validation helpers (no external deps in Deno edge functions)
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function sanitizeString(str: string, maxLen: number): string {
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

interface TransferRequest {
  receiver_id: string;
  amount: number;
  service_id?: string;
  description?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: 10 transfers per minute per IP
    const rlKey = getRateLimitKey(req, "transfer");
    const rl = checkRateLimit(rlKey, 10, 60_000);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, ...rateLimitHeaders(rl.remaining, rl.retryAfterMs), "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let body: TransferRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { receiver_id, amount, service_id, description } = body;

    // Validate receiver_id is a proper UUID
    if (!receiver_id || typeof receiver_id !== "string" || !isValidUUID(receiver_id)) {
      return new Response(JSON.stringify({ error: "Invalid receiver_id: must be a valid UUID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate amount
    if (!amount || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
      return new Response(JSON.stringify({ error: "Amount must be a positive integer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount > 1000) {
      return new Response(JSON.stringify({ error: "Maximum transfer amount is 1000 credits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate optional service_id
    if (service_id && !isValidUUID(service_id)) {
      return new Response(JSON.stringify({ error: "Invalid service_id format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize description
    const sanitizedDescription = description
      ? sanitizeString(description, 500)
      : undefined;

    if (user.id === receiver_id) {
      return new Response(JSON.stringify({ error: "Cannot transfer credits to yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: receiverProfile, error: receiverError } = await adminClient
      .from("profiles")
      .select("user_id, full_name")
      .eq("user_id", receiver_id)
      .single();

    if (receiverError || !receiverProfile) {
      return new Response(JSON.stringify({ error: "Receiver not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: transactionId, error: transferError } = await adminClient.rpc(
      "transfer_credits",
      {
        p_sender_id: user.id,
        p_receiver_id: receiver_id,
        p_amount: amount,
        p_service_id: service_id || null,
        p_description: sanitizedDescription || `Transfer to ${receiverProfile.full_name || "user"}`,
      }
    );

    if (transferError) {
      console.error("Transfer error:", transferError);

      if (transferError.message.includes("Insufficient credits")) {
        return new Response(JSON.stringify({ error: "Insufficient credits" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Transfer failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Transfer successful: ${user.id} -> ${receiver_id}, amount: ${amount}, tx: ${transactionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        message: `Successfully transferred ${amount} credits`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
