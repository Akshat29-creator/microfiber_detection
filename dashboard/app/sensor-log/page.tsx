'use client';
import { useWS } from '@/context/WebSocketContext';
import { Plus, Trash2, List, Activity, Droplets, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function SensorLogPage() {
  const {
    sensorLog,
    sendCommand,
    mode,
    connected,
    demoSensorLogAppend,
    demoSensorLogInsertHead,
    demoSensorLogDeleteFirst,
    demoSensorLogDeleteLast,
  } = useWS();

  const [newTs, setNewTs] = useState('');
  const [newV, setNewV] = useState('');

  const displayNodes = sensorLog.map((s, idx) => ({
    id: idx + 1,
    ts: s.timestamp,
    v: s.voltage,
    type: s.sensorType,
    valid: s.valid,
  }));

  const cleanCount = displayNodes.filter((n) => n.v >= 2.70).length;
  const occludedCount = displayNodes.filter((n) => n.v < 2.50).length;
  const avgVoltage = displayNodes.length > 0
    ? (displayNodes.reduce((acc, n) => acc + n.v, 0) / displayNodes.length).toFixed(2)
    : '0.00';

  const addEnd = () => {
    const ts = parseFloat(newTs) || (displayNodes.length * 0.5);
    const v = parseFloat(newV) || +(2.8 + Math.random() * 0.4).toFixed(3);
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'sensorLog', action: 'add', ts, voltage: v });
    } else {
      demoSensorLogAppend(ts, v);
    }
    setNewTs('');
    setNewV('');
  };

  const deleteFirst = () => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'sensorLog', action: 'deleteFirst' });
    } else {
      demoSensorLogDeleteFirst();
    }
  };

  const deleteLast = () => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'sensorLog', action: 'deleteLast' });
    } else {
      demoSensorLogDeleteLast();
    }
  };

  const fillDemo = () => {
    [
      { ts: 0.5, v: 2.95 },
      { ts: 1.0, v: 2.92 },
      { ts: 1.5, v: 2.45 },
      { ts: 2.0, v: 2.88 },
      { ts: 2.5, v: 2.15 },
      { ts: 3.0, v: 2.94 },
      { ts: 3.5, v: 2.90 },
      { ts: 4.0, v: 2.30 },
    ].forEach((item) => {
      if (mode === 'real' && connected) {
        sendCommand({ cmd: 'sensorLog', action: 'add', ts: item.ts, voltage: item.v });
      } else {
        demoSensorLogAppend(item.ts, item.v);
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Sensor Log
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Continuous timeline of optical photodiode and water turbidity sensor readings
          </p>
        </div>
        <span className={`badge ${mode === 'real' ? (connected ? 'badge-green' : 'badge-red') : 'badge-cyan'}`}>
          {mode === 'real' ? (connected ? 'Hardware Connected' : 'Hardware Offline') : 'Demo Mode Active'}
        </span>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Total Readings</span>
            <List size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{displayNodes.length}</div>
          <span className="metric-badge cyan">Recorded Samples</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Clean Baseline</span>
            <CheckCircle2 size={15} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="metric-val">{cleanCount}</div>
          <span className="metric-badge green">Nominal Water Flow</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Contaminant Drops</span>
            <AlertTriangle size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val">{occludedCount}</div>
          <span className="metric-badge rose">&lt; 2.50V Occlusions</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Average Voltage</span>
            <Activity size={15} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="metric-val">{avgVoltage} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>V</span></div>
          <span className="metric-badge amber">Mean Optical Level</span>
        </div>
      </div>

      {/* Clean Quick Actions Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Log Controls</div>
            <div className="card-subtitle">Add new sensor readings or manage logged data</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            style={{ width: 130 }}
            value={newTs}
            onChange={(e) => setNewTs(e.target.value)}
            placeholder="Timestamp (s)"
          />
          <input
            className="input"
            style={{ width: 130 }}
            value={newV}
            onChange={(e) => setNewV(e.target.value)}
            placeholder="Voltage (V)"
          />

          <button className="btn btn-primary" onClick={addEnd}>
            <Plus size={14} /> Add Reading
          </button>
          <button className="btn btn-secondary" onClick={deleteFirst} disabled={displayNodes.length === 0}>
            <Trash2 size={14} /> Delete Oldest
          </button>
          <button className="btn btn-secondary" onClick={deleteLast} disabled={displayNodes.length === 0}>
            <Trash2 size={14} /> Delete Newest
          </button>

          {mode === 'demo' && (
            <button className="btn btn-secondary" onClick={fillDemo} style={{ marginLeft: 'auto' }}>
              <RefreshCw size={14} /> Load Sample Readings
            </button>
          )}
        </div>
      </div>

      {/* Visual Timeline of Sensor Readings */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Readings Flow</div>
            <div className="card-subtitle">Visual timeline of recorded voltage levels</div>
          </div>
          <span className="badge badge-blue">{displayNodes.length} items</span>
        </div>

        {displayNodes.length === 0 ? (
          <div className="empty-state" style={{ padding: '36px 16px' }}>
            No readings recorded yet. Click <strong>Load Sample Readings</strong> or <strong>Add Reading</strong> to start.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto', padding: '8px 2px' }}>
            {displayNodes.map((node, i) => {
              const isDrop = node.v < 2.50;
              return (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    background: isDrop ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isDrop ? 'rgba(244, 63, 94, 0.45)' : 'var(--border-color)'}`,
                    textAlign: 'center',
                    minWidth: 105,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{node.ts.toFixed(1)}s</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: isDrop ? 'var(--accent-rose)' : 'var(--accent-cyan)', margin: '3px 0' }}>
                    {node.v.toFixed(2)}V
                  </div>
                  <span className={`badge ${isDrop ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 9 }}>
                    {isDrop ? 'CONTAMINANT' : 'CLEAN'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean Tabular Data */}
      {displayNodes.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Reading Records</div>
              <div className="card-subtitle">Detailed table of recorded voltage levels</div>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Sample #</th>
                <th>Time (s)</th>
                <th>Sensor Type</th>
                <th>Measured Voltage</th>
                <th>Condition</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayNodes.map((n, i) => {
                const isDrop = n.v < 2.50;
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>#{i + 1}</td>
                    <td>{n.ts.toFixed(2)} s</td>
                    <td>{n.type}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isDrop ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                      {n.v.toFixed(3)} V
                    </td>
                    <td>
                      <span className={`badge ${isDrop ? 'badge-red' : 'badge-green'}`}>
                        {isDrop ? 'Contaminant Detected' : 'Clean Water Flow'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {n.valid ? 'Active' : 'Filtered'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
