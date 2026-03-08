import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';

export async function POST(request) {
  try {
    const data = await request.json();
    
    const orderId = `ORD-M-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Usually the payload structure here differs a bit if it's manual, we map it accordingly
    // The previous frontend for manual order probably sends similar structure. 
    // We try to use the raw data directly.
    
    const inserted = await db.insert(orders).values({
      orderId,
      name: data.customerDetails?.firstName || data.name,
      number: data.customerDetails?.phone || data.number,
      address: data.customerDetails?.address || data.address || "",
      shipping: data.shippingInfo?.title || data.shipping || "Inside Dhaka",
      shippingCost: data.shippingInfo?.cost || data.shippingCost || 60,
      totalValue: Number(data.productPrice || data.product?.price || data.totalValue || 0) + Number(data.shippingInfo?.cost || data.shippingCost || 60),
      note: data.note || "",
      status: "Processing",
      phoneCallStatus: "Pending",
      items: data.items || [],
      currency: "BDT",
      marketing: { utm_source: "manual" },
      date: new Date().toISOString()
    }).returning({ id: orders.id, orderId: orders.orderId });
    
    return NextResponse.json({ 
      success: true, 
      orderId: inserted[0].orderId, 
      orderData: {
        attributes: { order_number: inserted[0].orderId, status: "Processing" },
        totals: { total: inserted[0].totalValue },
        customer: { billing: { first_name: inserted[0].name, phone: inserted[0].number } }
      }
    });
  } catch (error) {
    console.error("Manual Order Creation Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
