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
<div className="logo-mark">
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Replace this path with your actual logo path */}
    <circle cx="20" cy="20" r="18" fill="#4F46E5" />
    <path d="M12 28L28 12M28 28L12 12" stroke="white" strokeWidth="3" strokeLinecap="round" />
    {/* Or use your own SVG paths here */}
  </svg>
</div>        <div>
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

      
    </aside>
  );
}
