import { NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = toObjectId(idParam);
    if (!id) return NextResponse.json({ ok: false, error: 'Invalid order id.' }, { status: 400 });
    const db = await getDb();
    const order = await db.collection('orders').findOne({ _id: id });
    return NextResponse.json({ ok: true, order: serializeDoc(order) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = toObjectId(idParam);
    if (!id) return NextResponse.json({ ok: false, error: 'Invalid order id.' }, { status: 400 });
    const body = await request.json();
    const allowed = ['paid', 'void', 'refunded'];
    const status = allowed.includes(body.status) ? body.status : 'paid';
    const db = await getDb();
    await db.collection('orders').updateOne({ _id: id }, { $set: { status, updatedAt: new Date() } });
    const order = await db.collection('orders').findOne({ _id: id });
    return NextResponse.json({ ok: true, order: serializeDoc(order) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
