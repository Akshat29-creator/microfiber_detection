'use client';
import { useWS } from '@/context/WebSocketContext';
import {
  Activity, Droplets, Thermometer, Zap, AlertTriangle, Cpu,
  List, ArrowLeftRight, Circle, Layers, GitBranch, ArrowRight,
  Play, RotateCcw, CheckCircle2, ShieldAlert
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid
} from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const {
    sensors,
    systemStatus,
    voltageHistory,
    alerts,
    detections,
    connected,
    mode,
    espIp,
    circularBuffer,
    calibrationStack,
    sensorLog,
    bstData,
  } = useWS();

  const isPumpOn = systemStatus.pump === 'RUNNING';
  const isLaserOn = systemStatus.laser === 'ON';
  const isClear = sensors.turbidity >= 2.50;

  const displayVoltageHistory = voltageHistory.length > 0
    ? voltageHistory
    : (mode === 'real'
        ? []  // Real mode: never show fake chart data — wait for actual ESP32 ADC readings
        : Array.from({ length: 24 }, (_, i) => ({
            ts: +(i * 0.2).toFixed(1),
            v: +(3.02 + Math.sin(i * 0.5) * 0.03 + (i % 2 === 0 ? 0.01 : -0.01)).toFixed(3),
          })));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Real-Mode Disconnected Warning Banner */}
      {mode === 'real' && !connected && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', fontSize: 13 }}>
            <ShieldAlert size={18} />
            <span>
              <strong>Hardware Disconnected:</strong> Connect your ESP32 in the sidebar to stream real ADC sensor data.
            </span>
          </div>
          <span className="badge badge-red">OFFLINE</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Microplastic Detection System
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Optical sensor telemetry, actuator control, and embedded DSA performance monitor
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/simulation" className="btn btn-primary">
            <Play size={14} />
            <span>Run Simulation</span>
          </Link>
        </div>
      </div>

      {/* Compact Hardware Pipeline Bar (1 Row) */}
      <div className="flow-bar">
        {/* Step 1 */}
        <div className="flow-step">
          <div className="flow-step-icon">
            <Droplets size={16} />
          </div>
          <div className="flow-step-content">
            <div className="flow-step-name">1. Water Sample</div>
            <div className="flow-step-status">Inflow Reservoir</div>
          </div>
        </div>

        <span className="flow-divider">→</span>

        {/* Step 2 */}
        <div className="flow-step">
          <div className="flow-step-icon">
            <Activity size={16} />
          </div>
          <div className="flow-step-content">
            <div className="flow-step-name">2. Peristaltic Pump</div>
            <div className="flow-step-status" style={{ color: isPumpOn ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
              {isPumpOn ? 'Active (500 mL/min)' : 'Idle (Off)'}
            </div>
          </div>
        </div>

        <span className="flow-divider">→</span>

        {/* Step 3 */}
        <div className="flow-step">
          <div className="flow-step-icon">
            <Droplets size={16} />
          </div>
          <div className="flow-step-content">
            <div className="flow-step-name">3. Turbidity Sensor</div>
            <div className="flow-step-status" style={{ color: isClear ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
              {mode === 'real' && !connected ? 'Standby (Offline)' : (isClear ? 'Clear (Optical Pass)' : 'Muddy (Failsafe Trip)')}
            </div>
          </div>
        </div>

        <span className="flow-divider">→</span>

        {/* Step 4 */}
        <div className="flow-step">
          <div className="flow-step-icon">
            <Zap size={16} />
          </div>
          <div className="flow-step-content">
            <div className="flow-step-name">4. 650nm Laser Cell</div>
            <div className="flow-step-status" style={{ color: isLaserOn ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
              {isLaserOn ? 'Beam Active' : 'Standby'}
            </div>
          </div>
        </div>

        <span className="flow-divider">→</span>

        {/* Step 5 */}
        <div className="flow-step">
          <div className="flow-step-icon">
            <CheckCircle2 size={16} />
          </div>
          <div className="flow-step-content">
            <div className="flow-step-name">5. Collection</div>
            <div className="flow-step-status">Effluent Filtered</div>
          </div>
        </div>
      </div>

      {/* 4 Key Metrics Cards */}
      <div className="metrics-grid">
        {/* Photodiode */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Photodiode (BPW34)</span>
            <Zap size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">
            {mode === 'real' && !connected ? (
              <>-- <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>V</span></>
            ) : (
              <>{sensors.photodiode.toFixed(2)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>V</span></>
            )}
          </div>
          <span className={`metric-badge ${mode === 'real' && !connected ? 'rose' : (sensors.photodiode < 2.50 && sensors.photodiode > 0 ? 'rose' : 'cyan')}`}>
            {mode === 'real' && !connected ? 'Hardware Disconnected' : (sensors.photodiode < 2.50 && sensors.photodiode > 0 ? 'Particle Occlusion' : 'Optical Baseline')}
          </span>
        </div>

        {/* Turbidity */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Turbidity Clarity</span>
            <Droplets size={15} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="metric-val">
            {mode === 'real' && !connected ? (
              <>-- <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>V</span></>
            ) : (
              <>{sensors.turbidity.toFixed(2)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>V</span></>
            )}
          </div>
          <span className={`metric-badge ${mode === 'real' && !connected ? 'gray' : (sensors.turbidity >= 2.50 ? 'green' : sensors.turbidity > 0 ? 'amber' : 'cyan')}`}>
            {mode === 'real' && !connected ? 'Hardware Offline' : (sensors.turbidity >= 2.50 ? 'Clear Water (Permitted)' : sensors.turbidity > 0 ? 'Muddy Water (Halted)' : 'Nominal')}
          </span>
        </div>

        {/* Temperature */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Fluid Temperature</span>
            <Thermometer size={15} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="metric-val">
            {mode === 'real' && !connected ? (
              <>-- <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>°C</span></>
            ) : (
              <>{sensors.temperature.toFixed(1)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>°C</span></>
            )}
          </div>
          <span className={`metric-badge ${mode === 'real' && !connected ? 'gray' : 'green'}`}>
            {mode === 'real' && !connected ? 'Awaiting Probe' : 'Thermal Drift Nominal'}
          </span>
        </div>

        {/* Detections */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Microplastics Detected</span>
            <AlertTriangle size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val" style={{ color: detections.length > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            {systemStatus.detections || detections.length} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>events</span>
          </div>
          <span className={`metric-badge ${detections.length > 0 ? 'rose' : (mode === 'real' && !connected ? 'gray' : 'cyan')}`}>
            {detections.length > 0 ? 'Logged in DLL & BST' : (mode === 'real' && !connected ? 'Offline' : 'No Particles')}
          </span>
        </div>
      </div>

      {/* Main 2-Column Section: Waveform Trace + Actuators & Alerts */}
      <div className="dashboard-columns">
        {/* Left: Continuous Waveform Trace */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Photodiode Voltage Waveform</div>
              <div className="card-subtitle">Continuous optical transmission. Drops below 2.50V indicate microplastic presence.</div>
            </div>
            <span className={`badge ${mode === 'real' ? (connected ? 'badge-green' : 'badge-red') : 'badge-blue'}`}>
              {mode === 'real' ? (connected ? 'Live ADC' : 'Hardware Offline') : 'Simulated'}
            </span>
          </div>

          <div style={{ width: '100%', height: 260, marginTop: 10 }}>
            {displayVoltageHistory.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={displayVoltageHistory}>
                  <defs>
                    <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis dataKey="ts" tick={false} axisLine={false} />
                  <YAxis
                    domain={[1.8, 3.6]}
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                    axisLine={false}
                    tickLine={false}
                    unit="V"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        const isDrop = d.v < 2.50;
                        return (
                          <div
                            style={{
                              background: '#0f172a',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: 'var(--radius)',
                              padding: '8px 12px',
                              fontSize: 12,
                            }}
                          >
                            <div style={{ color: 'var(--text-muted)' }}>t = {d.ts}s</div>
                            <div style={{ fontWeight: 700, color: isDrop ? '#f43f5e' : '#22d3ee' }}>
                              {d.v.toFixed(3)} V {isDrop && '(Drop Detected)'}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={2.50}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Detection Threshold (2.50V)',
                      fill: '#f43f5e',
                      fontSize: 11,
                      position: 'insideBottomRight',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#voltageGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={32} style={{ color: 'var(--text-muted)', marginBottom: 8, opacity: 0.5 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Hardware Disconnected (Zero Signal)</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Connect your ESP32 in the sidebar footer to stream live photodiode ADC voltages.
                </div>
              </div>
            )}
          </div>
          
          {/* Chamber Optical Metrics Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>TRANSMISSIVITY</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
                {mode === 'real' && !connected ? '--' : `${Math.min(100, Math.max(0, (sensors.photodiode / 3.05 * 100))).toFixed(1)}%`}
              </div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>OPTICAL SNR</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
                43.2 dB
              </div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ATTENUATION LIMIT</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-rose)', fontFamily: "'JetBrains Mono', monospace" }}>
                &lt; 2.500 V
              </div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SAMPLING CADENCE</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-purple)', fontFamily: "'JetBrains Mono', monospace" }}>
                100 Hz
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actuators & Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Hardware Actuators</div>
              <div className="card-subtitle">GPIO relay status & alert dispatch</div>
            </div>
          </div>

          {/* Actuator Status Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pump Relay (GPIO 26)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isPumpOn ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                  {systemStatus.pump || 'OFF'}
                </div>
              </div>
              <span className={`telemetry-dot ${isPumpOn ? 'cyan' : 'gray'}`} />
            </div>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Laser Diode (GPIO 25)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isLaserOn ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                  {isLaserOn ? '650nm ON' : 'OFF'}
                </div>
              </div>
              <span className={`telemetry-dot ${isLaserOn ? 'rose' : 'gray'}`} />
            </div>
          </div>

          {/* Alerts List */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="card-title" style={{ fontSize: 12 }}>Hardware Alerts Queue</div>
            <Link href="/alerts" style={{ fontSize: 11, color: 'var(--accent-cyan)', textDecoration: 'none' }}>
              View all ({alerts.length})
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius)', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <CheckCircle2 size={16} />
                <span>All Actuator Safeguards Nominal</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Laser regulated at 35mA. Turbidity failsafe armed (&gt;2.5V allowed). Pump thermal cutoff standby.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
              {alerts.slice(0, 3).map((a, i) => (
                <div key={i} className={`alert-item ${a.type?.toLowerCase()}`}>
                  <span>{a.message}</span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    {a.timestamp ? `${a.timestamp.toFixed(1)}s` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6 DSA Cards Grid */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Data Structure Telemetry</div>
            <div className="card-subtitle">In-memory C++ structures tracking sensor states and detections</div>
          </div>
        </div>

        <div className="dsa-grid">
          {[
            {
              tag: 'SLL',
              title: 'Sensor Log',
              desc: 'Sequential optical sensor readings logged with O(1) append',
              count: `${sensorLog.length} readings`,
              href: '/sensor-log',
            },
            {
              tag: 'DLL',
              title: 'Event History',
              desc: 'Bi-directional traversal of detected microplastic anomalies',
              count: `${detections.length} events`,
              href: '/events',
            },
            {
              tag: 'CLL',
              title: 'Sliding Window',
              desc: 'Circular 10-slot ring buffer for moving average smoothing',
              count: `${circularBuffer.used}/10 slots`,
              href: '/sliding-window',
            },
            {
              tag: 'STACK',
              title: 'Calibration History',
              desc: 'LIFO baseline voltage snapshots with rollback undo',
              count: `${calibrationStack.length} states`,
              href: '/calibration',
            },
            {
              tag: 'QUEUE',
              title: 'Alert Queue',
              desc: 'Priority queue for hardware failsafe and turbidity warnings',
              count: `${alerts.length} alerts`,
              href: '/alerts',
            },
            {
              tag: 'BST',
              title: 'Detection Index',
              desc: `Timestamp-indexed tree for O(log n) lookups (h=${bstData.height})`,
              count: `${bstData.size} nodes`,
              href: '/bst',
            },
          ].map((item, idx) => (
            <Link key={idx} href={item.href} className="dsa-card">
              <div>
                <div className="dsa-card-header">
                  <span className="dsa-card-tag">{item.tag}</span>
                  <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="dsa-card-title">{item.title}</div>
                <div className="dsa-card-desc">{item.desc}</div>
              </div>
              <div className="dsa-card-count">{item.count}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
