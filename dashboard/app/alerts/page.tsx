'use client';
import { useWS } from '@/context/WebSocketContext';
import { Bell, AlertTriangle, AlertCircle, Info, ShieldAlert, CheckCircle2, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface LocalAlert {
  type: string;
  message: string;
  timestamp: number;
  priority: number;
}

export default function AlertsPage() {
  const { alerts: wsAlerts, sendCommand, connected, mode, demoAlertAdd, demoAlertProcessOne, demoAlertProcessAll } = useWS();
  const [localQueue, setLocalQueue] = useState<LocalAlert[]>([]);
  const [processedCount, setProcessedCount] = useState(0);

  const displayQueue = mode === 'real'
    ? wsAlerts.map((a) => ({ type: a.type, message: a.message, timestamp: a.timestamp, priority: a.priority }))
    : (connected ? wsAlerts.map((a) => ({ type: a.type, message: a.message, timestamp: a.timestamp, priority: a.priority })) : localQueue);

  const addAlert = (priority: number) => {
    const messages: Record<number, string[]> = {
      1: ['12V Pump Cutoff: Turbidity Clarity Abort', 'Chamber Temperature Overheat (>45°C)', 'Hardware Relay Rail Drop'],
      2: ['Photodiode Baseline Drift Detected', 'Laser Diode Output Power Fluctuation', 'ESP32 Low SRAM Heap (<50KB)'],
      3: ['Muddy Water Sample Rejected (<2.50V)', 'Optical Cell Occlusion Timeout', 'Calibration Baseline Rolled Back'],
      4: ['Optical Cell Reference Zeroed', 'Hardware Diagnostics Nominal', 'Moving Average Buffer Reset'],
    };
    const types: Record<number, string> = { 1: 'CRITICAL', 2: 'ERROR', 3: 'WARNING', 4: 'INFO' };
    const m = messages[priority] || messages[4];
    const msg = m[Math.floor(Math.random() * m.length)];

    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'alertQueue', action: 'addPriority', message: msg, priority });
    } else if (mode === 'demo') {
      demoAlertAdd(priority);
    } else {
      setLocalQueue((prev) => [...prev, { type: types[priority], message: msg, timestamp: Date.now() / 1000, priority }]);
    }
  };

  const processOne = () => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'alertQueue', action: 'processOne' });
    } else if (mode === 'demo') {
      demoAlertProcessOne();
    } else {
      setLocalQueue((prev) => prev.slice(1));
    }
    setProcessedCount((c) => c + 1);
  };

  const processAll = () => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'alertQueue', action: 'processAll' });
    } else if (mode === 'demo') {
      demoAlertProcessAll();
    } else {
      setProcessedCount((c) => c + localQueue.length);
      setLocalQueue([]);
    }
  };

  const critCount = displayQueue.filter((a) => a.priority === 1).length;
  const warnCount = displayQueue.filter((a) => a.priority === 3).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Alert Queue (Priority Queue FIFO)
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Hardware failsafe alert dispatch ordered by severity priority (Critical &gt; Error &gt; Warning &gt; Info)
        </p>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Enqueued Alerts</span>
            <Bell size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{displayQueue.length}</div>
          <span className="metric-badge cyan">Pending Dispatch</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Critical Alerts</span>
            <ShieldAlert size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val">{critCount}</div>
          <span className="metric-badge rose">Immediate Action</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Failsafe Warnings</span>
            <AlertTriangle size={15} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="metric-val">{warnCount}</div>
          <span className="metric-badge amber">Turbidity Breaches</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Processed Alerts</span>
            <CheckCircle2 size={15} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="metric-val">{processedCount}</div>
          <span className="metric-badge green">Resolved</span>
        </div>
      </div>

      {/* 2-Column Section */}
      <div className="dashboard-columns">
        {/* Left: Enqueue & Dequeue Controls */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Priority Enqueue Controls</div>
              <div className="card-subtitle">Push hardware events into the queue by priority level</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-danger" onClick={() => addAlert(1)} style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={14} /> Priority 1: Critical (Pump Cutoff)
              </span>
              <span className="badge badge-red">P1</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => addAlert(2)}
              style={{ justifyContent: 'space-between', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} /> Priority 2: Error (Sensor Drift)
              </span>
              <span className="badge badge-yellow">P2</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => addAlert(3)}
              style={{ justifyContent: 'space-between', borderColor: 'rgba(245, 158, 11, 0.3)' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> Priority 3: Warning (Muddy Sample)
              </span>
              <span className="badge badge-yellow">P3</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => addAlert(4)}
              style={{ justifyContent: 'space-between', borderColor: 'rgba(6, 182, 212, 0.3)' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={14} /> Priority 4: Info (Diagnostics OK)
              </span>
              <span className="badge badge-cyan">P4</span>
            </button>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="btn btn-primary"
                onClick={processOne}
                disabled={displayQueue.length === 0}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Play size={14} /> Dequeue Next (FIFO)
              </button>
              <button
                className="btn btn-secondary"
                onClick={processAll}
                disabled={displayQueue.length === 0}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Trash2 size={14} /> Flush Queue
              </button>
            </div>
          </div>
        </div>

        {/* Right: Active Queue Feed */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Enqueued Alerts Feed</div>
              <div className="card-subtitle">FRONT is dequeued first</div>
            </div>
            <span className="badge badge-blue">{displayQueue.length} pending</span>
          </div>

          {displayQueue.length === 0 ? (
            <div className="empty-state" style={{ padding: '50px 16px' }}>
              Queue is empty. No hardware alerts pending dispatch.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
              {displayQueue.map((a, idx) => {
                const isFront = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`alert-item ${a.type?.toLowerCase()}`}
                    style={{
                      borderLeft: isFront ? '3px solid var(--accent-cyan)' : undefined,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        {isFront && <span className="badge badge-cyan" style={{ fontSize: 9 }}>FRONT</span>}
                        <span
                          className={`badge ${
                            a.priority === 1
                              ? 'badge-red'
                              : a.priority === 2 || a.priority === 3
                              ? 'badge-yellow'
                              : 'badge-blue'
                          }`}
                        >
                          {a.type || `P${a.priority}`}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {a.timestamp ? `${a.timestamp.toFixed(1)}s` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{a.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hardware Safeguard Interlock Matrix Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Hardware Safeguard Interlock & Firmware Dispatch Matrix</div>
            <div className="card-subtitle">Automated cyber-physical actions dispatched by the ESP32 for each alert tier</div>
          </div>
          <span className="badge badge-rose">Safety Certified</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Physical Trip Condition</th>
              <th>Microcontroller Action</th>
              <th>Hardware Interlock</th>
              <th>Queue Priority</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                tier: 'P1: CRITICAL',
                badge: 'badge-red',
                condition: 'Chamber Temperature > 45°C OR Turbidity Clarity Abort',
                action: 'Emergency cutoff of 12V Peristaltic Pump via GPIO 26 relay',
                interlock: 'Hard relay disconnect (Hardware Level)',
                order: 'Head of Queue (Immediate Dequeue)',
              },
              {
                tier: 'P2: ERROR',
                badge: 'badge-yellow',
                condition: 'Laser output degradation (< 2.80V baseline drift)',
                action: 'Flag calibration stack for rollback & notify operator',
                interlock: 'Laser current limit check',
                order: 'Preempts warnings and info logs',
              },
              {
                tier: 'P3: WARNING',
                badge: 'badge-yellow',
                condition: 'Muddy inflow detected (Turbidity ADC < 2.50V)',
                action: 'Cycle divert valve & halt test sample ingestion',
                interlock: 'Solenoid divert valve',
                order: 'Standard FIFO warning buffer',
              },
              {
                tier: 'P4: INFO',
                badge: 'badge-cyan',
                condition: 'Routine diagnostics, zero calibration, heartbeat',
                action: 'Log to telemetry packet for WebSocket streaming',
                interlock: 'None (Informational)',
                order: 'Lowest priority dispatch',
              },
            ].map((row, i) => (
              <tr key={i}>
                <td>
                  <span className={`badge ${row.badge}`}>{row.tier}</span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.condition}</td>
                <td style={{ fontSize: 12 }}>{row.action}</td>
                <td>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.interlock}</span>
                </td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--accent-cyan)' }}>
                  {row.order}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Embedded Priority Queue C++ Architecture */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Priority Queue Data Structure Implementation</div>
            <div className="card-subtitle">Min/Max priority linked list sorting mechanics in FreeRTOS memory</div>
          </div>
          <span className="badge badge-purple">Priority Ordered FIFO</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>C++ QUEUE NODE STRUCT</div>
            <pre style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)', lineHeight: 1.4 }}>
{`struct AlertNode {
  uint8_t priority; // 1 = Highest
  char message[48];
  double timestamp;
  AlertNode* next;
}; // Sorted by priority on insert`}
            </pre>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 6 }}>TIME & SPACE COMPLEXITY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Dequeue (FIFO):</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) Instant</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Enqueue (Sorted):</span>
                <strong style={{ display: 'block', color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>O(k) where k ≤ 20</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Front Peek:</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) Instant</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Heap Safety:</span>
                <strong style={{ display: 'block', color: 'var(--accent-purple)', fontFamily: "'JetBrains Mono', monospace" }}>Static Cap (20 Max)</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 6 }}>FAILSAFE RELIABILITY</div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              If a critical turbidity or thermal breach occurs while multiple informational logs are being queued, the Priority Queue guarantees the critical pump cutoff command jumps straight to the front for instantaneous execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
