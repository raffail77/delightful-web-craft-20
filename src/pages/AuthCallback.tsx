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

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        // For OAuth PKCE flow: exchange the code for a session.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // At this point, AuthProvider's onAuthStateChange/getSession will pick up the session.
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
