'use client';

const nav = [
  { id: 'register', label: 'Register', icon: '🧾' },
  { id: 'orders', label: 'Orders', icon: '📚' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'closing', label: 'Daily Close', icon: '🔒' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function Sidebar({ activeTab, setActiveTab, cartCount, offlineMode, storeName }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="logo-mark">ko.fi</div>
        <div>
          <p className="eyebrow">POS System</p>
          <h2>{storeName || 'The Point Ko.fi'}</h2>
        </div>
      </div>

      <nav className="nav-list">
        {nav.map((item) => (
          <button
            key={item.id}
            className={activeTab === item.id ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
            {item.id === 'register' && cartCount > 0 && <b>{cartCount}</b>}
          </button>
        ))}
      </nav>

      <div className="sidebar-card">
        <p className="eyebrow">Status</p>
        <strong>{offlineMode ? 'Demo mode' : 'MongoDB connected'}</strong>
        <small>{offlineMode ? 'Set MONGODB_URI then seed menu.' : 'Ready for Vercel deployment.'}</small>
      </div>
    </aside>
  );
}
