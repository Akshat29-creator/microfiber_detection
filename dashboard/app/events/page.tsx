'use client';
import { useWS } from '@/context/WebSocketContext';
import { ArrowLeft, ArrowRight, Trash2, Zap, ArrowLeftRight, Plus } from 'lucide-react';
import { useState } from 'react';

export default function EventsPage() {
  const { detections, sendCommand, connected, mode, demoEventDeleteById, demoBSTInsert } = useWS();
  const [localEvents, setLocalEvents] = useState<{ id: number; ts: number; drop: number; baseline: number; severity: string; confidence: number }[]>([]);
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward');

  const [activeCursorIdx, setActiveCursorIdx] = useState<number | null>(null);

  const displayEvents = (mode === 'demo' && detections.length > 0) || connected
    ? detections.map((d) => ({
        id: d.id,
        ts: d.timestamp,
        drop: d.voltageDrop,
        baseline: d.baseline,
        severity: d.severity,
        confidence: typeof d.confidence === 'number' ? d.confidence : 50,
      }))
    : localEvents;

  const ordered = direction === 'reverse' ? [...displayEvents].reverse() : displayEvents;

  const stepNext = () => {
    if (ordered.length === 0) return;
    setActiveCursorIdx((prev) => (prev === null || prev >= ordered.length - 1 ? 0 : prev + 1));
  };

  const stepPrev = () => {
    if (ordered.length === 0) return;
    setActiveCursorIdx((prev) => (prev === null || prev <= 0 ? ordered.length - 1 : prev - 1));
  };

  const addEvent = () => {
    const ts = displayEvents.length * 0.8 + 0.5;
    const drop = +(0.2 + Math.random() * 0.6).toFixed(2);
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'events', action: 'add', ts, drop });
    } else if (mode === 'demo') {
      demoBSTInsert(ts, drop);
    } else {
      const baseline = 3.0;
      const dropPct = (drop / baseline) * 100;
      const severity = dropPct > 20 ? 'HIGH' : dropPct > 10 ? 'MEDIUM' : 'LOW';
      const confidence = Math.round((drop / baseline) * 70 + 30);
      setLocalEvents((prev) => [...prev, { id: prev.length + 1, ts, drop, baseline, severity, confidence }]);
    }
  };

  const deleteById = (id: number) => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'events', action: 'deleteById', id });
    } else if (mode === 'demo') {
      demoEventDeleteById(id);
    } else {
      setLocalEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const fillDemo = () => {
    if (mode === 'demo') {
      for (let i = 0; i < 6; i++) {
        const drop = +(0.15 + Math.random() * 0.65).toFixed(2);
        demoBSTInsert(i * 0.8 + 0.4, drop);
      }
    } else {
      const demo = Array.from({ length: 6 }, (_, i) => {
        const drop = +(0.15 + Math.random() * 0.65).toFixed(2);
        const baseline = 3.0;
        const dropPct = (drop / baseline) * 100;
        return {
          id: i + 1,
          ts: +(i * 0.8 + 0.4).toFixed(1),
          drop,
          baseline,
          severity: dropPct > 20 ? 'HIGH' : dropPct > 10 ? 'MEDIUM' : 'LOW',
          confidence: Math.round((drop / baseline) * 70 + 30),
        };
      });
      setLocalEvents(demo);
    }
  };

  const highCount = displayEvents.filter((e) => e.severity === 'HIGH').length;
  const medCount = displayEvents.filter((e) => e.severity === 'MEDIUM').length;
  const avgDrop = displayEvents.length > 0 ? (displayEvents.reduce((s, e) => s + e.drop, 0) / displayEvents.length).toFixed(2) : '0.00';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Event History (Doubly Linked List)
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Bi-directional pointer traversal of microplastic detection events with previous and next references
        </p>
      </div>

      {/* Operations Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">List Operations & Traversal</div>
            <div className="card-subtitle">Traverse forwards/backwards or delete specific event nodes</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={addEvent}>
            <Plus size={14} /> Add Detection Node
          </button>
          <button
            className={`btn ${direction === 'forward' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDirection('forward')}
          >
            <ArrowRight size={14} /> Forward Traversal
          </button>
          <button
            className={`btn ${direction === 'reverse' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDirection('reverse')}
          >
            <ArrowLeft size={14} /> Reverse Traversal
          </button>
          <div style={{ height: 24, width: 1, background: 'var(--border-color)', margin: '0 4px' }} />
          <button className="btn btn-secondary" onClick={stepPrev} disabled={ordered.length === 0}>
            <ArrowLeft size={13} /> Prev Node
          </button>
          <button className="btn btn-secondary" onClick={stepNext} disabled={ordered.length === 0}>
            <ArrowRight size={13} /> Next Node
          </button>
          {mode === 'demo' && (
            <button className="btn btn-secondary" onClick={fillDemo} style={{ marginLeft: 'auto' }}>
              Populate Sample Events
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Total Events</span>
            <Zap size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{displayEvents.length}</div>
          <span className="metric-badge cyan">DLL Node Count</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">High Severity</span>
            <Zap size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val">{highCount}</div>
          <span className="metric-badge rose">&gt; 20% Occlusion</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Medium Severity</span>
            <Zap size={15} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="metric-val">{medCount}</div>
          <span className="metric-badge amber">10% - 20% Occlusion</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Average Voltage Drop</span>
            <ArrowLeftRight size={15} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="metric-val">-{avgDrop} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>V</span></div>
          <span className="metric-badge cyan">Attenuation</span>
        </div>
      </div>

      {/* Visual Doubly Linked List */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Bi-Directional Pointer Visualization</div>
            <div className="card-subtitle">
              {direction === 'forward' ? 'Traversing Forward (HEAD → TAIL)' : 'Traversing Reverse (TAIL → HEAD)'}
            </div>
          </div>
          <span className="badge badge-blue">{ordered.length} events ({direction})</span>
        </div>

        {ordered.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 16px' }}>
            No events in list. Run a simulation or click <strong>Populate Sample Events</strong> to observe bi-directional nodes.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', padding: '12px 4px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)' }}>
              NULL
            </span>
            <span style={{ color: 'var(--text-muted)' }}>⇄</span>

            {ordered.map((e, i) => {
              const isCursorActive = activeCursorIdx === i;
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius)',
                      background: isCursorActive
                        ? 'rgba(6, 182, 212, 0.15)'
                        : e.severity === 'HIGH'
                        ? 'rgba(244, 63, 94, 0.1)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isCursorActive
                        ? '2px solid var(--accent-cyan)'
                        : `1px solid ${e.severity === 'HIGH' ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-color)'}`,
                      minWidth: 120,
                      boxShadow: isCursorActive ? '0 0 12px rgba(6, 182, 212, 0.4)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: isCursorActive ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: isCursorActive ? 700 : 400 }}>
                        {isCursorActive ? '▶ CURSOR' : `Event #${e.id}`}
                      </span>
                      <span className={`badge ${e.severity === 'HIGH' ? 'badge-red' : e.severity === 'MEDIUM' ? 'badge-yellow' : 'badge-blue'}`}>
                        {e.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-rose)' }}>
                      -{Number(e.drop).toFixed(2)}V
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      ts: {Number(e.ts).toFixed(1)}s • {Number(e.confidence).toFixed(1)}% conf
                    </div>
                  </div>

                  <span style={{ color: 'var(--text-muted)' }}>⇄</span>
                </div>
              );
            })}

            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)' }}>
              NULL
            </span>
          </div>
        )}
      </div>

      {/* Events Table */}
      {ordered.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Detection Event Records</div>
              <div className="card-subtitle">Stored in-memory with bi-directional pointer references</div>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Voltage Drop (-ΔV)</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Pointer References</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((e, idx) => (
                <tr key={e.id} style={{ background: activeCursorIdx === idx ? 'rgba(6, 182, 212, 0.06)' : undefined }}>
                  <td style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    {activeCursorIdx === idx ? '▶ ' : ''}#{e.id}
                  </td>
                  <td>{Number(e.ts).toFixed(2)} s</td>
                  <td style={{ color: 'var(--accent-rose)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    -{Number(e.drop).toFixed(3)} V
                  </td>
                  <td>
                    <span className={`badge ${e.severity === 'HIGH' ? 'badge-red' : e.severity === 'MEDIUM' ? 'badge-yellow' : 'badge-blue'}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{Number(e.confidence).toFixed(1)}%</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    prev: {idx === 0 ? 'NULL' : `#${ordered[idx - 1].id}`} • next: {idx === ordered.length - 1 ? 'NULL' : `#${ordered[idx + 1].id}`}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                      onClick={() => deleteById(e.id)}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* C++ Doubly Linked List Architecture & Complexity Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Doubly Linked List Microcontroller Architecture</div>
            <div className="card-subtitle">Bi-directional traversal algorithms and node deletion mechanics in embedded C++</div>
          </div>
          <span className="badge badge-purple">Two-Way Linkage</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>C++ EVENT STRUCT</div>
            <pre style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)', lineHeight: 1.4 }}>
{`struct MicroplasticEvent {
  int eventID;
  double timestamp;
  double voltageDrop;
  MicroplasticEvent* prev; // 4 bytes
  MicroplasticEvent* next; // 4 bytes
};`}
            </pre>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 6 }}>COMPLEXITY METRICS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Forward Scan:</span>
                <strong style={{ display: 'block', color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>O(n) Linear</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Reverse Scan:</span>
                <strong style={{ display: 'block', color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>O(n) Linear</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Node Deletion:</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(1) with pointer</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Pointer Overhead:</span>
                <strong style={{ display: 'block', color: 'var(--accent-purple)', fontFamily: "'JetBrains Mono', monospace" }}>8 bytes / node</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 6 }}>BI-DIRECTIONAL USE CASE</div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The Doubly Linked List enables immediate backtrack auditing: when an anomaly is verified, the operator can scrub backward from the latest event to the preceding baseline without re-traversing from HEAD.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
