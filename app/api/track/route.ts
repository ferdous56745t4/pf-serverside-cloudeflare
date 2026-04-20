import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Hash function using native crypto
const hashData = (data: string | null | undefined): string | undefined => {
  if (!data) return undefined;
  const cleanData = data.trim().toLowerCase();
  if (cleanData.length === 0) return undefined;
  return crypto.createHash('sha256').update(cleanData).digest('hex');
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventName, eventSourceUrl, userData = {}, customData = {}, eventId } = body;

    // Get client IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    // Build the CAPI payload
    const capiPayload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: eventSourceUrl,
          event_id: eventId,
          user_data: {
            client_ip_address: userData.client_ip_address || clientIp,
            client_user_agent: userData.client_user_agent || userAgent,
            em: hashData(userData.em),
            ph: hashData(userData.ph),
            fn: hashData(userData.fn),
            ln: hashData(userData.ln),
            fbc: userData.fbc,
            fbp: userData.fbp,
            ...userData.external_id ? { external_id: hashData(userData.external_id) } : {},
          },
          custom_data: customData,
        },
      ],
      ...(process.env.TEST_EVENT_CODE ? { test_event_code: process.env.TEST_EVENT_CODE } : {})
    };

    const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID || process.env.FB_PIXEL_ID;
    const accessToken = process.env.FB_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      console.warn("FB_PIXEL_ID or FB_ACCESS_TOKEN missing. CAPI event not sent.");
      return NextResponse.json({ success: false, message: "Server CAPI tokens not configured" }, { status: 500 });
    }

    const fbGraphUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;

    // Post securely to Facebook
    const fbRes = await fetch(fbGraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(capiPayload),
    });

    if (!fbRes.ok) {
        const errText = await fbRes.text();
        throw new Error(`Facebook CAPI Error: ${fbRes.status} ${errText}`);
    }

    const result = await fbRes.json();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("CAPI API Target Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
