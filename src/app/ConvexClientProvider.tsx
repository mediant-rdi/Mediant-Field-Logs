"use client";
 
import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { LoadingScreen } from "@/components/layout/LoadingScreen"; // Import the loading screen
 
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
 
/**
 * This internal component checks the authentication loading state.
 * It will render the LoadingScreen until Convex has determined
 * if a user is logged in or not.
 */
function AppWithAuth({ children }: { children: ReactNode }) {
  const { isLoading } = useConvexAuth();
  if (isLoading) {
    return <LoadingScreen />;
  }
  return <>{children}</>;
}
 
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    // The base ConvexProvider is needed for the hook to work
    <ConvexProvider client={convex}>
      <ConvexAuthNextjsProvider client={convex}>
        <AppWithAuth>{children}</AppWithAuth>
      </ConvexAuthNextjsProvider>
    </ConvexProvider>
  );
}