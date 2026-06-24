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

export default function DailyClose({
  report,
  closings,
  closingSummary,
  closeDay,
  saving,
  currency,
  reload
}) {
  const [cashier, setCashier] = useState('Manager');
  const [notes, setNotes] = useState('');
  const [businessDate, setBusinessDate] = useState(todayBusinessDate());
  const [selectedClosing, setSelectedClosing] = useState(null);
  const [showOverall, setShowOverall] = useState(false);

  const summary = report?.summary || {};
  const canClose = Number(summary.orders || 0) > 0;

  const lastClosing = useMemo(() => closings?.[0] || null, [closings]);

  const fallbackOverall = useMemo(() => {
    const total = {
      totalClosings: 0,
      totalOrders: 0,
      grossSales: 0,
      discounts: 0,
      serviceCharge: 0,
      tax: 0,
      netSales: 0,
      cashSales: 0,
      gcashSales: 0,
      cardSales: 0,
      bankSales: 0,
      firstClosingAt: null,
      lastClosingAt: null
    };

    for (const closing of closings || []) {
      total.totalClosings += 1;
      total.totalOrders += Number(closing.summary?.orders || 0);
      total.grossSales += Number(closing.summary?.grossSales || 0);
      total.discounts += Number(closing.summary?.discounts || 0);
      total.serviceCharge += Number(closing.summary?.serviceCharge || 0);
      total.tax += Number(closing.summary?.tax || 0);
      total.netSales += Number(closing.summary?.netSales || 0);
      total.cashSales += Number(closing.summary?.cashSales || 0);
      total.gcashSales += Number(closing.summary?.gcashSales || 0);
      total.cardSales += Number(closing.summary?.cardSales || 0);
      total.bankSales += Number(closing.summary?.bankSales || 0);

      if (closing.createdAt) {
        const createdAt = new Date(closing.createdAt);

        if (!total.firstClosingAt || createdAt < new Date(total.firstClosingAt)) {
          total.firstClosingAt = closing.createdAt;
        }

        if (!total.lastClosingAt || createdAt > new Date(total.lastClosingAt)) {
          total.lastClosingAt = closing.createdAt;
        }
      }
    }

    return total;
  }, [closings]);

  const overall = closingSummary || fallbackOverall;

  async function submit(e) {
    e.preventDefault();

    if (!canClose) {
      return alert('No open orders to close/reset.');
    }

    const sure = confirm(
      "Close this business day and reset current dashboard totals? This will archive today's open paid orders into a Daily Closing record."
    );

    if (!sure) return;

    const closing = await closeDay({
      cashier,
      notes,
      businessDate
    });

    if (closing) {
      setSelectedClosing(closing);
    }
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
      ...(closing.paymentBreakdown || []).map((item) => [
        item._id || 'Unknown',
        item.orders,
        item.total
      ]),
      [],
      ['Top Items'],
      ['Item', 'Qty', 'Sales'],
      ...(closing.topItems || []).map((item) => [
        item._id,
        item.qty,
        item.sales
      ])
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8'
    });

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

        <div className="top-actions">
          <button
            className="primary-btn"
            type="button"
            onClick={() => setShowOverall((value) => !value)}
          >
            {showOverall ? 'Hide Overall Earnings' : 'Show Overall Earnings'}
          </button>

          <button className="ghost-btn" type="button" onClick={reload}>
            Refresh
          </button>
        </div>
      </div>

      {showOverall && (
        <div className="panel-card overall-earnings-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">All-time business sales</p>
              <h2>Total Business Earnings</h2>
            </div>

            <span className="badge success">
              Auto-added every Daily Close
            </span>
          </div>

          <p className="muted-text">
            Ito ang kabuuang kinita base sa lahat ng saved records sa{' '}
            <code>daily_closings</code>. Kada Daily Close, automatic
            nadadagdag dito ang Net Sales ng araw na iyon.
          </p>

          <div className="metric-grid overall-metrics">
            <div className="metric-card highlight">
              <span>Total Net Sales</span>
              <strong>{peso(overall.netSales, currency)}</strong>
            </div>

            <div className="metric-card">
              <span>Total Gross Sales</span>
              <strong>{peso(overall.grossSales, currency)}</strong>
            </div>

            <div className="metric-card">
              <span>Total Orders</span>
              <strong>{overall.totalOrders || 0}</strong>
            </div>

            <div className="metric-card">
              <span>Closed Days</span>
              <strong>{overall.totalClosings || 0}</strong>
            </div>
          </div>

          <div className="totals-card flat">
            <div>
              <span>Cash Total</span>
              <strong>{peso(overall.cashSales, currency)}</strong>
            </div>

            <div>
              <span>GCash Total</span>
              <strong>{peso(overall.gcashSales, currency)}</strong>
            </div>

            <div>
              <span>Card Total</span>
              <strong>{peso(overall.cardSales, currency)}</strong>
            </div>

            <div>
              <span>Bank Transfer Total</span>
              <strong>{peso(overall.bankSales, currency)}</strong>
            </div>

            <div>
              <span>Total Discounts</span>
              <strong>{peso(overall.discounts, currency)}</strong>
            </div>

            <div>
              <span>Total Tax</span>
              <strong>{peso(overall.tax, currency)}</strong>
            </div>
          </div>

          {(overall.firstClosingAt || overall.lastClosingAt) && (
            <p className="muted-text">
              Records from{' '}
              <strong>{dateTime(overall.firstClosingAt)}</strong> to{' '}
              <strong>{dateTime(overall.lastClosingAt)}</strong>.
            </p>
          )}
        </div>
      )}

      <div className="daily-close-grid">
        <form className="panel-card close-form" onSubmit={submit}>
          <h3>Open sales to close</h3>

          <p className="muted-text">
            Kapag na-click ang <strong>Close Day & Reset</strong>, ise-save
            ang summary sa MongoDB collection <code>daily_closings</code> at
            ire-reset sa zero ang current dashboard totals. Hindi binubura ang
            orders; ina-archive lang sila.
          </p>

          <div className="metric-grid close-metrics">
            <div className="metric-card">
              <span>Open Orders</span>
              <strong>{summary.orders || 0}</strong>
            </div>

            <div className="metric-card">
              <span>Gross Sales</span>
              <strong>{peso(summary.grossSales, currency)}</strong>
            </div>

            <div className="metric-card">
              <span>Discounts</span>
              <strong>{peso(summary.discounts, currency)}</strong>
            </div>

            <div className="metric-card">
              <span>Net Sales</span>
              <strong>{peso(summary.netSales, currency)}</strong>
            </div>
          </div>

          <div className="totals-card flat">
            <div>
              <span>Cash</span>
              <strong>{peso(summary.cashSales, currency)}</strong>
            </div>

            <div>
              <span>GCash</span>
              <strong>{peso(summary.gcashSales, currency)}</strong>
            </div>

            <div>
              <span>Card</span>
              <strong>{peso(summary.cardSales, currency)}</strong>
            </div>

            <div>
              <span>Bank Transfer</span>
              <strong>{peso(summary.bankSales, currency)}</strong>
            </div>
          </div>

          <div className="two-cols">
            <label>
              Business date
              <input
                type="date"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
              />
            </label>

            <label>
              Closed by
              <input
                value={cashier}
                onChange={(e) => setCashier(e.target.value)}
              />
            </label>
          </div>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes, cash count, remarks..."
            />
          </label>

          <button className="checkout-btn" disabled={saving || !canClose}>
            {saving ? 'Closing...' : 'Close Day & Reset Current Record'}
          </button>

          {!canClose && (
            <p className="warning-text">
              Walang open paid orders ngayon. Kapag nagbenta ulit, automatic
              bagong record na iyon.
            </p>
          )}
        </form>

        <div className="panel-card">
          <h3>Closing history</h3>

          <div className="rank-list closing-list">
            {closings?.length ? (
              closings.map((closing) => (
                <div
                  key={closing._id || closing.closingNo}
                  className="closing-row"
                >
                  <span>
                    <strong>{closing.closingNo}</strong>
                    <small>
                      {closing.businessDate} • {dateTime(closing.createdAt)} •{' '}
                      {closing.cashier}
                    </small>
                  </span>

                  <strong>{peso(closing.summary?.netSales, currency)}</strong>

                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => setSelectedClosing(closing)}
                  >
                    View
                  </button>

                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => exportClosingCsv(closing)}
                  >
                    CSV
                  </button>

                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => printClosing(closing)}
                  >
                    Print
                  </button>
                </div>
              ))
            ) : (
              <p className="muted-text">No daily closing records yet.</p>
            )}
          </div>
        </div>
      </div>

      {previewClosing && (
        <div className="panel-card closing-print-area">
          <div className="section-head">
            <div>
              <p className="eyebrow">Saved record</p>
              <h2>{previewClosing.closingNo}</h2>
            </div>

            <div className="row-actions no-print">
              <button
                className="ghost-btn"
                type="button"
                onClick={() => exportClosingCsv(previewClosing)}
              >
                Export CSV
              </button>

              <button
                className="primary-btn"
                type="button"
                onClick={() => printClosing(previewClosing)}
              >
                Print
              </button>
            </div>
          </div>

          <div className="closing-receipt">
            <h3>Daily Sales Closing</h3>

            <p>
              Business Date:{' '}
              <strong>{previewClosing.businessDate}</strong>
            </p>

            <p>
              Closed By: <strong>{previewClosing.cashier}</strong>
            </p>

            <p>
              Closed At:{' '}
              <strong>{dateTime(previewClosing.createdAt)}</strong>
            </p>

            {previewClosing.notes && <p>Notes: {previewClosing.notes}</p>}

            <div className="totals-card flat">
              <div>
                <span>Orders</span>
                <strong>{previewClosing.summary?.orders || 0}</strong>
              </div>

              <div>
                <span>Gross Sales</span>
                <strong>
                  {peso(previewClosing.summary?.grossSales, currency)}
                </strong>
              </div>

              <div>
                <span>Discounts</span>
                <strong>
                  {peso(previewClosing.summary?.discounts, currency)}
                </strong>
              </div>

              <div>
                <span>Service Charge</span>
                <strong>
                  {peso(previewClosing.summary?.serviceCharge, currency)}
                </strong>
              </div>

              <div>
                <span>Tax</span>
                <strong>{peso(previewClosing.summary?.tax, currency)}</strong>
              </div>

              <div className="grand">
                <span>Net Sales</span>
                <strong>
                  {peso(previewClosing.summary?.netSales, currency)}
                </strong>
              </div>
            </div>

            <h4>Top Items</h4>

            <div className="rank-list">
              {previewClosing.topItems?.length ? (
                previewClosing.topItems.map((item) => (
                  <div key={item._id}>
                    <span>{item._id}</span>
                    <strong>
                      {item.qty} • {peso(item.sales, currency)}
                    </strong>
                  </div>
                ))
              ) : (
                <p className="muted-text">No items.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
