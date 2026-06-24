import { NextResponse } from 'next/server';
import { businessDateString, businessDayRange } from '@/lib/businessDay';
import { getDb, serializeDoc } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessDate = searchParams.get('date') || businessDateString();
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const includeClosed = searchParams.get('includeClosed') === '1';
    const range = businessDayRange(businessDate);
    const start = fromParam ? new Date(fromParam) : range.start;
    const end = toParam ? new Date(toParam) : range.end;
    const db = await getDb();
    const query = { createdAt: { $gte: start, $lt: end }, status: { $ne: 'void' } };
    if (!includeClosed) query.closedAt = { $exists: false };

    const [summary] = await db.collection('orders').aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          grossSales: { $sum: '$subTotal' },
          discounts: { $sum: '$discountAmount' },
          tax: { $sum: '$tax' },
          serviceCharge: { $sum: '$serviceCharge' },
          netSales: { $sum: '$total' },
          cashSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'Cash'] }, '$total', 0] } },
          gcashSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'GCash'] }, '$total', 0] } },
          cardSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'Card'] }, '$total', 0] } },
          bankSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'Bank Transfer'] }, '$total', 0] } }
        }
      }
    ]).toArray();

    const topItems = await db.collection('orders').aggregate([
      { $match: query },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qty: { $sum: '$items.qty' },
          sales: { $sum: '$items.lineTotal' }
        }
      },
      { $sort: { qty: -1, sales: -1 } },
      { $limit: 10 }
    ]).toArray();

    const lowStock = await db.collection('products').find({ trackStock: true, stock: { $lte: 10 } }).sort({ stock: 1 }).limit(20).toArray();

    return NextResponse.json({
      ok: true,
      businessDate: range.businessDate,
      closedMode: !includeClosed,
      summary: summary || {
        orders: 0,
        grossSales: 0,
        discounts: 0,
        tax: 0,
        serviceCharge: 0,
        netSales: 0,
        cashSales: 0,
        gcashSales: 0,
        cardSales: 0,
        bankSales: 0
      },
      topItems: serializeDoc(topItems),
      lowStock: serializeDoc(lowStock)
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
