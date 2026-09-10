'use client';
import { useWS } from '@/context/WebSocketContext';
import { Plus, RotateCcw, Circle, Activity, TrendingDown, TrendingUp, Sliders, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine
} from 'recharts';

export default function SlidingWindowPage() {
  const { circularBuffer, sendCommand, connected, mode, demoSlidingWindowAdd } = useWS();
  const [localSlots, setLocalSlots] = useState<{ v: number; ts: number }[]>([]);
  const capacity = 10;
  const [writePos, setWritePos] = useState(0);

  const slots = connected ? circularBuffer.slots.map((s) => ({ v: s.voltage, ts: s.timestamp })) : localSlots;
  const used = connected ? circularBuffer.used : localSlots.length;
  const avg = slots.length > 0 ? slots.reduce((s, sl) => s + sl.v, 0) / slots.length : 0;
  const minV = slots.length > 0 ? Math.min(...slots.map((s) => s.v)) : 0;
  const maxV = slots.length > 0 ? Math.max(...slots.map((s) => s.v)) : 0;

  const addReading = () => {
    const v = +(2.6 + Math.random() * 0.5).toFixed(3);
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'slidingWindow', action: 'add', voltage: v });
    } else if (mode === 'demo') {
      demoSlidingWindowAdd(v);
    } else {
      const ts = Date.now() / 1000;
      setLocalSlots((prev) => {
        if (prev.length < capacity) return [...prev, { v, ts }];
        const next = [...prev];
        next[writePos] = { v, ts };
        setWritePos((writePos + 1) % capacity);
        return next;
      });
    }
  };

  const fillAll = () => {
    if (mode === 'demo') {
      for (let i = 0; i < capacity; i++) {
        demoSlidingWindowAdd(+(2.7 + Math.random() * 0.4).toFixed(3));
      }
    } else {
      const demo = Array.from({ length: capacity }, (_, i) => ({
        v: +(2.7 + Math.random() * 0.4).toFixed(3),
        ts: +(i * 0.3).toFixed(1),
      }));
      setLocalSlots(demo);
      setWritePos(0);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Sliding Window (Circular Linked List)
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Fixed 10-slot circular ring buffer computing a continuous moving average to filter optical photodiode noise
        </p>
      </div>

      {/* Operations Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Ring Buffer Operations</div>
            <div className="card-subtitle">Push readings with O(1) overwrite when buffer is saturated</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={addReading}>
            <Plus size={14} /> Insert Reading
          </button>
          <button className="btn btn-secondary" onClick={fillAll}>
            <RotateCcw size={14} /> Fill All 10 Slots
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            Capacity: <strong>10 slots</strong> • Used: <strong>{used} slots</strong>
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Moving Average</span>
            <Activity size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{avg > 0 ? avg.toFixed(3) : '0.000'} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>V</span></div>
          <span className="metric-badge cyan">Noise Filtered</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Buffer Sched</span>
            <Circle size={15} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="metric-val">{used} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 10</span></div>
          <span className={`metric-badge ${used === 10 ? 'green' : 'amber'}`}>
            {used === 10 ? 'Saturated (Ring Overwrite)' : 'Filling'}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Minimum Voltage</span>
            <TrendingDown size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val">{minV > 0 ? minV.toFixed(3) : '0.000'} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>V</span></div>
          <span className="metric-badge rose">Peak Attenuation</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Maximum Voltage</span>
            <TrendingUp size={15} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="metric-val">{maxV > 0 ? maxV.toFixed(3) : '0.000'} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>V</span></div>
          <span className="metric-badge cyan">Peak Transmission</span>
        </div>
      </div>

      {/* 2-Column Section: SVG Ring + Slots Table */}
      <div className="dashboard-columns">
        {/* Left: Circular Ring Visualizer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340 }}>
          <div style={{ width: '100%', marginBottom: 12 }}>
            <div className="card-title">Circular Ring Visualization</div>
            <div className="card-subtitle">Slot 9 tail points back to Slot 0 head</div>
          </div>

          <div style={{ position: 'relative', width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Center Moving Average Display */}
            <div style={{ textAlign: 'center', zIndex: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moving Avg</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-cyan)' }}>
                {avg > 0 ? avg.toFixed(3) : '0.000'} V
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{used} / 10 slots</div>
            </div>

            {/* SVG Connecting Ring */}
            <svg width="280" height="280" style={{ position: 'absolute', top: 0, left: 0 }}>
              <circle cx="140" cy="140" r="100" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="3" strokeDasharray="4 4" />
            </svg>

            {/* 10 Circular Slots */}
            {Array.from({ length: 10 }).map((_, idx) => {
              const angle = (idx * 36 - 90) * (Math.PI / 180);
              const r = 100;
              const x = 140 + r * Math.cos(angle);
              const y = 140 + r * Math.sin(angle);
              const slotData = slots[idx];
              const isFilled = idx < used;

              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    transform: 'translate(-50%, -50%)',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: isFilled
                      ? slotData?.v < 2.50
                        ? 'rgba(244, 63, 94, 0.2)'
                        : 'rgba(6, 182, 212, 0.2)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${
                      isFilled
                        ? slotData?.v < 2.50
                          ? 'var(--accent-rose)'
                          : 'var(--accent-cyan)'
                        : 'rgba(255, 255, 255, 0.1)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    color: isFilled ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.6 }}>#{idx}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                    {isFilled ? `${slotData.v.toFixed(1)}V` : '--'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Slot Data Records */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Slot Memory Map</div>
              <div className="card-subtitle">Array-backed circular buffer indexes</div>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Voltage</th>
                <th>Status</th>
                <th>Pointer Relation</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, idx) => {
                const s = slots[idx];
                const isFilled = idx < used;
                return (
                  <tr key={idx}>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>Slot [{idx}]</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isFilled ? (s.v < 2.5 ? 'var(--accent-rose)' : 'var(--text-primary)') : 'var(--text-muted)' }}>
                      {isFilled ? `${s.v.toFixed(3)} V` : 'Empty'}
                    </td>
                    <td>
                      <span className={`badge ${isFilled ? (s.v < 2.5 ? 'badge-red' : 'badge-green') : 'badge-yellow'}`}>
                        {isFilled ? (s.v < 2.5 ? 'OCCLUDED' : 'CLEAR') : 'AVAILABLE'}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {idx === 9 ? 'Circular → points to Slot [0]' : `points to Slot [${idx + 1}]`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Noisy ADC vs 10-Slot Moving Average Filtered Signal */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Hardware Noise Suppression: Raw ADC vs Moving Average Filter</div>
            <div className="card-subtitle">Real-time filtering demonstrating how the circular linked list mitigates optical sensor flutter</div>
          </div>
          <span className="badge badge-cyan">Low-Pass Filter</span>
        </div>

        <div style={{ width: '100%', height: 240, marginTop: 10 }}>
          <ResponsiveContainer>
            <LineChart
              data={Array.from({ length: 16 }, (_, i) => {
                const raw = +(2.98 + Math.sin(i * 0.8) * 0.12 + (i === 7 ? -0.72 : (i % 2 === 0 ? 0.09 : -0.08))).toFixed(3);
                const filtered = +(2.98 + Math.sin(i * 0.8) * 0.06 + (i === 7 ? -0.38 : 0)).toFixed(3);
                return {
                  t: `${(i * 0.1).toFixed(1)}s`,
                  raw,
                  filtered,
                };
              })}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis domain={[2.0, 3.4]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} unit="V" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
              <ReferenceLine y={2.50} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: '2.50V Threshold', fill: '#f43f5e', fontSize: 10 }} />
              <Line type="monotone" dataKey="raw" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} name="Raw Noisy ADC (Photodiode Flutter)" />
              <Line type="monotone" dataKey="filtered" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} name="10-Slot Moving Average (CLL Filtered)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Embedded C++ Circular Buffer Architecture */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Circular Linked List Microcontroller Architecture</div>
            <div className="card-subtitle">Constant-time O(1) buffer overwrite mechanics without array reallocation</div>
          </div>
          <span className="badge badge-purple">Zero-Reallocation Ring</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>C++ RING BUFFER STRUCT</div>
            <pre style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)', lineHeight: 1.4 }}>
{`class CircularWindow {
  SensorReading slots[10];
  int head = 0;
  int count = 0;
  double sum = 0.0;
  // O(1) Moving Average:
  // sum = sum - old + new;
};`}
            </pre>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 6 }}>ALGORITHMIC GUARANTEE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Insertion:</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) Constant</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Moving Avg:</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) Running Sum</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Memory:</span>
                <strong style={{ display: 'block', color: 'var(--accent-purple)', fontFamily: "'JetBrains Mono', monospace" }}>Static (Zero Malloc)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Ring Wrap:</span>
                <strong style={{ display: 'block', color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>idx = (idx+1)%10</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 6 }}>WHY EMBEDDED C++ USES CLL</div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              In real-time firmware, computing a moving average by summing 10 elements takes $O(k)$ time. By maintaining a running sum and overwriting the circular buffer in $O(1)$, the ESP32 samples at 100Hz with zero CPU lag.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
