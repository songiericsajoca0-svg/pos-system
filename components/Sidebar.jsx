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
<div
  className="logo-mark"
  onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -18;

    e.currentTarget.querySelector("svg").style.transform =
      `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) scale(1.08)`;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.querySelector("svg").style.transform =
      "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
  }}
  style={{
    width: 90,
    height: 90,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  }}
>
  <svg
    width="70"
    height="70"
    viewBox="0 0 40 40"
    fill="none"
    style={{
      transition: "all .15s ease",
filter: "drop-shadow(0 12px 24px rgba(90,58,36,.45))",    }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
  <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40">
    <stop offset="0%" stopColor="#2B2B2B" />
    <stop offset="50%" stopColor="#4A2C2A" />
    <stop offset="100%" stopColor="#8B5E3C" />
  </linearGradient>
</defs>

    <circle cx="20" cy="20" r="18" fill="url(#grad)" opacity=".08">
      <animate attributeName="r" values="18;20;18" dur="2s" repeatCount="indefinite"/>
    </circle>

    <rect x="6" y="20" width="28" height="16" rx="2"
      stroke="url(#grad)" strokeWidth="2.5"/>

    <g>
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0 0;0 -1;0 0"
        dur="2s"
        repeatCount="indefinite"
      />

      <rect x="10" y="10" width="20" height="12" rx="2"
        stroke="url(#grad)" strokeWidth="2.5"/>

      <line x1="14" y1="16" x2="26" y2="16"
        stroke="#3B2A24" strokeWidth="2" strokeLinecap="round"/>

      <line x1="14" y1="13" x2="20" y2="13"
        stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round"/>
    </g>

    <circle cx="12" cy="30" r="3" stroke="url(#grad)" strokeWidth="2">
      <animate attributeName="r" values="3;3.3;3" dur="1.6s" repeatCount="indefinite"/>
    </circle>

    <circle cx="28" cy="30" r="3" stroke="url(#grad)" strokeWidth="2">
      <animate attributeName="r" values="3;3.3;3" dur="1.6s" begin=".3s" repeatCount="indefinite"/>
    </circle>

    <rect x="17" y="26" width="6" height="4" rx="1" fill="url(#grad)">
      <animate attributeName="opacity" values="1;.4;1" dur="1.5s" repeatCount="indefinite"/>
    </rect>

    <rect x="28" y="22" width="4" height="2" rx=".5" fill="#8B5E3C">
      <animate attributeName="x" values="28;31;28" dur="1.2s" repeatCount="indefinite"/>
    </rect>

    <circle cx="8" cy="8" r=".7" fill="#8B5E3C"">
      <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
    </circle>

    <circle cx="33" cy="8" r=".7" fill="#4A2C2A">
      <animate attributeName="opacity" values="1;0;1" dur="2.2s" repeatCount="indefinite"/>
    </circle>
  </svg>
</div> <div>
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
