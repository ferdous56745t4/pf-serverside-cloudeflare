"use server";
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';

export default async function getAllOrders() {
  try {
    let allOrders = await db.select().from(orders);
    allOrders.sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
    
    return allOrders.map(o => {
      const info = (o.clientInfo as any) || {};
      return {
      id: o.id.toString(),
      orderId: o.orderId,
      customer: { name: o.name, phone: o.number },
      address: o.address,
      shippingMethod: o.shipping,
      shippingCost: o.shippingCost,
      totalValue: o.totalValue,
      ip: info.ip || "",
      userAgent: info.userAgent || "",
      status: o.status,
      callStatus: o.phoneCallStatus || "Pending",
      smsStatus: o.smsStatus,
      note: o.note,
      date: (o.date && !o.date.includes('Z') && !o.date.includes('+')) ? o.date.replace(' ', 'T') + 'Z' : o.date,
      createdAt: (o.date && !o.date.includes('Z') && !o.date.includes('+')) ? o.date.replace(' ', 'T') + 'Z' : o.date
    };
    });
  } catch(e) {
    console.error(e);
    return [];
  }
}
