// src/app/login/page.tsx
"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // <-- 1. Import useState
import { useAuthActions } from "@convex-dev/auth/react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react"; // <-- 2. Import the icons

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
  // 3. State to manage password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            void signIn("password", formData);
          }}
        >
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
                className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* --- PASSWORD FIELD WITH VISIBILITY TOGGLE --- */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            {/* 4. A relative container to position the icon inside the input */}
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                // 5. Dynamically set the type based on state
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                required
                // 6. Add padding to the right to make space for the icon
                className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-10 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="••••••••"
              />
              {/* 7. The icon button */}
              <button
                type="button" // Important to prevent form submission
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
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
          {/* --- END OF PASSWORD FIELD --- */}

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
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