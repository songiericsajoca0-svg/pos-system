import { NextResponse } from 'next/server';
import { getDb, serializeDoc } from '@/lib/mongodb';
import { businessDateString, businessDayRange, closingNo } from '@/lib/businessDay';

export const dynamic = 'force-dynamic';

function money(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function emptyOverall() {
  return {
    totalClosings: 0,
    totalOrders: 0,
    grossSales: 0,
    discounts: 0,
    serviceCharge: 0,
    tax: 0,
    netSales: 0,
    cashSales: 0,
    gcashSales: 0,
    cardSales: 0,
    bankSales: 0,
    firstClosingAt: null,
    lastClosingAt: null
  };
}

async function getOverallSummary(db) {
  const [overall] = await db.collection('daily_closings').aggregate([
    {
      $match: {
        status: 'closed'
      }
    },
    {
      $group: {
        _id: null,
        totalClosings: { $sum: 1 },
        totalOrders: { $sum: '$summary.orders' },
        grossSales: { $sum: '$summary.grossSales' },
        discounts: { $sum: '$summary.discounts' },
        serviceCharge: { $sum: '$summary.serviceCharge' },
        tax: { $sum: '$summary.tax' },
        netSales: { $sum: '$summary.netSales' },
        cashSales: { $sum: '$summary.cashSales' },
        gcashSales: { $sum: '$summary.gcashSales' },
        cardSales: { $sum: '$summary.cardSales' },
        bankSales: { $sum: '$summary.bankSales' },
        firstClosingAt: { $min: '$createdAt' },
        lastClosingAt: { $max: '$createdAt' }
      }
    },
    {
      $project: {
        _id: 0
      }
    }
  ]).toArray();

  return overall || emptyOverall();
}

async function buildClosingSnapshot(db, businessDate) {
  const { start, end } = businessDayRange(businessDate);

  const query = {
    createdAt: { $gte: start, $lt: end },
    status: { $nin: ['void'] },
    closedAt: { $exists: false }
  };

  const [summary] = await db.collection('orders').aggregate([
    {
      $match: query
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        grossSales: { $sum: '$subTotal' },
        discounts: { $sum: '$discountAmount' },
        tax: { $sum: '$tax' },
        serviceCharge: { $sum: '$serviceCharge' },
        netSales: { $sum: '$total' },
        cashSales: {
          $sum: {
            $cond: [{ $eq: ['$paymentMethod', 'Cash'] }, '$total', 0]
          }
        },
        gcashSales: {
          $sum: {
            $cond: [{ $eq: ['$paymentMethod', 'GCash'] }, '$total', 0]
          }
        },
        cardSales: {
          $sum: {
            $cond: [{ $eq: ['$paymentMethod', 'Card'] }, '$total', 0]
          }
        },
        bankSales: {
          $sum: {
            $cond: [{ $eq: ['$paymentMethod', 'Bank Transfer'] }, '$total', 0]
          }
        }
      }
    }
  ]).toArray();

  const topItems = await db.collection('orders').aggregate([
    {
      $match: query
    },
    {
      $unwind: '$items'
    },
    {
      $group: {
        _id: '$items.name',
        qty: { $sum: '$items.qty' },
        sales: { $sum: '$items.lineTotal' }
      }
    },
    {
      $sort: {
        qty: -1,
        sales: -1
      }
    },
    {
      $limit: 25
    }
  ]).toArray();

  const paymentBreakdown = await db.collection('orders').aggregate([
    {
      $match: query
    },
    {
      $group: {
        _id: '$paymentMethod',
        orders: { $sum: 1 },
        total: { $sum: '$total' }
      }
    },
    {
      $sort: {
        total: -1
      }
    }
  ]).toArray();

  return {
    query,
    snapshot: {
      businessDate,
      periodStart: start,
      periodEnd: end,
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
      topItems,
      paymentBreakdown
    }
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 30), 200);

    const db = await getDb();

    const closings = await db
      .collection('daily_closings')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const overall = await getOverallSummary(db);

    return NextResponse.json({
      ok: true,
      closings: serializeDoc(closings),
      overall: serializeDoc(overall)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const businessDate = body.businessDate || businessDateString();

    const db = await getDb();
    const { query, snapshot } = await buildClosingSnapshot(db, businessDate);

    if (!Number(snapshot.summary.orders || 0)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No open paid orders to close for this business day.'
        },
        {
          status: 400
        }
      );
    }

    const now = new Date();

    const doc = {
      closingNo: closingNo(businessDate),
      ...snapshot,
      cashier: String(body.cashier || 'Manager').trim(),
      notes: String(body.notes || '').trim(),
      status: 'closed',
      createdAt: now,
      updatedAt: now
    };

    doc.summary = Object.fromEntries(
      Object.entries(doc.summary).map(([key, value]) => [
        key,
        typeof value === 'number' ? money(value) : value
      ])
    );

    const result = await db.collection('daily_closings').insertOne(doc);

    await db.collection('orders').updateMany(query, {
      $set: {
        closedAt: now,
        closingId: result.insertedId,
        closingNo: doc.closingNo,
        businessDate,
        updatedAt: now
      }
    });

    const overall = await getOverallSummary(db);

    return NextResponse.json({
      ok: true,
      closing: serializeDoc({
        ...doc,
        _id: result.insertedId
      }),
      overall: serializeDoc(overall)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}
