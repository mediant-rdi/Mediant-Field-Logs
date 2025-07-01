// src/app/login/page.tsx
"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <>
      <Authenticated>
        <RedirectToDashboard />
      </Authenticated>
      
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
    </>
  );
}

function RedirectToDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    // OPTIMIZATION: Preload the dashboard page's code to make the
    // subsequent navigation feel instantaneous.
    import('../dashboard/page');
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}

function SignIn() {
  const { signIn } = useAuthActions();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced error message mapping for Convex auth errors
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      const message = err.message.toLowerCase();
      const originalMessage = err.message;
      
      // Handle specific Convex authentication errors
      if (message.includes("incorrect password") || message.includes("wrong password") || message.includes("invalid password")) {
        return "The password you entered is incorrect. Please check your password and try again.";
      }
      
      if (message.includes("no user") || message.includes("user not found") || message.includes("account not found")) {
        return "No account was found with that email address. Please check your email or contact the RDI team.";
      }
      
      // Handle common Convex auth server errors that should be user-friendly
      if (message.includes("invalidsecret") || message.includes("invalid secret") || 
          message.includes("unauthorized") || message.includes("authentication failed")) {
        return "Invalid email or password. Please check your credentials and try again.";
      }
      
      if (message.includes("invalid email") || message.includes("email format")) {
        return "Please enter a valid email address.";
      }
      
      if (message.includes("account not activated") || message.includes("account disabled")) {
        return "Your account has not been activated yet. Please contact the RDI team.";
      }
      
      if (message.includes("too many attempts") || message.includes("rate limit")) {
        return "Too many login attempts. Please wait a few minutes before trying again.";
      }
      
      if (message.includes("network") || message.includes("connection")) {
        return "Network connection error. Please check your internet connection and try again.";
      }
      
      if (message.includes("timeout")) {
        return "The request timed out. Please try again.";
      }
      
      // Handle server errors that contain technical details
      if (message.includes("server error") || message.includes("internal error") || 
          originalMessage.includes("[Request ID:")) {
        return "Invalid email or password. Please check your credentials and try again.";
      }
      
      // If it's a short, readable error message, show it
      if (originalMessage && originalMessage.length < 80 && !originalMessage.includes("[Request ID:")) {
        return originalMessage.charAt(0).toUpperCase() + originalMessage.slice(1) + (originalMessage.endsWith('.') ? '' : '.');
      }
    }
    
    // Default fallback message for authentication errors
    return "Invalid email or password. Please check your credentials and try again.";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData(event.currentTarget as HTMLFormElement);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // Basic client-side validation
      if (!email || !email.trim()) {
        setError("Please enter your email address.");
        return;
      }

      if (!password || !password.trim()) {
        setError("Please enter your password.");
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      await signIn("password", formData);
      // If successful, the <Authenticated> component will handle the redirect
      
    } catch (err: unknown) {
      console.error("Login error:", err); // Keep for debugging
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-6 shadow-md sm:p-8">
        <div className="text-center">
          <Image
            src="/images/logo.jpg"
            alt="Mediant Logo"
            width={70}
            height={70}
            className="mx-auto rounded-full"
            priority
          />
          <h1 className="mt-5 text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Sign In to Your Account
          </h1>
        </div>

        {/* Enhanced error display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 leading-relaxed">
                  {error}
                </p>
                {error.includes("contact the RDI team") && (
                  <p className="text-xs text-red-600 mt-2">
                    Need help? Reach out to your administrator.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <input name="flow" type="hidden" value="signIn" />
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
                className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="you@mediantinternational.com"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-10 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              >
                {isPasswordVisible ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center items-center rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
        
        <p className="text-center text-sm text-slate-500">
          Do not have an account? Contact the RDI team.
        </p>
      </div>
    </div>
  );
}