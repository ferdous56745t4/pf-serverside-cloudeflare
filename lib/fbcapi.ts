// lib/fbcapi.ts

export const getCookie = (name: string): string | undefined => {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
};
  
export const generateEventId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback if randomUUID is not available
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
};
  
export const firePixelEvent = (eventName: string, data: any, eventId: string) => {
    if (typeof window !== 'undefined') {
        const dataLayer = (window as any).dataLayer = (window as any).dataLayer || [];
        
        // Push standard GA4 ecommerce payload for Purchases (for standard GTM setups)
        if (eventName === 'Purchase') {
            dataLayer.push({ ecommerce: null }); // Clear previous
            dataLayer.push({
                event: "purchase", // Standard GTM trigger name
                ecommerce: {
                    currency: data.currency,
                    value: data.value,
                    transaction_id: data.order_id || eventId,
                    items: data.contents?.map((item: any) => ({
                        item_id: item.id,
                        item_name: data.content_name || 'Product',
                        price: item.item_price,
                        quantity: item.quantity
                    }))
                }
            });
        }

        // Exact match Custom Event push
        dataLayer.push({
            event: eventName,
            ...data,
            eventId: eventId
        });

        // 🚨 Fallback: Also fire fbq directly if it's available on the page!
        // This ensures the Pixel Helper sees the event even if you haven't set up GTM Triggers for it.
        // Since we supply eventID, Facebook will natively DEDUPLICATE any double-firing.
        const sendFbq = () => {
             if ('fbq' in window && typeof (window as any).fbq === 'function') {
                 (window as any).fbq('track', eventName, data, { eventID: eventId });
             }
        };

        sendFbq();
        // Try again a second later to catch slow GTM pixel injects
        setTimeout(sendFbq, 1500);
    }
};
  
export const sendServerEvent = async (eventName: string, customData: any, userData: any, eventId: string) => {
    try {
        const payload = {
            eventName,
            eventSourceUrl: typeof window !== 'undefined' ? window.location.href : '',
            userData: {
                ...userData,
                fbc: getCookie('_fbc'),
                fbp: getCookie('_fbp'),
                client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            },
            customData,
            eventId,
        };
  
        await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (e) {
        console.error("Failed to send server event", e);
    }
};
