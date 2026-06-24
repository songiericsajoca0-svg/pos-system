import { NextResponse } from 'next/server';
import { DEFAULT_PRODUCTS, BUSINESS_DEFAULTS } from '@/lib/menuData';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const db = await getDb();
    const now = new Date();

    const ops = DEFAULT_PRODUCTS.map((product) => ({
      updateOne: {
        filter: { sku: product.sku },
        update: { $set: { ...product, updatedAt: now }, $setOnInsert: { createdAt: now } },
        upsert: true
      }
    }));

    if (ops.length) await db.collection('products').bulkWrite(ops, { ordered: false });
    await db.collection('settings').updateOne(
      { key: 'business' },
      { $setOnInsert: { key: 'business', value: BUSINESS_DEFAULTS, createdAt: now }, $set: { updatedAt: now } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, message: `Seeded ${DEFAULT_PRODUCTS.length} menu items.` });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
