import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Clock, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const resetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthMode = "signin" | "signup" | "forgot" | "reset";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") as AuthMode || "signin";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signUp, signIn, signInWithGoogle, resetPassword, updatePassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && mode !== "reset") {
      navigate("/");
    }
  }, [user, navigate, mode]);

  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const newPasswordForm = useForm({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSignUp = async (data: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);

    if (error) {
      let message = "Failed to create account";
      if (error.message?.includes("already registered")) {
        message = "An account with this email already exists";
      }
      toast({ title: "Error", description: message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Account created successfully. Welcome to TimeBank!" });
      // Don't navigate immediately - let the useEffect handle it when user state updates
      // This gives time for onAuthStateChange to fire and set the user
    }
  };

  const handleSignIn = async (data: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      let message = "Invalid email or password";
      if (error.message?.includes("Invalid login")) {
        message = "Invalid email or password";
      }
      toast({ title: "Error", description: message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "You've successfully signed in" });
      navigate("/");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    setIsLoading(false);

    if (error) {
      toast({ title: "Error", description: "Failed to sign in with Google", variant: "destructive" });
    }
  };

  const handleForgotPassword = async (data: z.infer<typeof resetSchema>) => {
    setIsLoading(true);
    const { error } = await resetPassword(data.email);
    setIsLoading(false);

    if (error) {
      toast({ title: "Error", description: "Failed to send reset email", variant: "destructive" });
    } else {
      toast({ title: "Email Sent", description: "Check your inbox for the password reset link" });
    }
  };

  const handleUpdatePassword = async (data: z.infer<typeof newPasswordSchema>) => {
    setIsLoading(true);
    const { error } = await updatePassword(data.password);
    setIsLoading(false);

    if (error) {
      toast({ title: "Error", description: "Failed to update password", variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Your password has been updated" });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6 text-navy" />
          </div>
          <span className="text-3xl font-serif font-bold text-foreground">
            Time<span className="text-gold">Bank</span>
          </span>
        </a>

        {/* Auth Card */}
        <div className="glass-card p-8 rounded-2xl">
          {mode === "signin" && (
            <>
              <h1 className="text-2xl font-serif font-bold text-center mb-2">Welcome Back</h1>
              <p className="text-muted-foreground text-center mb-6">Sign in to your TimeBank account</p>
              
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      {...signInForm.register("email")}
                    />
                  </div>
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...signInForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-gold hover:text-gold-dark transition-colors"
                >
                  Forgot password?
                </button>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                  or
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <p className="text-center mt-6 text-muted-foreground">
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-gold hover:text-gold-dark font-medium">
                  Sign up
                </button>
              </p>
            </>
          )}

          {mode === "signup" && (
            <>
              <h1 className="text-2xl font-serif font-bold text-center mb-2">Create Account</h1>
              <p className="text-muted-foreground text-center mb-6">Join TimeBank and start exchanging skills</p>
              
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      {...signUpForm.register("fullName")}
                    />
                  </div>
                  {signUpForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      {...signUpForm.register("email")}
                    />
                  </div>
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signupPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...signUpForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...signUpForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                  or
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <p className="text-center mt-6 text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-gold hover:text-gold-dark font-medium">
                  Sign in
                </button>
              </p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <button
                onClick={() => setMode("signin")}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
              
              <h1 className="text-2xl font-serif font-bold text-center mb-2">Reset Password</h1>
              <p className="text-muted-foreground text-center mb-6">Enter your email to receive a reset link</p>
              
              <form onSubmit={resetForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      {...resetForm.register("email")}
                    />
                  </div>
                  {resetForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{resetForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          )}

          {mode === "reset" && (
            <>
              <h1 className="text-2xl font-serif font-bold text-center mb-2">New Password</h1>
              <p className="text-muted-foreground text-center mb-6">Enter your new password</p>
              
              <form onSubmit={newPasswordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...newPasswordForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {newPasswordForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{newPasswordForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newConfirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="newConfirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...newPasswordForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {newPasswordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{newPasswordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
