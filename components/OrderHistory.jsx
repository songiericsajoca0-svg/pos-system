'use client';

import { useMemo, useState } from 'react';

function peso(value, currency) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

function dateLabel(value) {
  return new Date(value).toLocaleString();
}

export default function OrderHistory({ orders, currency, onReceipt, onStatus, reload }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === 'All' || order.status === status;
      const matchesText = [order.receiptNo, order.customerName, order.cashier, order.paymentMethod].join(' ').toLowerCase().includes(needle);
      return matchesStatus && matchesText;
    });
  }, [orders, query, status]);

  function exportCsv() {
    const rows = [
      ['Receipt', 'Date', 'Customer', 'Cashier', 'Payment', 'Status', 'Subtotal', 'Discount', 'Tax', 'Service', 'Total'],
      ...filtered.map((order) => [
        order.receiptNo,
        dateLabel(order.createdAt),
        order.customerName,
        order.cashier,
        order.paymentMethod,
        order.status,
        order.subTotal,
        order.discountAmount,
        order.tax,
        order.serviceCharge,
        order.total
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Current unclosed sales records</p>
<h2>Open orders</h2>
        </div>
        <div className="top-actions">
          <button className="ghost-btn" onClick={reload}>Refresh</button>
          <button className="primary-btn" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      <div className="toolbar slim">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search receipt, customer, cashier..." />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option>
          <option>paid</option>
          <option>void</option>
          <option>refunded</option>
          <option>paid-local</option>
        </select>
      </div>

      <div className="order-list">
        {filtered.map((order) => (
          <article className="order-card" key={order._id || order.receiptNo}>
            <div className="order-meta">
              <div>
                <strong>{order.receiptNo}</strong>
                <small>{dateLabel(order.createdAt)} • {order.customerName || 'Walk-in'} • {order.cashier || 'Cashier'}</small>
              </div>
              <span className={order.status === 'paid' || order.status === 'paid-local' ? 'badge success' : 'badge muted'}>{order.status}</span>
            </div>
            <div className="order-items">
              {order.items?.map((item, index) => (
                <span key={`${order.receiptNo}-${index}`}>{item.qty}× {item.name} {item.variant ? `(${item.variant})` : ''}</span>
              ))}
            </div>
            <div className="order-footer">
              <strong>{peso(order.total, currency)}</strong>
              <div className="row-actions">
                <button className="ghost-btn" onClick={() => onReceipt(order)}>Receipt</button>
                {order.status === 'paid' && <button className="ghost-btn danger" onClick={() => onStatus(order, 'void')}>Void</button>}
                {order.status === 'paid' && <button className="ghost-btn" onClick={() => onStatus(order, 'refunded')}>Refund</button>}
              </div>
            </div>
          </article>
        ))}
      </div>

{filtered.length === 0 && (
  <div className="empty-state">
    No open orders found. After Daily Close, orders are archived and this list resets.
  </div>
)}    </section>
  );
}
