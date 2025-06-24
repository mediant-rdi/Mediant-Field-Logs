// src/components/layout/LoadingScreen.tsx

import Image from "next/image";

export function LoadingScreen() {
  return (
    // This div centers your logo on the screen
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        {/* 
          IMPORTANT: Make sure your logo is placed in the public folder.
          For example: /public/images/logo.png 
        */}
        <Image
          src="/images/logo.jpg" // Use the path to your logo from the `public` folder
          alt="Mediant Logo"
          width={150} // Adjust width as needed
          height={150} // Adjust height as needed
          priority // Tells Next.js to load this image first
          className="animate-pulse" // Adds a subtle pulsing effect
        />
      </div>
    </div>
  );
}