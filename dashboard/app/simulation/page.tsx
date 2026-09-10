'use client';
import { useWS } from '@/context/WebSocketContext';
import { motion } from 'framer-motion';
import {
  Play, Loader2, RotateCcw, Zap, Droplets, CheckCircle2,
  AlertTriangle, ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function SimulationPage() {
  const {
    sendCommand,
    simulationProgress,
    mode,
    connected,
    simResults,
    runDemoSimulation,
    resetDemoSimulation,
  } = useWS();

  const [samples, setSamples] = useState(15);
  const [isStarting, setIsStarting] = useState(false);

  const runSimulation = async () => {
    if (running) return;
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'simulate', samples });
    } else if (mode === 'demo') {
      setIsStarting(true);
      try {
        await runDemoSimulation(samples);
      } finally {
        setIsStarting(false);
      }
    }
  };

  const running = isStarting || simulationProgress.running;
  const progress = simulationProgress.total > 0
    ? Math.min(100, Math.round((simulationProgress.current / simulationProgress.total) * 100))
    : (simulationProgress.phase === 'DONE' ? 100 : 0);

  const detCount = simResults.filter(r => r.type === 'detection').length;
  const rejCount = simResults.filter(r => r.type === 'rejected').length;
  const clearCount = simResults.filter(r => r.type === 'clear').length;

  const phases = [
    { id: 'BOOT', label: '1. Boot' },
    { id: 'CALIBRATION', label: '2. Calibrate' },
    { id: 'PUMP', label: '3. Pump Inflow' },
    { id: 'TURBIDITY', label: '4. Turbidity Check' },
    { id: 'LASER', label: '5. Laser Occlusion' },
    { id: 'DONE', label: '6. Indexed' },
  ];

  const currentPhaseIndex = phases.findIndex(p => p.id === simulationProgress.phase);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Detection Pipeline Simulation
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Simulates the physical fluid flow cycle: Pump Relay On → Turbidity Failsafe → 650nm Laser Occlusion → In-Memory DSA Indexing
        </p>
      </div>

      {/* Phase Stepper */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {phases.map((p, idx) => {
            const isActive = simulationProgress.phase === p.id;
            const isCompleted = currentPhaseIndex > idx || simulationProgress.phase === 'DONE';

            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    background: isActive
                      ? 'rgba(6, 182, 212, 0.2)'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isActive
                      ? '1px solid var(--accent-cyan)'
                      : isCompleted
                      ? '1px solid var(--accent-emerald)'
                      : '1px solid var(--border-color)',
                    color: isActive
                      ? 'var(--accent-cyan)'
                      : isCompleted
                      ? 'var(--accent-emerald)'
                      : 'var(--text-muted)',
                  }}
                >
                  {isCompleted ? '✓' : idx + 1}
                </span>
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent-cyan)' : isCompleted ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {p.label}
                </span>
                {idx < phases.length - 1 && (
                  <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="dashboard-columns">
        {/* Controls Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Simulation Parameters</div>
              <div className="card-subtitle">Set sample volume and trigger the detection loop</div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Water Test Samples:</label>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>{samples} samples</strong>
            </div>
            <input
              type="range"
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              min={5}
              max={30}
              value={samples}
              onChange={e => setSamples(+e.target.value)}
              disabled={running}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>5 samples</span>
              <span>15 samples (recommended)</span>
              <span>30 samples</span>
            </div>
          </div>

          {mode === 'real' && !connected && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                marginBottom: 16,
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f87171',
                fontSize: 12,
              }}
            >
              Hardware not connected. Connect your ESP32 in the sidebar first.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
              onClick={runSimulation}
              disabled={running || (mode === 'real' && !connected)}
            >
              {running ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Processing ({simulationProgress.current}/{simulationProgress.total})...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Start Simulation</span>
                </>
              )}
            </button>

            {mode === 'demo' && !running && simResults.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={resetDemoSimulation}
                title="Reset simulation data"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {running && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>Phase: <strong>{simulationProgress.phase}</strong></span>
                <span>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-cyan)', transition: 'width 0.2s' }} />
              </div>
            </div>
          )}

          {/* Summary Breakdown */}
          {!running && simResults.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="card-title" style={{ fontSize: 13, marginBottom: 10 }}>Results Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ padding: 10, background: 'rgba(244, 63, 94, 0.08)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-rose)' }}>{detCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Microplastics</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-emerald)' }}>{clearCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clear Water</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(245, 158, 11, 0.08)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-amber)' }}>{rejCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Muddy Failsafes</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Link href="/events" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                  <span>View Events (DLL)</span>
                  <ArrowRight size={13} />
                </Link>
                <Link href="/bst" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                  <span>Search BST</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Live Output Feed */}
        <div className="card" style={{ maxHeight: 520, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Live Sensor Output</div>
              <div className="card-subtitle">Real-time readings and detection alerts</div>
            </div>
            <span className="badge badge-blue">{simResults.length} readings</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {simResults.length === 0 && !running && (
              <div className="empty-state" style={{ padding: '60px 16px' }}>
                Run a simulation to observe real-time sensor processing.
              </div>
            )}

            {simResults.map((r, i) => (
              <div
                key={i}
                className={`alert-item ${r.type === 'detection' ? 'critical' : r.type === 'rejected' ? 'warning' : 'info'}`}
                style={{ fontSize: 12, padding: '8px 10px' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                      [{r.ts?.toFixed(1)}s] Sample #{i + 1}
                    </span>
                    {r.type === 'detection' && <span className="badge badge-red">{r.severity}</span>}
                    {r.type === 'rejected' && <span className="badge badge-yellow">MUDDY</span>}
                    {r.type === 'clear' && <span className="badge badge-green">CLEAR</span>}
                  </div>
                  <div>
                    {r.type === 'detection' && (
                      <span>Microplastic detected: voltage drop <strong style={{ color: 'var(--accent-rose)' }}>-{r.drop?.toFixed(2)}V</strong> (Confidence: {r.confidence?.toFixed(0)}%)</span>
                    )}
                    {r.type === 'rejected' && (
                      <span>Turbidity threshold breach ({r.voltage?.toFixed(2)}V &lt; 2.50V). Pump stopped.</span>
                    )}
                    {r.type === 'clear' && (
                      <span>Clear water. Photodiode voltage: {r.voltage?.toFixed(2)}V (No occlusion).</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Physics & Embedded DSA Pipeline Reference (Fills Void & Explains Science) */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Microplastic Detection Physics & Data Structure Architecture</div>
            <div className="card-subtitle">Underlying physical optical laws and corresponding firmware algorithmic operations</div>
          </div>
          <span className="badge badge-cyan">Cyber-Physical Spec</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* Card 1: Beer-Lambert Law */}
          <div style={{ padding: 14, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                <Zap size={14} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Beer-Lambert Optical Scattering</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Laser transmissivity follows I = I₀ · e^(-μx). When a microplastic particle (10μm–500μm) traverses the 650nm beam, light is scattered away from the BPW34 photodiode, triggering a steep voltage drop (&lt; 2.50V).
            </p>
            <div style={{ marginTop: 10, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-cyan)' }}>
              Threshold: V &lt; 2.500V = Microplastic Occlusion
            </div>
          </div>

          {/* Card 2: Turbidity Protection */}
          <div style={{ padding: 14, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)' }}>
                <Droplets size={14} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Turbidity Muddy Water Cutoff</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Heavy sediment or silt blocks laser transmissivity completely, generating false positives. If the turbidity sensor reads &lt; 2.50V, the peristaltic pump relay is immediately halted to preserve optics.
            </p>
            <div style={{ marginTop: 10, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-amber)' }}>
              Failsafe: Turbidity &lt; 2.50V = Pump Cutoff
            </div>
          </div>

          {/* Card 3: Embedded DSA Pipeline */}
          <div style={{ padding: 14, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                <CheckCircle2 size={14} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Dual-Core DSA Memory Ingestion</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Every valid reading is appended to the Singly Linked List (O(1)) and smoothed across the 10-slot Circular Linked List (O(1)). Confirmed detections are indexed into both the Doubly Linked List and Binary Search Tree (O(log n)).
            </p>
            <div style={{ marginTop: 10, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-emerald)' }}>
              Routing: SLL → CLL → DLL (Events) → BST (Search)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
