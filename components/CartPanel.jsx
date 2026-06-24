'use client';

function peso(value, currency) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

export default function CartPanel({
  cart,
  totals,
  updateQty,
  removeFromCart,
  clearCart,
  checkout,
  saving,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  customerName,
  setCustomerName,
  cashier,
  setCashier,
  currency
}) {
  return (
    <aside className="cart-panel">
      <div className="cart-title">
        <div>
          <p className="eyebrow">Current sale</p>
          <h2>Cart</h2>
        </div>
        <button className="ghost-btn danger" onClick={clearCart} disabled={cart.length === 0}>Clear</button>
      </div>

      <div className="customer-grid">
        <label>
          Customer
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </label>
        <label>
          Cashier
          <input value={cashier} onChange={(e) => setCashier(e.target.value)} />
        </label>
      </div>

      <div className="cart-items">
        {cart.map((item) => (
          <div className="cart-item" key={item.key}>
            <div className="cart-main">
              <strong>{item.name}</strong>
              <small>{item.variant}{item.addOns?.length ? ` • ${item.addOns.map((addOn) => addOn.name).join(', ')}` : ''}</small>
              <span>{peso(item.unitPrice, currency)} each</span>
            </div>
            <div className="qty-box">
              <button onClick={() => updateQty(item.key, item.qty - 1)}>-</button>
              <input type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.key, e.target.value)} />
              <button onClick={() => updateQty(item.key, item.qty + 1)}>+</button>
            </div>
            <strong>{peso(item.lineTotal, currency)}</strong>
            <button className="icon-btn" onClick={() => removeFromCart(item.key)}>×</button>
          </div>
        ))}
        {cart.length === 0 && <div className="empty-state small">Cart is empty. Add menu items to start.</div>}
      </div>

      <div className="discount-box">
        <label>
          Discount
          <div className="inline-control">
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
              <option value="fixed">Fixed ₱</option>
              <option value="percent">Percent %</option>
            </select>
            <input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
          </div>
        </label>
      </div>

      <div className="totals-card">
        <div><span>Subtotal</span><strong>{peso(totals.subTotal, currency)}</strong></div>
        <div><span>Discount</span><strong>-{peso(totals.discountAmount, currency)}</strong></div>
        <div><span>Service</span><strong>{peso(totals.serviceCharge, currency)}</strong></div>
        <div><span>Tax</span><strong>{peso(totals.tax, currency)}</strong></div>
        <div className="grand"><span>Total</span><strong>{peso(totals.total, currency)}</strong></div>
      </div>

      <div className="payment-grid">
        <label>
          Payment
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>Cash</option>
            <option>GCash</option>
            <option>Card</option>
            <option>Bank Transfer</option>
          </select>
        </label>
        <label>
          Cash received
          <input type="number" min="0" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder={String(totals.total)} />
        </label>
      </div>
      <div className="change-line">Change: <strong>{peso(totals.change, currency)}</strong></div>

      <button className="checkout-btn" onClick={checkout} disabled={saving || cart.length === 0}>
        {saving ? 'Saving...' : `Pay ${peso(totals.total, currency)}`}
      </button>
    </aside>
  );
}
