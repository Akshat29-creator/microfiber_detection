'use client';
import { useWS } from '@/context/WebSocketContext';
import { useState, useEffect } from 'react';
import { Cpu, Droplets, Zap, Activity } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function TopCommandBar() {
  const {
    mode,
    connected,
    sensors,
    systemStatus,
    detections,
  } = useWS();

  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isPumpOn = systemStatus.pump === 'RUNNING';
  const isLaserOn = systemStatus.laser === 'ON';

  const pageNames: Record<string, string> = {
    '/': 'Dashboard Overview',
    '/simulation': 'Pipeline Simulation',
    '/system': 'System Diagnostics',
    '/sensor-log': 'Sensor Log (Singly Linked List)',
    '/events': 'Event History (Doubly Linked List)',
    '/sliding-window': 'Sliding Window (Circular Linked List)',
    '/calibration': 'Calibration (Stack LIFO)',
    '/alerts': 'Alert Queue (Priority Queue)',
    '/bst': 'Detection Index (Binary Search Tree)',
    '/sorting': 'Sorting Algorithms Benchmark',
    '/searching': 'Searching Algorithms Benchmark',
  };

  const currentTitle = pageNames[pathname] || 'Dashboard';

  return (
    <header className="top-command-bar">
      {/* Left: Clean Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>MicroDetect</span>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{currentTitle}</span>
      </div>

      {/* Center: Clean Telemetry Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Laser Status */}
        <div className="telemetry-pill">
          <span className={`telemetry-dot ${isLaserOn ? 'rose' : 'gray'}`} />
          <span>Laser:</span>
          <strong>{isLaserOn ? '650nm ON' : 'OFF'}</strong>
        </div>

        {/* Pump Status */}
        <div className="telemetry-pill">
          <span className={`telemetry-dot ${isPumpOn ? 'cyan' : 'gray'}`} />
          <span>Pump:</span>
          <strong>{isPumpOn ? 'RUNNING' : 'OFF'}</strong>
        </div>

        {/* Turbidity */}
        <div className="telemetry-pill">
          <span className={`telemetry-dot ${sensors.turbidity >= 2.50 ? 'emerald' : sensors.turbidity > 0 ? 'amber' : 'gray'}`} />
          <span>Turbidity:</span>
          <strong>
            {sensors.turbidity === 0
              ? 'STANDBY'
              : sensors.turbidity >= 2.50
              ? `${sensors.turbidity.toFixed(2)}V (Clear)`
              : `${sensors.turbidity.toFixed(2)}V (Muddy)`}
          </strong>
        </div>

        {/* ESP32 Heap */}
        <div className="telemetry-pill">
          <Cpu size={12} style={{ color: 'var(--accent-purple)' }} />
          <span>Heap:</span>
          <strong>{systemStatus.freeHeap > 0 ? `${Math.round(systemStatus.freeHeap / 1024)} KB` : '248 KB'}</strong>
        </div>
      </div>

      {/* Right: Mode & Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          className={`badge ${mode === 'real' ? (connected ? 'badge-green' : 'badge-red') : 'badge-cyan'}`}
          style={{ fontSize: 11, padding: '4px 8px' }}
        >
          {mode === 'real'
            ? (connected ? 'ESP32 Connected' : 'ESP32 Offline')
            : 'Demo Mode'}
        </span>

        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {timeStr || '--:--:--'}
        </span>
      </div>
    </header>
  );
}
