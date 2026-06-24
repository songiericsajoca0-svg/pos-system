'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import ProductGrid from './ProductGrid';
import CartPanel from './CartPanel';
import InventoryManager from './InventoryManager';
import OrderHistory from './OrderHistory';
import Dashboard from './Dashboard';
import SettingsPanel from './SettingsPanel';
import DailyClose from './DailyClose';
import ReceiptModal from './ReceiptModal';
import { BUSINESS_DEFAULTS, DEFAULT_PRODUCTS } from '@/lib/menuData';

const currency = '₱';

function localId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function demoProducts() {
  return DEFAULT_PRODUCTS.map((product) => ({ ...product, _id: product.sku, demo: true }));
}

export default function POSApp() {
  const [activeTab, setActiveTab] = useState('register');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState(null);
  const [closings, setClosings] = useState([]);
  const [closingSummary, setClosingSummary] = useState(null);
  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState({ ...BUSINESS_DEFAULTS });
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in');
  const [cashier, setCashier] = useState('Cashier');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    setLoading(true);
    await Promise.allSettled([loadProducts(), loadOrders(), loadSettings(), loadReport(), loadClosings()]);
    setLoading(false);
  }

  function flash(message) {
    setToast(message);
    window.clearTimeout(window.__posToast);
    window.__posToast = window.setTimeout(() => setToast(''), 3500);
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/products?all=1', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Cannot load products');
      if (data.products.length === 0) {
        setProducts(demoProducts());
        setOfflineMode(true);
        flash('No products yet. Click “Seed menu” in Settings to save the menu to MongoDB.');
      } else {
        setProducts(data.products);
        setOfflineMode(false);
      }
    } catch (error) {
      setProducts(demoProducts());
      setOfflineMode(true);
      flash(`Demo mode: ${error.message}`);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch('/api/orders?limit=100', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Cannot load orders');
      setOrders(data.orders || []);
    } catch (_error) {
      const local = JSON.parse(localStorage.getItem('pos-local-orders') || '[]');
      setOrders(local);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Cannot load settings');
      setSettings({ ...BUSINESS_DEFAULTS, ...data.settings });
    } catch (_error) {
      const local = JSON.parse(localStorage.getItem('pos-settings') || 'null');
      setSettings({ ...BUSINESS_DEFAULTS, ...(local || {}) });
    }
  }

  async function loadReport() {
    try {
      // Default report shows only open/unclosed orders for today's business date.
      const res = await fetch('/api/reports', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Cannot load reports');
      setReport(data);
    } catch (_error) {
      setReport(null);
    }
  }

  async function loadClosings() {
    try {
      const res = await fetch('/api/closing?limit=60', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Cannot load daily closings');
      setClosings(data.closings || []);
      setClosingSummary(data.overall || null);    } catch (_error) {
      setClosings([]);
      setClosingSummary(null);
    }
  }

  const activeProducts = useMemo(() => products.filter((product) => product.active !== false && Number(product.basePrice || 0) >= 0), [products]);

  const totals = useMemo(() => {
    const subTotal = toMoney(cart.reduce((sum, item) => sum + item.lineTotal, 0));
    const discountAmount = discountType === 'percent'
      ? toMoney(subTotal * (Number(discountValue || 0) / 100))
      : toMoney(Number(discountValue || 0));
    const serviceCharge = toMoney((subTotal - discountAmount) * (Number(settings.serviceChargeRate || 0) / 100));
    const tax = toMoney((subTotal - discountAmount + serviceCharge) * (Number(settings.taxRate || 0) / 100));
    const total = toMoney(Math.max(subTotal - discountAmount + serviceCharge + tax, 0));
    const change = toMoney(Math.max(Number(cashReceived || 0) - total, 0));
    return { subTotal, discountAmount, serviceCharge, tax, total, change };
  }, [cart, discountType, discountValue, settings.serviceChargeRate, settings.taxRate, cashReceived]);

  function addToCart(product, selection = {}) {
    const variant = selection.variant || product.variants?.[0]?.name || product.size || '';
    const variantPrice = product.variants?.find((item) => item.name === variant)?.price;
    const baseUnitPrice = Number(variantPrice ?? product.basePrice ?? 0);
    const addOns = selection.addOns || [];
    const addOnKey = addOns.map((item) => item.name).sort().join('|');
    const key = `${product._id}-${variant}-${addOnKey}`;
    const addOnTotal = addOns.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const unitPrice = toMoney(baseUnitPrice + addOnTotal);

    setCart((current) => {
      const exists = current.find((item) => item.key === key);
      if (exists) {
        return current.map((item) => item.key === key ? { ...item, qty: item.qty + 1, lineTotal: toMoney((item.qty + 1) * item.unitPrice) } : item);
      }
      return [
        ...current,
        {
          key,
          productId: product._id,
          sku: product.sku,
          name: product.name,
          variant,
          addOns,
          qty: 1,
          unitPrice,
          lineTotal: unitPrice
        }
      ];
    });
    flash(`${product.name} added to cart`);
  }

  function updateQty(key, qty) {
    const nextQty = Number(qty);
    if (nextQty <= 0) return removeFromCart(key);
    setCart((current) => current.map((item) => item.key === key ? { ...item, qty: nextQty, lineTotal: toMoney(nextQty * item.unitPrice) } : item));
  }

  function removeFromCart(key) {
    setCart((current) => current.filter((item) => item.key !== key));
  }

  function clearCart() {
    setCart([]);
    setDiscountValue(0);
    setCashReceived('');
    setCustomerName('Walk-in');
  }

  async function checkout() {
    if (cart.length === 0) return flash('Cart is empty.');
    if (paymentMethod === 'Cash' && Number(cashReceived || 0) < totals.total) return flash('Cash received is lower than total.');

    const payload = {
      customerName,
      cashier,
      items: cart,
      discountAmount: totals.discountAmount,
      serviceCharge: totals.serviceCharge,
      tax: totals.tax,
      paymentMethod,
      cashReceived: Number(cashReceived || totals.total)
    };

    setSaving(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Order was not saved');
      setReceiptOrder(data.order);
      clearCart();
      await Promise.allSettled([loadProducts(), loadOrders(), loadReport()]);
      flash('Order paid and saved.');
    } catch (error) {
      const localOrder = {
        ...payload,
        _id: localId(),
        receiptNo: `LOCAL-${Date.now()}`,
        subTotal: totals.subTotal,
        total: totals.total,
        change: totals.change,
        status: 'paid-local',
        createdAt: new Date().toISOString()
      };
      const local = JSON.parse(localStorage.getItem('pos-local-orders') || '[]');
      localStorage.setItem('pos-local-orders', JSON.stringify([localOrder, ...local]));
      setOrders([localOrder, ...orders]);
      setReceiptOrder(localOrder);
      clearCart();
      flash(`Saved locally only: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function closeDay(payload) {
    setSaving(true);
    try {
      const res = await fetch('/api/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Daily close failed');
      await Promise.allSettled([loadOrders(), loadReport(), loadClosings()]);
      flash('Daily record saved and current totals reset.');
      return data.closing;
    } catch (error) {
      flash(`Daily close failed: ${error.message}`);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function seedMenu() {
    setSaving(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Seed failed');
      await loadProducts();
      setOfflineMode(false);
      flash(data.message);
    } catch (error) {
      flash(`Seed failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveProduct(product) {
    const isExisting = product._id && !String(product._id).startsWith('tmp-') && !product.demo;
    const method = isExisting ? 'PUT' : 'POST';
    const url = isExisting ? `/api/products/${product._id}` : '/api/products';
    setSaving(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Save failed');
      await loadProducts();
      flash('Product saved.');
      return true;
    } catch (error) {
      const id = product._id || `tmp-${localId()}`;
      setProducts((current) => {
        const exists = current.some((item) => item._id === id);
        const normalized = { ...product, _id: id, demo: true };
        return exists ? current.map((item) => item._id === id ? normalized : item) : [...current, normalized];
      });
      flash(`Demo-only product update: ${error.message}`);
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    if (!confirm(`Delete ${product.name}?`)) return;
    if (product.demo || String(product._id).startsWith('tmp-')) {
      setProducts((current) => current.filter((item) => item._id !== product._id));
      return flash('Removed from demo list.');
    }
    try {
      const res = await fetch(`/api/products/${product._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Delete failed');
      await loadProducts();
      flash('Product deleted.');
    } catch (error) {
      flash(`Delete failed: ${error.message}`);
    }
  }

  async function saveSettings(nextSettings) {
    setSettings(nextSettings);
    localStorage.setItem('pos-settings', JSON.stringify(nextSettings));
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextSettings)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Settings not saved to MongoDB');
      flash('Settings saved.');
    } catch (error) {
      flash(`Settings saved locally only: ${error.message}`);
    }
  }

  async function changeOrderStatus(order, status) {
    if (!order._id || String(order._id).startsWith('LOCAL')) return flash('Local orders cannot be updated in MongoDB.');
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Status update failed');
      await Promise.allSettled([loadOrders(), loadReport()]);
      flash(`Order marked ${status}.`);
    } catch (error) {
      flash(`Update failed: ${error.message}`);
    }
  }

  const fallbackReport = useMemo(() => {
    const paidOrders = orders.filter((order) => !order.closedAt && !['void', 'refunded'].includes(order.status));
    return {
      summary: {
        orders: paidOrders.length,
        grossSales: toMoney(paidOrders.reduce((sum, order) => sum + Number(order.subTotal || 0), 0)),
        discounts: toMoney(paidOrders.reduce((sum, order) => sum + Number(order.discountAmount || 0), 0)),
        tax: toMoney(paidOrders.reduce((sum, order) => sum + Number(order.tax || 0), 0)),
        serviceCharge: toMoney(paidOrders.reduce((sum, order) => sum + Number(order.serviceCharge || 0), 0)),
        netSales: toMoney(paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)),
        cashSales: toMoney(paidOrders.filter((order) => order.paymentMethod === 'Cash').reduce((sum, order) => sum + Number(order.total || 0), 0)),
        gcashSales: toMoney(paidOrders.filter((order) => order.paymentMethod === 'GCash').reduce((sum, order) => sum + Number(order.total || 0), 0)),
        cardSales: toMoney(paidOrders.filter((order) => order.paymentMethod === 'Card').reduce((sum, order) => sum + Number(order.total || 0), 0)),
        bankSales: toMoney(paidOrders.filter((order) => order.paymentMethod === 'Bank Transfer').reduce((sum, order) => sum + Number(order.total || 0), 0))
      },
      topItems: [],
      lowStock: products.filter((product) => product.trackStock && Number(product.stock) <= 10)
    };
  }, [orders, products]);

  return (
    <div className="pos-shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.reduce((sum, item) => sum + item.qty, 0)}
        offlineMode={offlineMode}
        storeName={settings.storeName}
      />

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Small Business POS</p>
            <h1>{settings.storeName || 'The Point Ko.fi'} Register</h1>
          </div>
          <div className="top-actions">
            {offlineMode && <span className="badge warning">Demo / offline</span>}
            <button className="ghost-btn" onClick={bootstrap}>Refresh</button>
          </div>
        </header>

        {loading ? (
          <div className="loading-card">Loading POS data...</div>
        ) : (
          <>
            {activeTab === 'register' && (
              <div className="register-layout">
                <ProductGrid products={activeProducts} onAdd={addToCart} currency={currency} />
                <CartPanel
                  cart={cart}
                  totals={totals}
                  updateQty={updateQty}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                  checkout={checkout}
                  saving={saving}
                  discountType={discountType}
                  setDiscountType={setDiscountType}
                  discountValue={discountValue}
                  setDiscountValue={setDiscountValue}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  cashReceived={cashReceived}
                  setCashReceived={setCashReceived}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  cashier={cashier}
                  setCashier={setCashier}
                  currency={currency}
                />
              </div>
            )}

            {activeTab === 'orders' && (
              <OrderHistory
                orders={orders}
                currency={currency}
                onReceipt={setReceiptOrder}
                onStatus={changeOrderStatus}
                reload={loadOrders}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryManager
                products={products}
                saveProduct={saveProduct}
                deleteProduct={deleteProduct}
                saving={saving}
                currency={currency}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard report={report || fallbackReport} orders={orders} products={products} currency={currency} reload={loadReport} />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel settings={settings} saveSettings={saveSettings} seedMenu={seedMenu} saving={saving} offlineMode={offlineMode} />
            )}

            {activeTab === 'closing' && (
              <DailyClose
                report={report || fallbackReport}
                closings={closings}
                closeDay={closeDay}
                saving={saving}
                currency={currency}
                reload={() => Promise.allSettled([loadReport(), loadClosings()])}
              />
            )}
          </>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
      {receiptOrder && <ReceiptModal order={receiptOrder} settings={settings} currency={currency} onClose={() => setReceiptOrder(null)} />}
    </div>
  );
}
