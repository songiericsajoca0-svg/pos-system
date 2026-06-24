'use client';

function peso(value, currency) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

export default function ReceiptModal({ order, settings, currency, onClose }) {
  function printReceipt() {
    window.print();
  }

  return (
    <div className="modal-backdrop">
      <div className="receipt-modal">
        <div className="modal-actions no-print">
          <button className="ghost-btn" onClick={onClose}>Close</button>
          <button className="primary-btn" onClick={printReceipt}>Print</button>
        </div>
        <div className="receipt-paper">
          <div className="receipt-head">
            <h2>{settings.storeName || 'The Point Ko.fi'}</h2>
            <p>{settings.address}</p>
            <p>{settings.contact}</p>
          </div>
          <div className="receipt-meta">
            <span>Receipt</span><strong>{order.receiptNo}</strong>
            <span>Date</span><strong>{new Date(order.createdAt).toLocaleString()}</strong>
            <span>Cashier</span><strong>{order.cashier}</strong>
            <span>Customer</span><strong>{order.customerName}</strong>
          </div>
          <div className="receipt-lines">
            {order.items?.map((item, index) => (
              <div key={index}>
                <span>{item.qty}× {item.name} {item.variant ? `(${item.variant})` : ''}</span>
                <strong>{peso(item.lineTotal, currency)}</strong>
                {item.addOns?.length > 0 && <small>{item.addOns.map((addOn) => `+${addOn.name}`).join(', ')}</small>}
              </div>
            ))}
          </div>
          <div className="receipt-total">
            <div><span>Subtotal</span><strong>{peso(order.subTotal, currency)}</strong></div>
            <div><span>Discount</span><strong>-{peso(order.discountAmount, currency)}</strong></div>
            <div><span>Service</span><strong>{peso(order.serviceCharge, currency)}</strong></div>
            <div><span>Tax</span><strong>{peso(order.tax, currency)}</strong></div>
            <div className="grand"><span>Total</span><strong>{peso(order.total, currency)}</strong></div>
            <div><span>{order.paymentMethod}</span><strong>{peso(order.cashReceived, currency)}</strong></div>
            <div><span>Change</span><strong>{peso(order.change, currency)}</strong></div>
          </div>
          <p className="receipt-footer">{settings.receiptFooter || 'Thank you!'}</p>
        </div>
      </div>
    </div>
  );
}
