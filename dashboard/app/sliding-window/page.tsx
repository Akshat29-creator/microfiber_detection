'use client';
import { useWS } from '@/context/WebSocketContext';
import { Plus, RefreshCw, Activity, Layers, CheckCircle2, AlertTriangle, CircleDot } from 'lucide-react';
import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';

export default function SlidingWindowPage() {
  const {
    circularBuffer,
    sensorLog,
    sendCommand,
    mode,
    connected,
    demoSlidingWindowAdd,
  } = useWS();

  const [inputVal, setInputVal] = useState('2.95');

  const { slots, used, avg } = circularBuffer;
  const filledSlots = slots.slice(0, used);
  const min = filledSlots.length > 0 ? Math.min(...filledSlots.map(s => s.voltage)) : 0;
  const max = filledSlots.length > 0 ? Math.max(...filledSlots.map(s => s.voltage)) : 0;
  const movingAvg = avg;

  const addVal = () => {
    const v = parseFloat(inputVal) || 2.92;
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'slidingWindow', action: 'add', voltage: v });
    } else {
      demoSlidingWindowAdd(v);
    }
  };

  const fillWindow = () => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'slidingWindow', action: 'fill' });
    } else {
      const sampleVoltages = [
        +(2.98 + (Math.random() - 0.5) * 0.05).toFixed(2),
        +(3.02 + (Math.random() - 0.5) * 0.05).toFixed(2),
        +(2.38 + Math.random() * 0.08).toFixed(2), // Contaminant optical drop below 2.50V
        +(3.00 + (Math.random() - 0.5) * 0.05).toFixed(2),
        +(3.05 + (Math.random() - 0.5) * 0.05).toFixed(2),
        +(2.99 + (Math.random() - 0.5) * 0.05).toFixed(2),
        +(3.02 + (Math.random() - 0.5) * 0.05).toFixed(2),
        +(2.78 + (Math.random() - 0.5) * 0.05).toFixed(2),
        +(2.98 + (Math.random() - 0.5) * 0.05).toFixed(2),
        +(3.03 + (Math.random() - 0.5) * 0.05).toFixed(2),
      ];
      sampleVoltages.forEach(v => demoSlidingWindowAdd(v));
    }
  };

  const isContaminated = movingAvg < 2.50 && movingAvg > 0;

  // Source all chronological optical readings:
  // Use sensorLog if available, otherwise fall back to circular buffer slots
  const opticalReadings = (sensorLog && sensorLog.length > 0)
    ? sensorLog.filter(r => r.sensorType !== 'TURBIDITY')
    : filledSlots;
  const activeReadings = opticalReadings.length > 0 ? opticalReadings : filledSlots;

  // For real-time display, show the most recent 20 readings for a rolling oscilloscope view
  const displayWindowSize = 20;
  const startIndex = Math.max(0, activeReadings.length - displayWindowSize);
  const visibleReadings = activeReadings.slice(startIndex);

  // Compute raw voltage and the exact 10-slot circular buffer moving average at each point
  const waveformData = visibleReadings.map((reading, idx) => {
    const globalIdx = startIndex + idx;
    // 10-slot sliding window slice ending at this sample
    const windowSlice = activeReadings.slice(Math.max(0, globalIdx - 9), globalIdx + 1);
    const windowAvg = windowSlice.length > 0
      ? windowSlice.reduce((sum, r) => sum + r.voltage, 0) / windowSlice.length
      : reading.voltage;

    const timeLabel = typeof reading.timestamp === 'number' && reading.timestamp > 0
      ? `${reading.timestamp.toFixed(1)}s`
      : `#${globalIdx + 1}`;

    return {
      t: timeLabel,
      raw: +reading.voltage.toFixed(3),
      filtered: +windowAvg.toFixed(3),
    };
  });

  // Dynamic YAxis domain to keep waveform and 2.50V threshold clearly in view
  const allVoltages = waveformData.flatMap(d => [d.raw, d.filtered]);
  const minVoltage = allVoltages.length > 0 ? Math.min(...allVoltages) : 2.2;
  const maxVoltage = allVoltages.length > 0 ? Math.max(...allVoltages) : 3.2;
  const yDomainMin = Math.max(0, +(Math.min(minVoltage, 2.3) - 0.2).toFixed(1));
  const yDomainMax = +(Math.max(maxVoltage, 3.2) + 0.2).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Sliding Window
          </h1>
        </div>
        <span className={`badge ${mode === 'real' ? (connected ? 'badge-green' : 'badge-red') : 'badge-cyan'}`}>
          {mode === 'real' ? (connected ? 'Hardware Connected' : 'Hardware Offline') : 'Demo Mode Active'}
        </span>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Window Capacity</span>
            <Layers size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{used} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ 10</span></div>
          <span className="metric-badge cyan">{used === 10 ? 'Window Full (Overwriting)' : 'Filling Window'}</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Rolling Average</span>
            <Activity size={15} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="metric-val" style={{ color: isContaminated ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
            {movingAvg.toFixed(2)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>V</span>
          </div>
          <span className={`metric-badge ${isContaminated ? 'rose' : 'green'}`}>
            {isContaminated ? 'Contamination Detected' : 'Clean Water Baseline'}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Minimum Level</span>
            <AlertTriangle size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val">{min > 0 ? `${min.toFixed(2)} V` : '--'}</div>
          <span className="metric-badge rose">Deepest Occlusion</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Maximum Level</span>
            <CheckCircle2 size={15} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="metric-val">{max > 0 ? `${max.toFixed(2)} V` : '--'}</div>
          <span className="metric-badge amber">Peak Clean Baseline</span>
        </div>
      </div>

      {/* Window Controls */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Rolling Window Controls</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sample Voltage:</span>
            <input
              className="input"
              style={{ width: 110 }}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. 2.95"
            />
          </div>

          <button className="btn btn-primary" onClick={addVal}>
            <Plus size={14} /> Add Sample
          </button>

          <button className="btn btn-secondary" onClick={() => { setInputVal('2.20'); }}>
            Set Contaminant (2.20V)
          </button>
          <button className="btn btn-secondary" onClick={() => { setInputVal('2.95'); }}>
            Set Clean (2.95V)
          </button>

          <button className="btn btn-secondary" onClick={fillWindow} style={{ marginLeft: 'auto' }}>
            <RefreshCw size={14} /> Fill 10 Samples
          </button>
        </div>
      </div>

      {/* Visual 10-Slot Window Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Rolling Buffer Slots (10 Slots)</div>
          </div>
          <span className="badge badge-cyan">{used}/10 slots active</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginTop: 4 }}>
          {Array.from({ length: 10 }).map((_, idx) => {
            const isFilled = idx < used;
            const slotData = slots[idx];
            const isOccluded = isFilled && slotData?.voltage < 2.50;

            return (
              <div
                key={idx}
                style={{
                  padding: '14px 10px',
                  borderRadius: 'var(--radius)',
                  background: isFilled
                    ? isOccluded
                      ? 'rgba(244, 63, 94, 0.12)'
                      : 'rgba(6, 182, 212, 0.08)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${
                    isFilled
                      ? isOccluded
                        ? 'rgba(244, 63, 94, 0.45)'
                        : 'rgba(6, 182, 212, 0.4)'
                      : 'var(--border-color)'
                  }`,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                  <CircleDot size={10} style={{ color: isFilled ? (isOccluded ? 'var(--accent-rose)' : 'var(--accent-cyan)') : 'var(--text-dim)' }} />
                  <span>Slot #{idx + 1}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: isFilled ? (isOccluded ? 'var(--accent-rose)' : 'var(--text-primary)') : 'var(--text-muted)' }}>
                  {isFilled && slotData ? `${slotData.voltage.toFixed(2)}V` : '--'}
                </div>
                <span className={`badge ${isFilled ? (isOccluded ? 'badge-red' : 'badge-green') : 'badge-yellow'}`} style={{ fontSize: 9 }}>
                  {isFilled ? (isOccluded ? 'DROP' : 'CLEAR') : 'EMPTY'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Signal Smoothing Waveform Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Live Noise Suppression Waveform</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-cyan">{waveformData.length} Active Points</span>
            <span className="badge badge-green">Noise Filter Active</span>
          </div>
        </div>

        {waveformData.length === 0 ? (
          <div style={{
            height: 260,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: 'var(--text-muted)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius)',
            marginTop: 10,
          }}>
            <Activity size={28} style={{ color: 'var(--accent-cyan)', opacity: 0.7 }} />
            <div style={{ fontSize: 13, textAlign: 'center' }}>
              No sensor telemetry recorded yet.<br />
              Add a sample or click below to populate the window and view the live waveform.
            </div>
            <button className="btn btn-secondary" onClick={fillWindow}>
              <RefreshCw size={14} /> Populate 10 Samples
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', height: 260, marginTop: 10 }}>
            <ResponsiveContainer>
              <LineChart data={waveformData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis domain={[yDomainMin, yDomainMax]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} unit="V" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <ReferenceLine y={2.50} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: '2.50V Drop Threshold', fill: '#f43f5e', fontSize: 10 }} />
                <Line type="monotone" dataKey="raw" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3 }} name="Raw Sensor Signal (With Flutter)" isAnimationActive={false} />
                <Line type="monotone" dataKey="filtered" stroke="#2dd4bf" strokeWidth={2.5} dot={{ r: 3 }} name="Sliding Window (Filtered Output)" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
