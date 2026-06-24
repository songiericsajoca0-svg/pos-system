'use client';

function peso(value, currency) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

export default function Dashboard({ report, orders, products, currency, reload }) {
  const summary = report?.summary || {};
  const averageTicket = Number(summary.orders || 0) ? Number(summary.netSales || 0) / Number(summary.orders || 1) : 0;
  const activeCount = products.filter((item) => item.active !== false).length;

  return (
    <section className="dashboard-page">
      <div className="section-head panel-card compact-head">
        <div>
          <p className="eyebrow">Business overview</p>
          <h2>Dashboard</h2>
        </div>
        <button className="ghost-btn" onClick={reload}>Refresh report</button>
      </div>

      <div className="metric-grid">
        <div className="metric-card"><span>Net sales today</span><strong>{peso(summary.netSales, currency)}</strong></div>
        <div className="metric-card"><span>Orders</span><strong>{summary.orders || 0}</strong></div>
        <div className="metric-card"><span>Average ticket</span><strong>{peso(averageTicket, currency)}</strong></div>
        <div className="metric-card"><span>Active menu items</span><strong>{activeCount}</strong></div>
      </div>

      <div className="split-dashboard">
        <div className="panel-card">
          <h3>Sales breakdown</h3>
          <div className="totals-card flat">
            <div><span>Gross sales</span><strong>{peso(summary.grossSales, currency)}</strong></div>
            <div><span>Discounts</span><strong>{peso(summary.discounts, currency)}</strong></div>
            <div><span>Service charge</span><strong>{peso(summary.serviceCharge, currency)}</strong></div>
            <div><span>Tax</span><strong>{peso(summary.tax, currency)}</strong></div>
            <div className="grand"><span>Net sales</span><strong>{peso(summary.netSales, currency)}</strong></div>
          </div>
        </div>

        <div className="panel-card">
          <h3>Top items</h3>
          <div className="rank-list">
            {report?.topItems?.length ? report.topItems.map((item) => (
              <div key={item._id}>
                <span>{item._id}</span>
                <strong>{item.qty} sold • {peso(item.sales, currency)}</strong>
              </div>
            )) : <p className="muted-text">Top item analytics will appear after MongoDB orders are saved.</p>}
          </div>
        </div>
      </div>

      <div className="split-dashboard">
        <div className="panel-card">
          <h3>Low stock alerts</h3>
          <div className="rank-list">
            {report?.lowStock?.length ? report.lowStock.map((item) => (
              <div key={item._id || item.sku}>
                <span>{item.name}</span>
                <strong>{item.stock} left</strong>
              </div>
            )) : <p className="muted-text">No low stock items.</p>}
          </div>
        </div>
        <div className="panel-card">
          <h3>Recent activity</h3>
          <div className="rank-list">
            {orders.slice(0, 6).map((order) => (
              <div key={order._id || order.receiptNo}>
                <span>{order.receiptNo}</span>
                <strong>{peso(order.total, currency)}</strong>
              </div>
            ))}
            {orders.length === 0 && <p className="muted-text">No orders yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
