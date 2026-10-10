'use client';
import { useWS } from '@/context/WebSocketContext';
import {
  Bell, Play, Trash2, AlertTriangle, ShieldAlert,
  CheckCircle2, Info, Droplets, Zap, Thermometer
} from 'lucide-react';

export default function AlertsPage() {
  const {
    alerts,
    sendCommand,
    mode,
    connected,
    demoAlertProcessOne,
    demoAlertProcessAll,
    demoAlertAdd,
  } = useWS();

  const displayQueue = alerts;

  const criticalCount = displayQueue.filter((a) => a.priority === 1).length;
  const warningCount = displayQueue.filter((a) => a.priority === 2 || a.priority === 3).length;
  const infoCount = displayQueue.filter((a) => a.priority === 4 || !a.priority).length;

  const processOne = () => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'alertQueue', action: 'processOne' });
    } else {
      demoAlertProcessOne();
    }
  };

  const processAll = () => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'alertQueue', action: 'processAll' });
    } else {
      demoAlertProcessAll();
    }
  };

  const addAlert = (priority: number) => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'alertQueue', action: 'addPriority', priority });
    } else {
      demoAlertAdd(priority);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Alert Queue
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Real-time queue managing system warnings, failsafes, and critical hardware cutoff alerts
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
            <span className="metric-label">Pending Alerts</span>
            <Bell size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{displayQueue.length}</div>
          <span className="metric-badge cyan">In-Queue</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Critical Failsafes</span>
            <ShieldAlert size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val" style={{ color: criticalCount > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            {criticalCount}
          </div>
          <span className="metric-badge rose">High Priority</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Warnings</span>
            <AlertTriangle size={15} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="metric-val">{warningCount}</div>
          <span className="metric-badge amber">Turbidity & Flow</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">System Safeguards</span>
            <CheckCircle2 size={15} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="metric-val" style={{ fontSize: 18, color: 'var(--accent-emerald)' }}>ARMED</div>
          <span className="metric-badge green">All Failsafes Active</span>
        </div>
      </div>

      {/* Alert Controls & Actions */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Queue Actions</div>
            <div className="card-subtitle">Manage pending alerts or simulate test events</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={processOne}
            disabled={displayQueue.length === 0}
          >
            <Play size={14} /> Process Next Alert
          </button>
          <button
            className="btn btn-secondary"
            onClick={processAll}
            disabled={displayQueue.length === 0}
          >
            <Trash2 size={14} /> Clear All Alerts
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => addAlert(1)}
              style={{ color: '#f87171', borderColor: 'rgba(244, 63, 94, 0.3)' }}
            >
              + Test Critical (P1)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => addAlert(3)}
              style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}
            >
              + Test Warning (P3)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => addAlert(4)}
              style={{ color: '#38bdf8', borderColor: 'rgba(6, 182, 212, 0.3)' }}
            >
              + Test Info (P4)
            </button>
          </div>
        </div>
      </div>

      {/* Active Alerts Feed */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Active Alert Queue Feed</div>
            <div className="card-subtitle">Alerts are queued by priority and processed in order</div>
          </div>
          <span className="badge badge-blue">{displayQueue.length} pending</span>
        </div>

        {displayQueue.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 16px' }}>
            Queue is clear. No hardware warnings or failsafe triggers pending.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayQueue.map((a, idx) => {
              const isFront = idx === 0;
              const isCritical = a.priority === 1 || a.type === 'CRITICAL';
              const isWarning = a.priority === 2 || a.priority === 3 || a.type === 'WARNING' || a.type === 'ERROR';

              return (
                <div
                  key={idx}
                  className={`alert-item ${isCritical ? 'critical' : isWarning ? 'warning' : 'info'}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius)',
                    borderLeft: isFront ? '4px solid var(--accent-cyan)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isFront && <span className="badge badge-cyan" style={{ fontSize: 9 }}>NEXT UP</span>}
                      <span className={`badge ${isCritical ? 'badge-red' : isWarning ? 'badge-yellow' : 'badge-blue'}`}>
                        {isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'INFO'}
                      </span>
                      {a.timestamp !== undefined && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {a.timestamp.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {a.message}
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 11, padding: '4px 10px' }}
                    onClick={processOne}
                  >
                    Acknowledge
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean System Protection Rules (Replaces Cluttered Matrix) */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Automated System Protection Rules</div>
            <div className="card-subtitle">Active firmware failsafes protecting physical hardware</div>
          </div>
          <span className="badge badge-green">Protections Active</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ padding: 14, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)' }}>
                <Droplets size={14} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Turbidity Protection</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              If water turbidity drops below 2.50V (muddy water), the 12V peristaltic pump relay is instantly disabled to prevent optical chamber fouling.
            </p>
          </div>

          <div style={{ padding: 14, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-rose)' }}>
                <Zap size={14} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Laser Optical Guard</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Monitors the 650nm beam alignment. Steep voltage drops below 2.50V identify microplastic particles and trigger immediate event logging.
            </p>
          </div>

          <div style={{ padding: 14, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                <Thermometer size={14} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Thermal Cutoff</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Continuous temperature compensation dynamically corrects the photodiode baseline to prevent false positives caused by fluid warming.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
