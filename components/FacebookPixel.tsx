"use client";

import React, { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function PixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    import("react-facebook-pixel")
      .then((x) => x.default)
      .then((ReactPixel) => {
        // Only initialize if not already initialized
        const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
        if (!pixelId) {
          console.warn("Facebook Pixel ID is not defined in NEXT_PUBLIC_FB_PIXEL_ID");
          return;
        }
        
        ReactPixel.init(pixelId);
        // Let lib/fbEvents handle the pageView to keep Event IDs synced, or just rely on manual trigger
      });
  }, [pathname, searchParams]);

  return null;
}

export default function FacebookPixel() {
  return (
    <Suspense fallback={null}>
      <PixelTracker />
    </Suspense>
  );
}
