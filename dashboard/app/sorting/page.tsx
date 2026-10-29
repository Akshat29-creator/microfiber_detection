'use client';
import { useWS } from '@/context/WebSocketContext';
import { useState, useEffect } from 'react';
import { Play, ArrowUpDown, Sparkles } from 'lucide-react';

interface SortingItem {
  id: number;
  timestamp: number;
  voltage: number;
}

interface Step {
  arr: SortingItem[];
  comparing: number[];
  swapping: number[];
}

export default function SortingPage() {
  const { sensorLog, sendCommand, mode, connected } = useWS();

  const [items, setItems] = useState<SortingItem[]>([]);
  const [animating, setAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [speed, setSpeed] = useState<number>(40);

  const defaultSampleData: SortingItem[] = [
    { id: 1, timestamp: 0.5, voltage: 2.95 },
    { id: 2, timestamp: 1.0, voltage: 2.92 },
    { id: 3, timestamp: 1.5, voltage: 2.25 },
    { id: 4, timestamp: 2.0, voltage: 2.88 },
    { id: 5, timestamp: 2.5, voltage: 2.10 },
    { id: 6, timestamp: 3.0, voltage: 2.94 },
    { id: 7, timestamp: 3.5, voltage: 2.70 },
    { id: 8, timestamp: 4.0, voltage: 2.35 },
    { id: 9, timestamp: 4.5, voltage: 2.91 },
    { id: 10, timestamp: 5.0, voltage: 2.85 },
    { id: 11, timestamp: 5.5, voltage: 2.18 },
    { id: 12, timestamp: 6.0, voltage: 2.96 },
  ];

  // Initialize data on mount
  useEffect(() => {
    if (sensorLog && sensorLog.length >= 5) {
      setItems(sensorLog.slice(0, 16).map((s, idx) => ({ id: idx + 1, timestamp: s.timestamp, voltage: s.voltage })));
    } else {
      setItems(defaultSampleData);
    }
  }, [sensorLog]);

  const loadFromSimulation = () => {
    if (sensorLog && sensorLog.length > 0) {
      setItems(sensorLog.slice(0, 16).map((s, idx) => ({ id: idx + 1, timestamp: s.timestamp, voltage: s.voltage })));
      setCurrentStep(null);
    }
  };

  // Generate Quick Sort Steps for Visualizer
  const generateSteps = (input: SortingItem[]): Step[] => {
    const steps: Step[] = [];
    const arr = input.map(item => ({ ...item }));

    const quickSortHelper = (low: number, high: number) => {
      if (low < high) {
        const pivot = arr[high].voltage;
        let i = low - 1;
        for (let j = low; j < high; j++) {
          steps.push({ arr: arr.map(x => ({ ...x })), comparing: [j, high], swapping: [] });
          if (arr[j].voltage < pivot) {
            i++;
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
            steps.push({ arr: arr.map(x => ({ ...x })), comparing: [], swapping: [i, j] });
          }
        }
        const tmp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = tmp;
        steps.push({ arr: arr.map(x => ({ ...x })), comparing: [], swapping: [i + 1, high] });
        const pi = i + 1;
        quickSortHelper(low, pi - 1);
        quickSortHelper(pi + 1, high);
      }
    };

    quickSortHelper(0, arr.length - 1);
    return steps;
  };

  const runVisualSort = () => {
    if (animating || items.length === 0) return;
    setAnimating(true);

    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'sort', algo: 'quick' });
    }

    const steps = generateSteps(items);
    let stepIdx = 0;

    const interval = setInterval(() => {
      if (stepIdx >= steps.length) {
        clearInterval(interval);
        setAnimating(false);
        const sorted = [...items].sort((a, b) => a.voltage - b.voltage);
        setItems(sorted);
        setCurrentStep(null);
      } else {
        setCurrentStep(steps[stepIdx]);
        stepIdx++;
      }
    }, speed);
  };

  const activeArray = currentStep ? currentStep.arr : items;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Quick Sort
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`badge ${mode === 'real' ? (connected ? 'badge-green' : 'badge-red') : 'badge-cyan'}`}>
            {mode === 'real' ? (connected ? 'Hardware Connected' : 'Hardware Offline') : 'Demo Mode Active'}
          </span>
        </div>
      </div>

      {/* Metric Card (Array Size) */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 320px))' }}>
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Array Size</span>
            <ArrowUpDown size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{activeArray.length} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>readings</span></div>
          <span className="metric-badge cyan">Sample Batch</span>
        </div>
      </div>

      {/* Algorithm Control Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Quick Sort Execution &amp; Controls</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Action Row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={runVisualSort}
              disabled={animating || items.length === 0}
            >
              <Play size={14} /> {animating ? 'Quick Sorting in Progress...' : 'Run Quick Sort'}
            </button>

            {sensorLog.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={loadFromSimulation}
                disabled={animating}
              >
                Load Live Sensor Log ({sensorLog.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Voltage Bar Visualizer */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Live Quick Sort Visualizer</div>
          </div>
          <span className="badge badge-cyan">{activeArray.length} items</span>
        </div>

        {/* Visual Bars Container */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          height: 220,
          padding: '24px 16px 16px 16px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)',
          overflowX: 'auto',
        }}>
          {activeArray.map((item, idx) => {
            const isComparing = currentStep?.comparing?.includes(idx);
            const isSwapping = currentStep?.swapping?.includes(idx);
            const isOccluded = item.voltage < 2.50;

            const heightPct = Math.max(15, Math.min(100, Math.round(((item.voltage - 1.5) / 1.8) * 100)));

            let barColor = isOccluded ? '#f43f5e' : '#2dd4bf';
            if (isComparing) barColor = '#fbbf24';
            if (isSwapping) barColor = '#a855f7';

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  minWidth: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: barColor, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                  {item.voltage.toFixed(2)}V
                </div>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    background: barColor,
                    borderRadius: '4px 4px 0 0',
                    boxShadow: isSwapping ? '0 0 12px rgba(168, 85, 247, 0.6)' : isComparing ? '0 0 10px rgba(251, 191, 36, 0.5)' : '0 0 8px rgba(45, 212, 191, 0.2)',
                    transition: 'height 0.15s ease, background 0.1s ease',
                  }}
                />
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                  #{idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
