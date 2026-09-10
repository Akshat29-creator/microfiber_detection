'use client';
import { useWS } from '@/context/WebSocketContext';
import { Plus, Trash2, ArrowRight, List, Activity, Droplets } from 'lucide-react';
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

  const addBeginning = () => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'sensorLog', action: 'addBeginning', ts: 0, voltage: 2.95 });
    } else {
      demoSensorLogInsertHead();
    }
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
      { ts: 1.5, v: 2.65 },
      { ts: 2.0, v: 2.88 },
      { ts: 2.5, v: 2.15 },
      { ts: 3.0, v: 2.94 },
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
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Sensor Log (Singly Linked List)
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Dynamic in-memory logging of optical sensor readings with pointer traversal and O(1) tail append
        </p>
      </div>

      {/* Operations Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">List Operations</div>
            <div className="card-subtitle">Perform pointer insertions and deletions</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              className="input"
              style={{ width: 110 }}
              value={newTs}
              onChange={(e) => setNewTs(e.target.value)}
              placeholder="Timestamp (s)"
            />
            <input
              className="input"
              style={{ width: 110 }}
              value={newV}
              onChange={(e) => setNewV(e.target.value)}
              placeholder="Voltage (V)"
            />
          </div>

          <button className="btn btn-primary" onClick={addEnd}>
            <Plus size={14} /> Append (Tail)
          </button>
          <button className="btn btn-secondary" onClick={addBeginning}>
            <Plus size={14} /> Insert (Head)
          </button>
          <button className="btn btn-danger" onClick={deleteFirst}>
            <Trash2 size={14} /> Delete First
          </button>
          <button className="btn btn-danger" onClick={deleteLast}>
            <Trash2 size={14} /> Delete Last
          </button>
          {mode === 'demo' && (
            <button className="btn btn-secondary" onClick={fillDemo} style={{ marginLeft: 'auto' }}>
              Populate Sample Nodes
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Total Nodes</span>
            <List size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{displayNodes.length}</div>
          <span className="metric-badge cyan">In-Memory Allocated</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Valid Readings</span>
            <Activity size={15} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="metric-val">{displayNodes.filter((n) => n.valid).length}</div>
          <span className="metric-badge green">Nominal Signal</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Photodiode Readings</span>
            <Activity size={15} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="metric-val">{displayNodes.filter((n) => n.type === 'PHOTODIODE').length}</div>
          <span className="metric-badge cyan">BPW34 Optical</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Turbidity Readings</span>
            <Droplets size={15} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="metric-val">{displayNodes.filter((n) => n.type === 'TURBIDITY').length}</div>
          <span className="metric-badge amber">Water Clarity</span>
        </div>
      </div>

      {/* Visual Linked List Chain */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Pointer Chain Visualization</div>
            <div className="card-subtitle">HEAD → Node → Node → ... → TAIL → NULL</div>
          </div>
          <span className="badge badge-blue">{displayNodes.length} nodes</span>
        </div>

        {displayNodes.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 16px' }}>
            List is empty. Click <strong>Populate Sample Nodes</strong> or <strong>Append (Tail)</strong> to add linked list nodes.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', padding: '12px 4px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', padding: '6px 10px', background: 'rgba(6,182,212,0.1)', borderRadius: 'var(--radius)' }}>
              HEAD
            </span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />

            {displayNodes.map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    background: node.v < 2.50 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${node.v < 2.50 ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-color)'}`,
                    textAlign: 'center',
                    minWidth: 100,
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{node.ts.toFixed(1)}s</div>
                  <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: node.v < 2.50 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                    {node.v.toFixed(2)}V
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{node.type}</div>
                </div>

                {i < displayNodes.length - 1 ? (
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', padding: '6px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius)' }}>
                      TAIL → NULL
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabular Node Data */}
      {displayNodes.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Node Records Table</div>
              <div className="card-subtitle">In-memory node values and validity flags</div>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Timestamp (s)</th>
                <th>Sensor Type</th>
                <th>Voltage (V)</th>
                <th>Validity Status</th>
                <th>Pointer Relation</th>
              </tr>
            </thead>
            <tbody>
              {displayNodes.map((n, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{i + 1}</td>
                  <td>{n.ts.toFixed(2)} s</td>
                  <td>{n.type}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: n.v < 2.50 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                    {n.v.toFixed(3)} V
                  </td>
                  <td>
                    <span className={`badge ${n.valid ? 'badge-green' : 'badge-red'}`}>
                      {n.valid ? 'VALID' : 'INVALID'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {i === 0 ? 'Head Node' : i === displayNodes.length - 1 ? 'Tail Node (next=NULL)' : `next → Node #${i + 2}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* In-Memory C++ Architecture & Pointer Inspector */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Embedded C++ Memory Footprint & Pointer Arithmetic</div>
            <div className="card-subtitle">Singly Linked List dynamic heap allocation in ESP32 Xtensa architecture</div>
          </div>
          <span className="badge badge-purple">sizeof(SensorNode) = 32 B</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>C++ STRUCT DEFINITION</div>
            <pre style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)', lineHeight: 1.4 }}>
{`struct SensorNode {
  double timestamp;   // 8 bytes
  double voltage;     // 8 bytes
  uint8_t type;       // 1 byte
  bool valid;         // 1 byte
  SensorNode* next;   // 4 bytes (Xtensa)
}; // Total: ~24-32 bytes with padding`}
            </pre>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 6 }}>TIME & SPACE COMPLEXITY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Append (Tail):</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) Constant</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Insert (Head):</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) Constant</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Delete First:</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) Constant</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Memory Overhead:</span>
                <strong style={{ display: 'block', color: 'var(--accent-purple)', fontFamily: "'JetBrains Mono', monospace" }}>4B pointer/node</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 6 }}>FIRMWARE EMBEDDED ADVANTAGE</div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Unlike fixed static arrays, the Singly Linked List allows the ESP32 to dynamically append telemetry packets into free SRAM heap without allocating large contiguous memory buffers that trigger heap fragmentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
