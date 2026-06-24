import { NextResponse } from 'next/server';
import { businessDateString } from '@/lib/businessDay';
import { getDb, serializeDoc, toObjectId } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function receiptNo() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KOFI-${stamp}-${rand}`;
}

function money(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
    const status = searchParams.get('status');
    const includeClosed = searchParams.get('includeClosed') === '1';

    // Default behavior:
    // Ipakita lang ang open/unclosed orders.
    // Kapag nag-Daily Close, nilalagyan ng closedAt ang orders,
    // kaya hindi na sila lalabas sa Orders page.
    const query = {};

    if (status) query.status = status;

    if (!includeClosed) {
      query.closedAt = { $exists: false };
    }

    const db = await getDb();

    const orders = await db
      .collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      ok: true,
      orders: serializeDoc(orders)
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Cart is empty.' },
        { status: 400 }
      );
    }

    const items = body.items.map((item) => {
      const qty = Number(item.qty || 1);
      const addOns = Array.isArray(item.addOns) ? item.addOns : [];
      const addOnTotal = addOns.reduce(
        (sum, addOn) => sum + Number(addOn.price || 0),
        0
      );
      const unitPrice = Number(item.unitPrice || 0) + addOnTotal;

      return {
        productId: item.productId || null,
        sku: item.sku || '',
        name: item.name,
        variant: item.variant || '',
        qty,
        unitPrice: money(unitPrice),
        addOns,
        notes: item.notes || '',
        lineTotal: money(unitPrice * qty)
      };
    });

    const subTotal = money(
      items.reduce((sum, item) => sum + item.lineTotal, 0)
    );
    const discountAmount = money(body.discountAmount || 0);
    const serviceCharge = money(body.serviceCharge || 0);
    const tax = money(body.tax || 0);
    const total = money(
      Math.max(subTotal - discountAmount + serviceCharge + tax, 0)
    );
    const cashReceived = money(body.cashReceived || 0);

    const order = {
      receiptNo: receiptNo(),
      customerName: String(body.customerName || 'Walk-in').trim(),
      cashier: String(body.cashier || 'Cashier').trim(),
      items,
      subTotal,
      discountAmount,
      serviceCharge,
      tax,
      total,
      paymentMethod: body.paymentMethod || 'Cash',
      cashReceived,
      change: money(Math.max(cashReceived - total, 0)),
      status: 'paid',
      businessDate: businessDateString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = await getDb();
    const result = await db.collection('orders').insertOne(order);

    const bulkOps = items
      .filter((item) => item.productId && toObjectId(item.productId))
      .map((item) => ({
        updateOne: {
          filter: {
            _id: toObjectId(item.productId),
            trackStock: true
          },
          update: {
            $inc: { stock: -item.qty },
            $set: { updatedAt: new Date() }
          }
        }
      }));

    if (bulkOps.length) {
      await db.collection('products').bulkWrite(bulkOps, { ordered: false });
    }

    return NextResponse.json({
      ok: true,
      order: serializeDoc({
        ...order,
        _id: result.insertedId
      })
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
