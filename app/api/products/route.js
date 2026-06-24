import { NextResponse } from 'next/server';
import { getDb, normalizeProduct, serializeDoc } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === '1';
    const query = showAll ? {} : { active: true };
    const db = await getDb();
    const products = await db.collection('products').find(query).sort({ category: 1, subCategory: 1, name: 1 }).toArray();
    return NextResponse.json({ ok: true, products: serializeDoc(products) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const db = await getDb();
    const product = {
      ...normalizeProduct(body),
      createdAt: new Date()
    };
    if (!product.name) {
      return NextResponse.json({ ok: false, error: 'Product name is required.' }, { status: 400 });
    }
    const result = await db.collection('products').insertOne(product);
    return NextResponse.json({ ok: true, product: serializeDoc({ ...product, _id: result.insertedId }) });
  } catch (error) {
    const message = error.code === 11000 ? 'SKU already exists.' : error.message;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
