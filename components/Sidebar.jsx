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
    {/* POS Terminal / Cash Register Icon */}
    <rect x="6" y="20" width="28" height="16" rx="2" stroke="#4F46E5" strokeWidth="2.5" />
    <rect x="10" y="10" width="20" height="12" rx="1.5" stroke="#4F46E5" strokeWidth="2.5" />
    <line x1="14" y1="16" x2="26" y2="16" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
    <line x1="14" y1="13" x2="20" y2="13" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="30" r="3" stroke="#4F46E5" strokeWidth="2" />
    <circle cx="28" cy="30" r="3" stroke="#4F46E5" strokeWidth="2" />
    <rect x="17" y="26" width="6" height="4" rx="1" fill="#4F46E5" />
    {/* Card swipe slot */}
    <line x1="28" y1="23" x2="34" y2="23" stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
</div>     <div>
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
