"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function FacebookPixel() {
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
        // Just for initialization here
      });
  }, [pathname, searchParams]);

  return null;
}
