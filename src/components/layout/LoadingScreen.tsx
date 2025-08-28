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
        {/* Reserve exact space to prevent layout shift */}
        <div className="w-[150px] h-[150px] flex items-center justify-center">
          <Image
            src="/images/logo.jpg" // Use the path to your logo from the `public` folder
            alt="Mediant Logo"
            width={150} // The intrinsic (original) width of the image file
            height={150} // The intrinsic (original) height of the image file
            priority // Tells Next.js to load this image first
            className="animate-pulse" // Adds a subtle pulsing effect
            // Fixed dimensions to prevent any layout shift
            style={{ 
              width: '150px', 
              height: '150px',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>
    </div>
  );
}