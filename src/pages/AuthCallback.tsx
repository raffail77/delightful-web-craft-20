import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExchanging, setIsExchanging] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const waitForSession = async () => {
      // The auth client may need a moment to persist the session after redirect.
      for (let i = 0; i < 20; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) return session;
        await sleep(150);
      }
      return null;
    };

    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const oauthError =
          url.searchParams.get("error_description") || url.searchParams.get("error");

        // If the provider redirected back with an error, surface it.
        if (oauthError) {
          throw new Error(decodeURIComponent(oauthError));
        }

        // PKCE flow: exchange the code for a session.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // Whether PKCE (code) or implicit (hash), wait until the session is actually available.
        const session = await waitForSession();
        if (!session) {
          throw new Error(
            "Google sign-in returned to the app, but no login session was created. This is almost always caused by a redirect URL mismatch (common in local development). Make sure your backend auth redirect URLs include this exact URL: " +
              window.location.origin +
              "/auth/callback"
          );
        }

        if (!cancelled) navigate("/", { replace: true });
      } catch (err: any) {
        if (!cancelled) {
          toast({
            title: "Sign-in failed",
            description:
              err?.message ||
              "We couldn't complete Google sign-in. Please try again.",
            variant: "destructive",
          });
          navigate("/auth", { replace: true });
        }
      } finally {
        if (!cancelled) setIsExchanging(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <section className="glass-card rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-serif font-bold">Signing you in…</h1>
        <p className="text-muted-foreground mt-2">
          {isExchanging
            ? "Finishing Google sign-in and loading your account."
            : "Redirecting…"}
        </p>
        <div className="mt-6 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/2 bg-primary animate-pulse" />
        </div>
      </section>
    </main>
  );
};

export default AuthCallback;
