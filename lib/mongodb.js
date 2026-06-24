import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.POS_DB_NAME || process.env.MONGODB_DB || null;

let cached = global._mongoPos;

if (!cached) {
  cached = global._mongoPos = { client: null, promise: null };
}

export async function getClient() {
  if (!uri) {
    throw new Error('Missing MONGODB_URI. Add it in .env.local locally or Vercel Environment Variables.');
  }

  if (cached.client) return cached.client;

  if (!cached.promise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000
    });
    cached.promise = client.connect();
  }

  cached.client = await cached.promise;
  return cached.client;
}

export async function getDb() {
  const client = await getClient();
  // If POS_DB_NAME is not provided, MongoDB driver uses the database name
  // from the connection string path, e.g. /attendance_tracker.
  const db = dbName ? client.db(dbName) : client.db();
  await ensureIndexes(db);
  return db;
}

let indexesReady = false;
async function ensureIndexes(db) {
  if (indexesReady) return;
  await Promise.all([
    db.collection('products').createIndex({ sku: 1 }, { unique: true }),
    db.collection('products').createIndex({ category: 1, subCategory: 1, active: 1 }),
    db.collection('orders').createIndex({ receiptNo: 1 }, { unique: true }),
    db.collection('orders').createIndex({ createdAt: -1 }),
    db.collection('settings').createIndex({ key: 1 }, { unique: true }),
    db.collection('daily_closings').createIndex({ businessDate: 1, createdAt: -1 }),
    db.collection('orders').createIndex({ closedAt: 1, businessDate: 1 })
  ]);
  indexesReady = true;
}

export function toObjectId(id) {
  if (!id || !ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export function serializeDoc(doc) {
  if (!doc) return doc;
  return JSON.parse(JSON.stringify(doc));
}

export function normalizeProduct(input) {
  const now = new Date();
  return {
    sku: String(input.sku || input.name || '').trim().toUpperCase().replace(/\s+/g, '-'),
    name: String(input.name || '').trim(),
    category: String(input.category || 'Uncategorized').trim(),
    subCategory: String(input.subCategory || '').trim(),
    size: String(input.size || '').trim(),
    basePrice: Number(input.basePrice || 0),
    variants: Array.isArray(input.variants) ? input.variants.map((v) => ({ name: String(v.name), price: Number(v.price || 0) })) : [],
    addOns: Array.isArray(input.addOns) ? input.addOns.map((a) => ({ name: String(a.name), price: Number(a.price || 0) })) : [],
    stock: Number(input.stock || 0),
    trackStock: Boolean(input.trackStock),
    active: input.active !== false,
    notes: String(input.notes || '').trim(),
    updatedAt: now
  };
}
