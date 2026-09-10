'use client';
import { useWS } from '@/context/WebSocketContext';
import { Cpu, Thermometer, Droplets, Zap, Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function SystemPage() {
  const {
    sensors,
    systemStatus,
    voltageHistory,
    connected,
    sendCommand,
    detections,
    alerts,
    sensorLog,
    calibrationStack,
    mode,
  } = useWS();

  const heapPct = systemStatus.freeHeap > 0 ? Math.min((systemStatus.freeHeap / 320000) * 100, 100) : 0;

  const displayVoltageHistory = voltageHistory.length > 0
    ? voltageHistory
    : (mode === 'real'
        ? []  // Real mode: never generate fake voltage chart data
        : Array.from({ length: 24 }, (_, i) => ({
            ts: +(i * 0.2).toFixed(1),
            v: +(3.01 + Math.sin(i * 0.5) * 0.03 + (i % 2 === 0 ? 0.01 : -0.01)).toFixed(3),
          })));

  const dsStructures = [
    { name: 'Sensor Log (SLL)', size: systemStatus.sensorLogSize || sensorLog.length, desc: 'Singly Linked List' },
    { name: 'Event History (DLL)', size: systemStatus.eventHistorySize || detections.length, desc: 'Doubly Linked List' },
    { name: 'Sliding Window (CLL)', size: `${systemStatus.slidingWindowSize}/${systemStatus.slidingWindowCap}`, desc: 'Circular Ring Buffer' },
    { name: 'Alert Queue', size: systemStatus.alertQueueSize || alerts.length, desc: 'Priority FIFO Queue' },
    { name: 'Calibration Stack', size: systemStatus.calibStackSize || calibrationStack.length, desc: 'LIFO Undo Stack' },
    { name: 'Detection BST', size: systemStatus.bstSize, desc: `BST Height: ${systemStatus.bstHeight}` },
  ];

  const hwComponents = [
    { label: '12V Water Pump', value: systemStatus.pump || 'OFF', icon: Droplets, active: systemStatus.pump === 'RUNNING', badge: systemStatus.pump === 'RUNNING' ? 'badge-cyan' : 'badge-red' },
    { label: '650nm Laser Diode', value: systemStatus.laser || 'OFF', icon: Zap, active: systemStatus.laser === 'ON', badge: systemStatus.laser === 'ON' ? 'badge-red' : 'badge-yellow' },
    { label: 'BPW34 Photodiode', value: (mode === 'real' && !connected) ? '-- V' : `${sensors.photodiode.toFixed(3)} V`, icon: Activity, active: mode === 'demo' || (connected && sensors.photodiode > 0), badge: (mode === 'real' && !connected) ? 'badge-red' : 'badge-cyan' },
    { label: 'Turbidity Sensor', value: (mode === 'real' && !connected) ? '-- V' : `${sensors.turbidity.toFixed(3)} V`, icon: Droplets, active: mode === 'demo' || (connected && sensors.turbidity > 0), badge: (mode === 'real' && !connected) ? 'badge-red' : (sensors.turbidity >= 2.5 ? 'badge-green' : 'badge-yellow') },
    { label: 'DS18B20 Thermistor', value: (mode === 'real' && !connected) ? '-- °C' : `${sensors.temperature.toFixed(1)} °C`, icon: Thermometer, active: mode === 'demo' || connected, badge: (mode === 'real' && !connected) ? 'badge-red' : 'badge-green' },
    { label: 'ESP32 MCU Core', value: (mode === 'real' && !connected) ? '-- KB free' : `${(systemStatus.freeHeap / 1024).toFixed(0)} KB free`, icon: Cpu, active: mode === 'demo' || connected, badge: (mode === 'real' && !connected) ? 'badge-red' : 'badge-blue' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          System Diagnostics
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Hardware health telemetry, GPIO relay actuation, sensor streams, and embedded SRAM allocation
        </p>
      </div>

      {mode === 'real' && !connected && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: '#f87171',
          }}
        >
          <WifiOff size={18} />
          <span>
            <strong>Hardware Disconnected:</strong> Connect your ESP32 in the sidebar (ws://&lt;IP&gt;:81) to read live physical telemetry.
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Hardware Link</span>
            {connected ? <Wifi size={15} color="#10b981" /> : <WifiOff size={15} color="#f43f5e" />}
          </div>
          <div className="metric-val" style={{ fontSize: 18 }}>
            {connected ? 'CONNECTED' : (mode === 'real' ? 'OFFLINE' : 'DEMO MODE')}
          </div>
          <span className={`metric-badge ${connected ? 'green' : 'rose'}`}>
            {connected ? 'WebSocket Active' : 'No Connection'}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Session Time</span>
            <Activity size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">
            {systemStatus.simTime.toFixed(1)} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>s</span>
          </div>
          <span className="metric-badge cyan">Elapsed Time</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Total Detections</span>
            <Zap size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val">
            {systemStatus.detections || detections.length} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>events</span>
          </div>
          <span className="metric-badge rose">Recorded</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Free SRAM Heap</span>
            <Cpu size={15} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div className="metric-val">
            {(systemStatus.freeHeap / 1024).toFixed(0)} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>KB</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 8 }}>
            <div style={{ width: `${heapPct}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="dashboard-columns">
        {/* Hardware Status Panel */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Hardware Components</div>
              <div className="card-subtitle">Actuator states & sensor ADC readings</div>
            </div>
            {connected && (
              <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => sendCommand({ cmd: 'status' })}>
                <RefreshCw size={12} /> Refresh
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {hwComponents.map((hw, i) => (
              <div key={i} className="hw-status">
                <div className="hw-label">
                  <span className={`hw-indicator ${hw.active ? 'on' : 'off'}`} />
                  <hw.icon size={15} style={{ color: 'var(--text-muted)' }} />
                  <span>{hw.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="hw-value">{hw.value}</span>
                  <span className={`badge ${hw.badge}`}>{hw.active ? 'ACTIVE' : 'IDLE'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voltage History Waveform */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Voltage History</div>
              <div className="card-subtitle">Continuous photodiode voltage stream</div>
            </div>
            <span className="badge badge-blue">{voltageHistory.length} samples</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={displayVoltageHistory}>
                <defs>
                  <linearGradient id="sysGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="ts" tick={false} axisLine={false} />
                <YAxis domain={[1.8, 3.6]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="V" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#06b6d4" fill="url(#sysGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DSA Memory Map */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Data Structure Memory Allocation</div>
            <div className="card-subtitle">In-memory C++ structures tracking sensor states and detections</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          {dsStructures.map((ds, i) => (
            <div
              key={i}
              style={{
                padding: '14px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-cyan)' }}>
                {ds.size}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{ds.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ds.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pin Map Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">ESP32 GPIO Pin Assignment</div>
            <div className="card-subtitle">Microcontroller hardware peripheral wiring</div>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Pin</th>
              <th>Type</th>
              <th>Peripheral Component</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { pin: 'GPIO 34', type: 'Analog ADC', component: 'Turbidity Sensor (A0)', status: sensors.turbidity > 0 },
              { pin: 'GPIO 35', type: 'Analog ADC', component: 'BPW34 Photodiode + LM358 Amp', status: sensors.photodiode > 0 },
              { pin: 'GPIO 4', type: 'Digital OneWire', component: 'DS18B20 Temperature Sensor', status: true },
              { pin: 'GPIO 26', type: 'Digital Output', component: '12V Relay (Peristaltic Pump)', status: systemStatus.pump === 'RUNNING' },
              { pin: 'GPIO 27', type: 'Digital Output', component: '650nm Laser Diode Transceiver', status: systemStatus.laser === 'ON' },
            ].map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>{p.pin}</td>
                <td>{p.type}</td>
                <td>{p.component}</td>
                <td>
                  <span className={`badge ${p.status ? 'badge-green' : 'badge-yellow'}`}>
                    {p.status ? 'ACTIVE' : 'IDLE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
