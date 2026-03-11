import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, stocks } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// Helper function to map steadfast status to internal dashboard status.
// You may need to tweak this map as you learn the exact steadfast string literals.
const mapSteadfastStatus = (steadfastStatus) => {
  if (!steadfastStatus) return null;
  const lowerStatus = steadfastStatus.toLowerCase();

  switch (lowerStatus) {
    case 'in_review':
      return 'In Review';
    case 'pending':
    case 'shipped':
    case 'in_transit':
    case 'out_for_delivery':
    case 'hold':
      return 'Shipped';
    case 'delivered':
    case 'partial_delivered':
    case 'delivered_approval_pending':
    case 'partial_delivered_approval_pending':
      return 'Delivered';
    case 'cancelled':
    case 'cancelled_approval_pending':
      return 'Cancelled';
    case 'returned':
      return 'Returned';
    default:
      // If we don't recognize the Steadfast status, we don't map it.
      return null;
  }
};

export async function POST(request) {
  try {
    // 1. Parse the incoming webhook payload sent from Steadfast
    const payload = await request.json();
    
    // Steadfast typically sends consignment_id and delivery_status
    // Check your Steadfast dashboard docs if the payload structure differs
    const { consignment_id, delivery_status } = payload;

    if (!consignment_id || !delivery_status) {
      console.error('Steadfast Webhook: Missing required fields', payload);
      // Return 400 Bad Request to indicate malformed payload
      return NextResponse.json({ error: 'Missing consignment_id or delivery_status' }, { status: 400 });
    }

    // 2. Map the Courier Status to our Internal Store Status
    const dbStatus = mapSteadfastStatus(delivery_status);

    if (dbStatus) {
      const [existingOrder] = await db.select().from(orders).where(eq(orders.consignmentId, consignment_id.toString()));

      if (existingOrder) {
        const oldStatus = existingOrder.status;

        // Stock adjustment logic
        if (dbStatus === 'Shipped' && oldStatus !== 'Shipped') {
          await db.update(stocks)
            .set({ quantity: sql`${stocks.quantity} - 1` })
            .where(eq(stocks.name, 'Book'));
        } else if (dbStatus === 'Returned' && oldStatus !== 'Returned') {
          await db.update(stocks)
            .set({ quantity: sql`${stocks.quantity} + 1` })
            .where(eq(stocks.name, 'Book'));
        } else if (dbStatus === 'Cancelled' && oldStatus !== 'Cancelled' && (oldStatus === 'Shipped' || oldStatus === 'Delivered')) {
          await db.update(stocks)
            .set({ quantity: sql`${stocks.quantity} + 1` })
            .where(eq(stocks.name, 'Book'));
        }

        // 3. Update the matching order in your database using Drizzle
        const updateResult = await db
          .update(orders)
          .set({ 
            status: dbStatus, 
            courierStatus: delivery_status // Also save the exact courier string for tracking
          })
          .where(eq(orders.id, existingOrder.id))
          .returning({ id: orders.id, orderId: orders.orderId });

        if (updateResult.length > 0) {
          console.log(`Steadfast Webhook: Order ${updateResult[0].orderId} updated to ${dbStatus}`);
        }
      } else {
        console.log(`Steadfast Webhook: Consignment ID ${consignment_id} not found in database.`);
      }
    } else {
      console.log(`Steadfast Webhook: Received unrecognized status '${delivery_status}', no mapped update performed.`);
    }

    // 4. Always return a 200 OK so Steadfast knows we received it 
    // and doesn't keep retrying unnecessarily.
    return NextResponse.json({ received: true, status: 200 });

  } catch (error) {
    console.error('Steadfast Webhook Error:', error);
    // In production, you might still want to return 200 to prevent retries
    // But testing 500 can be helpful initially
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
