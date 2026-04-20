"use client";

import React, { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

function PixelTracker({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track PageView on route changes
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

export default function FacebookPixel() {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  if (!pixelId) {
    console.error("Facebook Pixel ID is not defined in NEXT_PUBLIC_FB_PIXEL_ID. Pixel will not load.");
    return null;
  }

  return (
    <>
      {/* 1. Inject Standard Meta Pixel Base Script */}
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
          `,
        }}
      />
      
      {/* 2. Track Route Changes Safely inside Suspense */}
      <Suspense fallback={null}>
        <PixelTracker pixelId={pixelId} />
      </Suspense>
    </>
  );
}
