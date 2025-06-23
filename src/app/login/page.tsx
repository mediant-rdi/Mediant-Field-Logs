// src/app/login/page.tsx
"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        {/* Changed spinner color to match app's blue theme */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

function SignIn() {
  const { signIn } = useAuthActions();

  // Simplified logic since sign-up is removed from UI
  const title = "Sign In to Your Account";
  const buttonText = "Sign In";

  return (
    // Main container to center the form on the page
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      {/* Styled the card to match the dashboard's look and feel */}
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div>
          {/* Adjusted heading style for consistency */}
          <h1 className="text-center text-2xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        </div>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            // Since there's no sign-up flow, we can simplify this call
            void signIn("password", formData);
          }}
        >
          {/* This hidden input is crucial, hardcoded to "signIn" */}
          <input name="flow" type="hidden" value="signIn" />

          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                // Changed focus ring color from indigo to blue
                className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                // Changed focus ring color from indigo to blue
                className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              // Changed button color from indigo to blue for consistency
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {buttonText}
            </button>
          </div>
        </form>

        {/* Replaced the sign-up link with the requested text */}
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Do not have an account? Contact the RDI team
        </p>
      </div>
    </div>
  );
}