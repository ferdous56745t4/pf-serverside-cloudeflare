'use server';

import { db } from '../../lib/db/index.js';
import { orders } from '../../lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function getFinancialStats() {
  try {
    // Fetch only delivered orders for realized revenue
    const deliveredOrders = await db.select().from(orders).where(eq(orders.status, 'Delivered'));
    
    // Sum total value
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.totalValue || 0), 0);
    const totalDeliveredQuantity = deliveredOrders.length; // Assuming 1 book per order for now based on earlier logic
    
    return {
      success: true,
      totalRevenue,
      totalDeliveredQuantity
    };
  } catch (error) {
    console.error('Failed to get financial stats:', error);
    return { success: false, totalRevenue: 0, totalDeliveredQuantity: 0 };
  }
}
