import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TransferRequest {
  receiver_id: string;
  amount: number;
  service_id?: string;
  description?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's token for auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body: TransferRequest = await req.json();
    const { receiver_id, amount, service_id, description } = body;

    // Validate input
    if (!receiver_id || typeof receiver_id !== "string") {
      return new Response(JSON.stringify({ error: "Invalid receiver_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (user.id === receiver_id) {
      return new Response(JSON.stringify({ error: "Cannot transfer credits to yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for the actual transfer (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify receiver exists
    const { data: receiverProfile, error: receiverError } = await adminClient
      .from("profiles")
      .select("user_id, full_name")
      .eq("user_id", receiver_id)
      .single();

    if (receiverError || !receiverProfile) {
      console.error("Receiver not found:", receiverError);
      return new Response(JSON.stringify({ error: "Receiver not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call the secure transfer function
    const { data: transactionId, error: transferError } = await adminClient.rpc(
      "transfer_credits",
      {
        p_sender_id: user.id,
        p_receiver_id: receiver_id,
        p_amount: amount,
        p_service_id: service_id || null,
        p_description: description || `Transfer to ${receiverProfile.full_name || "user"}`,
      }
    );

    if (transferError) {
      console.error("Transfer error:", transferError);
      
      // Parse the error message for user-friendly response
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
