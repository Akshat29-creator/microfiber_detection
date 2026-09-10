'use client';
import { useWS } from '@/context/WebSocketContext';
import { Layers, Undo2, Plus, CheckCircle2, Sliders, TrendingUp, History } from 'lucide-react';
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend
} from 'recharts';

export default function CalibrationPage() {
  const { calibrationStack, sendCommand, connected, mode, demoCalibPush, demoCalibUndo } = useWS();
  const [localStack, setLocalStack] = useState<{ baseline: number; threshold: number; correction: number; timestamp: number; desc: string }[]>([]);
  const [newBaseline, setNewBaseline] = useState('');
  const [newThreshold, setNewThreshold] = useState('');

  const displayStack = connected
    ? calibrationStack.map((c) => ({ baseline: c.baseline, threshold: c.threshold, correction: c.correction, timestamp: c.timestamp, desc: c.description }))
    : localStack;

  const activeState = displayStack[0] || (mode === 'demo' ? { baseline: 3.0, threshold: 2.5, correction: 1.0, timestamp: 0, desc: 'Simulation Baseline' } : null);

  const pushState = () => {
    const b = parseFloat(newBaseline) || +(2.95 + Math.random() * 0.15).toFixed(2);
    const t = parseFloat(newThreshold) || +(2.45 + Math.random() * 0.1).toFixed(2);
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'calibrate', action: 'push', baseline: b, threshold: t });
    } else if (mode === 'demo') {
      demoCalibPush(b, t);
    } else {
      const c = 1.0;
      const ts = displayStack.length * 2 + 1;
      const desc = `Calibration #${displayStack.length + 1}`;
      setLocalStack((prev) => [{ baseline: b, threshold: t, correction: c, timestamp: ts, desc }, ...prev]);
    }
    setNewBaseline('');
    setNewThreshold('');
  };

  const undo = () => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'calibrate', action: 'undo' });
    } else if (mode === 'demo') {
      demoCalibUndo();
    } else {
      setLocalStack((prev) => prev.slice(1));
    }
  };

  const fillDemo = () => {
    if (mode === 'demo') {
      const presets = [
        { b: 2.9, t: 2.4 },
        { b: 2.95, t: 2.45 },
        { b: 3.0, t: 2.5 },
        { b: 3.05, t: 2.55 },
      ];
      presets.forEach((p) => demoCalibPush(p.b, p.t));
    } else {
      const demo = [
        { baseline: 3.05, threshold: 2.55, correction: 1.0, timestamp: 8.0, desc: 'Laser Re-alignment Baseline' },
        { baseline: 3.0, threshold: 2.5, correction: 1.0, timestamp: 5.5, desc: 'Thermal Compensation Snapshot' },
        { baseline: 2.95, threshold: 2.45, correction: 1.0, timestamp: 3.0, desc: 'Warmup Calibration' },
        { baseline: 2.9, threshold: 2.4, correction: 1.0, timestamp: 1.0, desc: 'Factory Initial Reference' },
      ];
      setLocalStack(demo);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Calibration History (Stack LIFO)
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Baseline optical voltage snapshot stack with atomic push, rollback undo, and Last-In-First-Out inspection
        </p>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Active Baseline</span>
            <Sliders size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">
            {activeState ? (
              <>{activeState.baseline.toFixed(2)} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>V</span></>
            ) : (
              <>-- <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>V</span></>
            )}
          </div>
          <span className={`metric-badge ${activeState ? 'cyan' : 'rose'}`}>
            {activeState ? 'Top of Stack Reference' : 'Awaiting Calibration'}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Active Threshold</span>
            <Sliders size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val">
            {activeState ? (
              <>{activeState.threshold.toFixed(2)} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>V</span></>
            ) : (
              <>-- <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>V</span></>
            )}
          </div>
          <span className={`metric-badge ${activeState ? 'rose' : 'gray'}`}>
            {activeState ? 'Occlusion Limit' : 'Uncalibrated'}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Stack Depth</span>
            <Layers size={15} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div className="metric-val">{displayStack.length} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>snapshots</span></div>
          <span className={`metric-badge ${displayStack.length > 0 ? 'cyan' : 'gray'}`}>
            {displayStack.length > 0 ? 'LIFO Depth' : 'Stack Empty'}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Stack Status</span>
            <CheckCircle2 size={15} style={{ color: displayStack.length > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
          </div>
          <div className="metric-val" style={{ fontSize: 18 }}>
            {displayStack.length > 0 ? 'CALIBRATED' : (mode === 'real' && !connected ? 'OFFLINE' : 'AWAITING SNAPSHOT')}
          </div>
          <span className={`metric-badge ${displayStack.length > 0 ? 'green' : 'amber'}`}>
            {displayStack.length > 0 ? 'Nominal Optics' : 'Zero Snapshots'}
          </span>
        </div>
      </div>

      {/* 2-Column Section */}
      <div className="dashboard-columns">
        {/* Left: Push & Controls */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Stack Operations</div>
              <div className="card-subtitle">Push a new calibration snapshot or pop to restore previous</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Baseline Voltage (V)
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 3.05"
                  value={newBaseline}
                  onChange={(e) => setNewBaseline(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Detection Threshold (V)
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 2.50"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={pushState}
              >
                <Plus size={14} />
                <span>Push Snapshot (LIFO)</span>
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={undo}
                disabled={displayStack.length === 0}
              >
                <Undo2 size={14} />
                <span>Undo / Pop</span>
              </button>
            </div>

            {mode === 'demo' && (
              <button className="btn btn-secondary" onClick={fillDemo} style={{ justifyContent: 'center', marginTop: 4 }}>
                Populate Calibration Snapshots
              </button>
            )}

            <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 10 }}>
              <strong style={{ color: 'var(--text-primary)' }}>LIFO Mechanics:</strong> Each new calibration pushed to the stack immediately overrides the detection reference voltage. Popping the top element atomically rolls back the optical system to the previous verified baseline.
            </div>
          </div>
        </div>

        {/* Right: Visual Stack Tower */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Visual Stack Tower</div>
              <div className="card-subtitle">TOP OF STACK is at the top</div>
            </div>
            <span className="badge badge-blue">{displayStack.length} entries</span>
          </div>

          {displayStack.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 16px' }}>
              Stack is empty. Push a calibration snapshot to observe LIFO ordering.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
              {displayStack.map((s, idx) => {
                const isTop = idx === 0;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius)',
                      background: isTop ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isTop ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isTop && <span className="badge badge-cyan" style={{ fontSize: 10 }}>TOP (ACTIVE)</span>}
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {s.desc || `Snapshot #${displayStack.length - idx}`}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        ts: {s.timestamp.toFixed(1)}s • Baseline: <strong>{s.baseline.toFixed(2)}V</strong> • Threshold: <strong>{s.threshold.toFixed(2)}V</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: isTop ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                      {s.baseline.toFixed(2)}V
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Optical Baseline Calibration Drift History */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Optical Baseline Drift & Thermal Compensation Timeline</div>
            <div className="card-subtitle">Voltage stability tracking across stack calibration snapshots with ±0.05V tolerance band</div>
          </div>
          <span className="badge badge-cyan">Stability Index</span>
        </div>

        <div style={{ width: '100%', height: 230, marginTop: 10 }}>
          {displayStack.length > 0 ? (
            <ResponsiveContainer>
              <LineChart
                data={[...displayStack].reverse().map((s, idx) => ({
                  name: `Snap #${idx + 1}`,
                  baseline: s.baseline,
                  threshold: s.threshold,
                  upperTol: +(s.baseline + 0.05).toFixed(3),
                  lowerTol: +(s.baseline - 0.05).toFixed(3),
                }))}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis domain={[2.3, 3.3]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} unit="V" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Line type="stepAfter" dataKey="baseline" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4 }} name="Baseline Voltage (Top of Stack)" />
                <Line type="stepAfter" dataKey="threshold" stroke="#f43f5e" strokeWidth={1.8} strokeDasharray="3 3" dot={{ r: 3 }} name="Occlusion Threshold" />
                <Line type="monotone" dataKey="upperTol" stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" dot={false} name="Upper Drift Bound (+0.05V)" />
                <Line type="monotone" dataKey="lowerTol" stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" dot={false} name="Lower Drift Bound (-0.05V)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={32} style={{ color: 'var(--text-muted)', marginBottom: 8, opacity: 0.5 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {mode === 'real' ? 'No Hardware Calibration Snapshots Recorded' : 'Calibration Stack Empty'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {mode === 'real'
                  ? 'Connect your ESP32 or push a snapshot above to record baseline drift.'
                  : 'Push a calibration snapshot above to observe baseline drift.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded C++ Stack LIFO Architecture Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Stack Data Structure Microcontroller Architecture</div>
            <div className="card-subtitle">LIFO push and pop mechanics for atomic state rollback without heap allocation</div>
          </div>
          <span className="badge badge-purple">LIFO State Engine</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>C++ STACK IMPLEMENTATION</div>
            <pre style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)', lineHeight: 1.4 }}>
{`class CalibrationStack {
  CalibrationSnapshot stack[10];
  int top = -1; // Empty
public:
  void push(CalibrationSnapshot s) {
    if (top < 9) stack[++top] = s;
  }
  CalibrationSnapshot pop() {
    return (top >= 0) ? stack[top--] : default;
  }
};`}
            </pre>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 6 }}>COMPLEXITY & SAFETY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Push Op:</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) Constant</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Pop (Undo):</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) Constant</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Memory:</span>
                <strong style={{ display: 'block', color: 'var(--accent-purple)', fontFamily: "'JetBrains Mono', monospace" }}>Zero Malloc (Static)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Rollback:</span>
                <strong style={{ display: 'block', color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>Atomic Revert</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 6 }}>CYBER-PHYSICAL APPLICATION</div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              If ambient lighting shifts (e.g., direct sunlight on transparent tubing), a calibration snapshot is pushed. If the operator realizes the cuvette had condensation, the single Undo/Pop action immediately restores the previous baseline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
