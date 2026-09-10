'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWS } from '@/context/WebSocketContext';
import {
  LayoutDashboard, Play, List, ArrowLeftRight, Circle, ArrowUpDown,
  Search, Layers, Bell, GitBranch, Cpu, Activity, Wifi, WifiOff
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: any;
  label: string;
  count?: number | string;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const {
    mode,
    connected,
    espIp,
    setEspIp,
    connect,
    disconnect,
    sensorLog,
    detections,
    circularBuffer,
    calibrationStack,
    alerts,
    bstData,
  } = useWS();

  const navItems: NavGroup[] = [
    {
      section: 'MONITORING',
      items: [
        { href: '/', icon: LayoutDashboard, label: 'Overview' },
        { href: '/simulation', icon: Play, label: 'Run Simulation' },
        { href: '/system', icon: Cpu, label: 'System Diagnostics' },
      ],
    },
    {
      section: 'DATA STRUCTURES',
      items: [
        { href: '/sensor-log', icon: List, label: 'Sensor Log (SLL)', count: sensorLog.length },
        { href: '/events', icon: ArrowLeftRight, label: 'Event History (DLL)', count: detections.length },
        { href: '/sliding-window', icon: Circle, label: 'Sliding Window (CLL)', count: `${circularBuffer.used}/10` },
        { href: '/calibration', icon: Layers, label: 'Calibration (Stack)', count: calibrationStack.length },
        { href: '/alerts', icon: Bell, label: 'Alert Queue', count: alerts.length },
        { href: '/bst', icon: GitBranch, label: 'Detection Tree (BST)', count: bstData.size },
      ],
    },
    {
      section: 'ALGORITHMS',
      items: [
        { href: '/sorting', icon: ArrowUpDown, label: 'Sorting Algorithms', count: 5 },
        { href: '/searching', icon: Search, label: 'Searching Algorithms', count: 2 },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Activity size={18} />
          </div>
          <div className="sidebar-logo-text">
            <h2>MicroDetect</h2>
            <p>ESP32 Optical Sensor System</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {navItems.map((group) => (
          <div key={group.section} style={{ marginBottom: 16 }}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className="nav-link-badge">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {mode === 'real' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              {connected ? <Wifi size={14} color="#10b981" /> : <WifiOff size={14} color="#f43f5e" />}
              <span style={{ fontSize: 12, fontWeight: 600, color: connected ? '#34d399' : '#f87171' }}>
                {connected ? 'Hardware Online' : 'Hardware Disconnected'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input"
                style={{ flex: 1, fontSize: 11, padding: '5px 8px' }}
                value={espIp}
                onChange={(e) => setEspIp(e.target.value)}
                placeholder="ESP32 IP"
              />
              <button
                className={`btn ${connected ? 'btn-danger' : 'btn-primary'}`}
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={connected ? disconnect : connect}
              >
                {connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Demo Environment</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>
              Simulated optical stream & 8 C++ DSA modules active
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
