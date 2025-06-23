import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export default convexAuthNextjsMiddleware(async (request: NextRequest, { convexAuth }) => {
  // Check if the user is authenticated using Convex Auth
  const isAuthenticated = await convexAuth.isAuthenticated();
  
  // Define protected routes (all dashboard routes and their subroutes)
  const protectedPaths = [
    '/dashboard',
    // We remove '/invite' from here to make invitation pages public
  ];

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // If trying to access a protected route without authentication
  if (isProtectedPath && !isAuthenticated) {
    console.log(`Unauthorized access attempt to: ${request.nextUrl.pathname}`);
    
    // Redirect to login page with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (isAuthenticated && request.nextUrl.pathname === '/login') {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    const redirectUrl = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Continue with the request
  return NextResponse.next();
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};