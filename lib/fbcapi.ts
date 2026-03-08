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
    if (typeof window !== 'undefined' && 'fbq' in window && typeof window.fbq === 'function') {
        const fbq = window.fbq as any;
        fbq('track', eventName, data, { eventID: eventId });
    } else {
        // Retry logic if standard facebook tracking isn't loaded yet
        setTimeout(() => firePixelEvent(eventName, data, eventId), 500);
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
