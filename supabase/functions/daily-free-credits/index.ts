import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require shared cron secret
    const cronSecret = Deno.env.get("CRON_SECRET");
    const reqSecret = req.headers.get("x-cron-secret");
    if (!cronSecret || reqSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, last_free_credits_at, time_credits");

    if (profilesError) throw profilesError;

    let granted = 0;
    let skipped = 0;
    const now = new Date().toISOString();

    for (const profile of profiles || []) {
      const cutoff = profile.last_free_credits_at || profile.created_at || "1970-01-01T00:00:00Z";

      // Check if user has spent at least 1 credit since last grant
      // (i.e., they appear as sender_id in a completed transaction since cutoff)
      const { count, error: txError } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", profile.user_id)
        .eq("status", "completed")
        .gte("created_at", cutoff);

      if (txError) {
        console.error(`Error checking transactions for ${profile.user_id}:`, txError);
        skipped++;
        continue;
      }

      if ((count || 0) > 0) {
        // User has spent credits — grant 5 free credits
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            time_credits: (profile.time_credits || 0) + 5,
            bonus_credits: 5,
            last_free_credits_at: now,
          })
          .eq("user_id", profile.user_id);

        if (updateError) {
          console.error(`Error granting credits to ${profile.user_id}:`, updateError);
          skipped++;
        } else {
          granted++;
        }
      } else {
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        granted,
        skipped,
        total: profiles?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Daily free credits error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
