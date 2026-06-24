'use client';

import { useMemo, useState } from 'react';

function peso(value, currency) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

function dateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

function todayBusinessDate() {
  const now = new Date();
  const shifted = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export default function DailyClose({ report, closings, closeDay, saving, currency, reload }) {
  const [cashier, setCashier] = useState('Manager');
  const [notes, setNotes] = useState('');
  const [businessDate, setBusinessDate] = useState(todayBusinessDate());
  const [selectedClosing, setSelectedClosing] = useState(null);
  const summary = report?.summary || {};

  const canClose = Number(summary.orders || 0) > 0;

  const lastClosing = useMemo(() => closings?.[0] || null, [closings]);

  async function submit(e) {
    e.preventDefault();
    if (!canClose) return alert('No open orders to close/reset.');
    const sure = confirm('Close this business day and reset current dashboard totals? This will archive today\'s open paid orders into a Daily Closing record.');
    if (!sure) return;
    const closing = await closeDay({ cashier, notes, businessDate });
    if (closing) setSelectedClosing(closing);
  }

  function printClosing(closing) {
    setSelectedClosing(closing);
    setTimeout(() => window.print(), 100);
  }

  function exportClosingCsv(closing) {
    const rows = [
      ['Closing No', closing.closingNo],
      ['Business Date', closing.businessDate],
      ['Cashier/Manager', closing.cashier],
      ['Created At', dateTime(closing.createdAt)],
      [],
      ['Summary'],
      ['Orders', closing.summary?.orders || 0],
      ['Gross Sales', closing.summary?.grossSales || 0],
      ['Discounts', closing.summary?.discounts || 0],
      ['Service Charge', closing.summary?.serviceCharge || 0],
      ['Tax', closing.summary?.tax || 0],
      ['Net Sales', closing.summary?.netSales || 0],
      [],
      ['Payment Breakdown'],
      ...(closing.paymentBreakdown || []).map((item) => [item._id || 'Unknown', item.orders, item.total]),
      [],
      ['Top Items'],
      ['Item', 'Qty', 'Sales'],
      ...(closing.topItems || []).map((item) => [item._id, item.qty, item.sales])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${closing.closingNo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewClosing = selectedClosing || lastClosing;

  return (
    <section className="daily-close-page">
      <div className="panel-card section-head compact-head">
        <div>
          <p className="eyebrow">End of day reset</p>
          <h2>Daily Close / Reset</h2>
        </div>
        <button className="ghost-btn" onClick={reload}>Refresh</button>
      </div>

      <div className="daily-close-grid">
        <form className="panel-card close-form" onSubmit={submit}>
          <h3>Open sales to close</h3>
          <p className="muted-text">
            Kapag na-click ang <strong>Close Day & Reset</strong>, ise-save ang summary sa MongoDB collection
            <code> daily_closings </code> at ire-reset sa zero ang current dashboard totals. Hindi binubura ang orders; ina-archive lang sila.
          </p>

          <div className="metric-grid close-metrics">
            <div className="metric-card"><span>Open Orders</span><strong>{summary.orders || 0}</strong></div>
            <div className="metric-card"><span>Gross Sales</span><strong>{peso(summary.grossSales, currency)}</strong></div>
            <div className="metric-card"><span>Discounts</span><strong>{peso(summary.discounts, currency)}</strong></div>
            <div className="metric-card"><span>Net Sales</span><strong>{peso(summary.netSales, currency)}</strong></div>
          </div>

          <div className="totals-card flat">
            <div><span>Cash</span><strong>{peso(summary.cashSales, currency)}</strong></div>
            <div><span>GCash</span><strong>{peso(summary.gcashSales, currency)}</strong></div>
            <div><span>Card</span><strong>{peso(summary.cardSales, currency)}</strong></div>
            <div><span>Bank Transfer</span><strong>{peso(summary.bankSales, currency)}</strong></div>
          </div>

          <div className="two-cols">
            <label>Business date<input type="date" value={businessDate} onChange={(e) => setBusinessDate(e.target.value)} /></label>
            <label>Closed by<input value={cashier} onChange={(e) => setCashier(e.target.value)} /></label>
          </div>
          <label>Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes, cash count, remarks..." /></label>

          <button className="checkout-btn" disabled={saving || !canClose}>{saving ? 'Closing...' : 'Close Day & Reset Current Record'}</button>
          {!canClose && <p className="warning-text">Walang open paid orders ngayon. Kapag nagbenta ulit, automatic bagong record na iyon.</p>}
        </form>

        <div className="panel-card">
          <h3>Closing history</h3>
          <div className="rank-list closing-list">
            {closings?.length ? closings.map((closing) => (
              <div key={closing._id || closing.closingNo} className="closing-row">
                <span>
                  <strong>{closing.closingNo}</strong>
                  <small>{closing.businessDate} • {dateTime(closing.createdAt)} • {closing.cashier}</small>
                </span>
                <strong>{peso(closing.summary?.netSales, currency)}</strong>
                <button className="ghost-btn" onClick={() => setSelectedClosing(closing)}>View</button>
                <button className="ghost-btn" onClick={() => exportClosingCsv(closing)}>CSV</button>
                <button className="ghost-btn" onClick={() => printClosing(closing)}>Print</button>
              </div>
            )) : <p className="muted-text">No daily closing records yet.</p>}
          </div>
        </div>
      </div>

      
    </section>
  );
}
