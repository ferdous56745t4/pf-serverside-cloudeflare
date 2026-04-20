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
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
            // Standard Events we track
            const standardEvents = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead', 'CompleteRegistration'];
            
            if (standardEvents.includes(eventName)) {
                fbq('track', eventName, data, { eventID: eventId });
            } else {
                fbq('trackCustom', eventName, data, { eventID: eventId });
            }
        } else {
            console.warn('fbq not found on window, event not fired natively:', eventName);
        }
    }
};
  
export const sendServerEvent = async (eventName: string, customData: any, userData: any, eventId: string) => {
    try {
        // Resolve fbc: cookie > constructed from fbclid > passed userData
        const fbcFromCookie = getCookie('_fbc');
        const fbcConstructed = typeof localStorage !== 'undefined' ? (localStorage.getItem('_fbc_constructed') ?? undefined) : undefined;
        const fbc = userData.fbc || fbcFromCookie || fbcConstructed;

        // Resolve fbp: cookie > localStorage backup (for Safari ITP)
        const fbpFromCookie = getCookie('_fbp');
        const fbpBackup = typeof localStorage !== 'undefined' ? (localStorage.getItem('_fbp_backup') ?? undefined) : undefined;
        const fbp = userData.fbp || fbpFromCookie || fbpBackup;

        const payload = {
            eventName,
            eventSourceUrl: typeof window !== 'undefined' ? window.location.href : '',
            userData: {
                ...userData,
                fbc,
                fbp,
                client_user_agent: userData.client_user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
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
