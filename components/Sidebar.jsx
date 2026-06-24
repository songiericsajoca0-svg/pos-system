'use client';

const nav = [
  { id: 'register', label: 'Register', icon: '🧾' },
  { id: 'orders', label: 'Orders', icon: '📚' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'closing', label: 'Daily Close', icon: '🔒' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

function POSLogo() {
  return (
    <div className="logo-mark" aria-hidden="true">
      <svg className="logo-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoBody" x1="10" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7ED" />
            <stop offset="1" stopColor="#FED7AA" />
          </linearGradient>
          <linearGradient id="logoAccent" x1="13" y1="14" x2="51" y2="51" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F97316" />
            <stop offset="1" stopColor="#7C2D12" />
          </linearGradient>
          <filter id="logoShadow" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#7C2D12" floodOpacity="0.22" />
          </filter>
        </defs>

        <rect x="6" y="6" width="52" height="52" rx="17" fill="url(#logoBody)" filter="url(#logoShadow)" />
        <rect x="12" y="13" width="40" height="25" rx="8" fill="#11100E" />
        <rect x="16" y="17" width="32" height="14" rx="4" fill="#FFF7ED" />
        <path d="M20 24H31" stroke="url(#logoAccent)" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 29H26" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />
        <path d="M37 22C37 19.8 38.8 18 41 18H43.5C45.4 18 47 19.6 47 21.5C47 23.4 45.4 25 43.5 25H43" stroke="url(#logoAccent)" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M39 20.5V27.5C39 29.4 40.6 31 42.5 31H43" stroke="url(#logoAccent)" strokeWidth="2.6" strokeLinecap="round" />

        <rect x="14" y="36" width="36" height="14" rx="5" fill="url(#logoAccent)" />
        <rect x="19" y="40" width="7" height="6" rx="2" fill="#FFF7ED" opacity="0.95" />
        <circle cx="35" cy="43" r="2.4" fill="#FFF7ED" opacity="0.95" />
        <circle cx="43" cy="43" r="2.4" fill="#FFF7ED" opacity="0.75" />
        <path d="M21 53H43" stroke="#11100E" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
      </svg>
    </div>
  );
}

export default function Sidebar({ activeTab, setActiveTab, cartCount, offlineMode, storeName }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <POSLogo />
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
