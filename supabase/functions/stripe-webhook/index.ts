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

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" });
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret || !sig) {
      console.error("Webhook misconfigured: missing secret or signature");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Webhook event: ${event.type} (${event.id})`);

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        // Route by metadata.type
        if (metadata.type === "contract_payment") {
          const contractId = metadata.contract_id;
          if (!contractId) {
            console.error("Missing contract_id in session metadata", session.id);
            break;
          }

          const { data: contract } = await adminClient
            .from("contracts")
            .select("id, client_id, status")
            .eq("id", contractId)
            .single();

          if (!contract) {
            console.error("Contract not found for webhook:", contractId);
            break;
          }

          if (contract.status !== "pending_payment") {
            console.log(`Contract ${contractId} already processed (status=${contract.status})`);
            break;
          }

          const { error: rpcError } = await adminClient.rpc("pay_contract_stripe", {
            p_contract_id: contract.id,
            p_user_id: contract.client_id,
            p_payment_intent_id: session.payment_intent as string,
          });

          if (rpcError) {
            console.error("pay_contract_stripe RPC error:", rpcError);
            throw new Error(rpcError.message);
          }

          console.log(`Contract ${contractId} activated via webhook`);
          break;
        }

        // Default: credit pack purchase
        const userId = metadata.user_id;
        const credits = parseInt(metadata.credits || "0");
        const purchaseId = metadata.purchase_id;

        if (!userId || !credits) {
          console.error("Missing metadata in session:", session.id);
          break;
        }

        // Atomic: only credit if purchase row flips from pending -> completed
        if (purchaseId) {
          const { data: locked, error: lockError } = await adminClient
            .from("credit_purchases")
            .update({
              status: "completed",
              stripe_payment_intent_id: session.payment_intent as string,
              completed_at: new Date().toISOString(),
            })
            .eq("id", purchaseId)
            .eq("status", "pending")
            .select("id")
            .maybeSingle();

          if (lockError) {
            console.error("Failed to lock purchase:", lockError);
            break;
          }

          if (!locked) {
            console.log(`Purchase ${purchaseId} already processed, skipping credit grant`);
            break;
          }
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

        console.log(`Added ${credits} credits to user ${userId}`);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        if (metadata.type === "contract_payment" && metadata.contract_id) {
          await adminClient
            .from("contracts")
            .update({ status: "cancelled" })
            .eq("id", metadata.contract_id)
            .eq("status", "pending_payment");
          console.log(`Contract ${metadata.contract_id} cancelled (async payment failed)`);
        } else if (metadata.purchase_id) {
          await adminClient
            .from("credit_purchases")
            .update({ status: "failed" })
            .eq("id", metadata.purchase_id)
            .eq("status", "pending");
          console.log(`Purchase ${metadata.purchase_id} marked failed`);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const isComplete = account.details_submitted === true;

        const { data: profile } = await adminClient
          .from("profiles")
          .select("user_id, stripe_connect_onboarding_complete")
          .eq("stripe_connect_account_id", account.id)
          .maybeSingle();

        if (!profile) {
          console.log(`No profile found for Connect account ${account.id}`);
          break;
        }

        if (profile.stripe_connect_onboarding_complete !== isComplete) {
          await adminClient
            .from("profiles")
            .update({ stripe_connect_onboarding_complete: isComplete })
            .eq("user_id", profile.user_id);
          console.log(`Profile ${profile.user_id} onboarding_complete -> ${isComplete}`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log(`Charge refunded: ${charge.id}, amount=${charge.amount_refunded}`);
        // Log only — manual review recommended for credit reversal
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
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
