import { NextResponse } from 'next/server';
import { getDb, normalizeProduct, serializeDoc, toObjectId } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = toObjectId(idParam);
    if (!id) return NextResponse.json({ ok: false, error: 'Invalid product id.' }, { status: 400 });
    const body = await request.json();
    const update = normalizeProduct(body);
    const db = await getDb();
    await db.collection('products').updateOne({ _id: id }, { $set: update });
    const product = await db.collection('products').findOne({ _id: id });
    return NextResponse.json({ ok: true, product: serializeDoc(product) });
  } catch (error) {
    const message = error.code === 11000 ? 'SKU already exists.' : error.message;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = toObjectId(idParam);
    if (!id) return NextResponse.json({ ok: false, error: 'Invalid product id.' }, { status: 400 });
    const db = await getDb();
    await db.collection('products').deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
