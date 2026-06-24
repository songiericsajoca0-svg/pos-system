import { NextResponse } from 'next/server';
import { BUSINESS_DEFAULTS } from '@/lib/menuData';
import { getDb, serializeDoc } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection('settings').findOne({ key: 'business' });
    return NextResponse.json({ ok: true, settings: serializeDoc(doc?.value || BUSINESS_DEFAULTS) });
  } catch (error) {
    return NextResponse.json({ ok: false, settings: BUSINESS_DEFAULTS, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const db = await getDb();
    await db.collection('settings').updateOne(
      { key: 'business' },
      { $set: { key: 'business', value: body, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, settings: body });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
