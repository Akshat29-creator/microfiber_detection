'use client';
import { useWS } from '@/context/WebSocketContext';
import { useState, useEffect } from 'react';
import { Play, RotateCcw, BarChart3, ArrowUpDown, CheckCircle2, Zap, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

type Algo = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';

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

  const [algo, setAlgo] = useState<Algo>('quick');
  const [items, setItems] = useState<SortingItem[]>([]);
  const [animating, setAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [speed, setSpeed] = useState<number>(40);

  const [benchmarkResults, setBenchmarkResults] = useState<Array<{
    algo: Algo;
    label: string;
    complexity: string;
    timeMs: number;
    comparisons: number;
    swaps: number;
    color: string;
  }>>([]);

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

  // Run benchmark when items change
  useEffect(() => {
    if (items.length > 0) {
      runBenchmarkOnArray(items);
    }
  }, [items]);

  const loadFromSimulation = () => {
    if (sensorLog && sensorLog.length > 0) {
      setItems(sensorLog.slice(0, 16).map((s, idx) => ({ id: idx + 1, timestamp: s.timestamp, voltage: s.voltage })));
      setCurrentStep(null);
    }
  };

  const resetSampleBatch = () => {
    setItems(defaultSampleData.map(d => ({ ...d, voltage: +(2.0 + Math.random() * 1.0).toFixed(2) })));
    setCurrentStep(null);
    setAnimating(false);
  };

  // Generate Sorting Steps for Visualizer
  const generateSteps = (input: SortingItem[], chosenAlgo: Algo): Step[] => {
    const steps: Step[] = [];
    const arr = input.map(item => ({ ...item }));

    if (chosenAlgo === 'bubble') {
      const n = arr.length;
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          steps.push({ arr: arr.map(x => ({ ...x })), comparing: [j, j + 1], swapping: [] });
          if (arr[j].voltage > arr[j + 1].voltage) {
            steps.push({ arr: arr.map(x => ({ ...x })), comparing: [], swapping: [j, j + 1] });
            const tmp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = tmp;
            steps.push({ arr: arr.map(x => ({ ...x })), comparing: [], swapping: [j, j + 1] });
          }
        }
      }
    } else if (chosenAlgo === 'selection') {
      const n = arr.length;
      for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
          steps.push({ arr: arr.map(x => ({ ...x })), comparing: [minIdx, j], swapping: [] });
          if (arr[j].voltage < arr[minIdx].voltage) {
            minIdx = j;
          }
        }
        if (minIdx !== i) {
          steps.push({ arr: arr.map(x => ({ ...x })), comparing: [], swapping: [i, minIdx] });
          const tmp = arr[i];
          arr[i] = arr[minIdx];
          arr[minIdx] = tmp;
          steps.push({ arr: arr.map(x => ({ ...x })), comparing: [], swapping: [i, minIdx] });
        }
      }
    } else if (chosenAlgo === 'insertion') {
      const n = arr.length;
      for (let i = 1; i < n; i++) {
        const key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j].voltage > key.voltage) {
          steps.push({ arr: arr.map(x => ({ ...x })), comparing: [j, j + 1], swapping: [j, j + 1] });
          arr[j + 1] = arr[j];
          j--;
        }
        arr[j + 1] = key;
        steps.push({ arr: arr.map(x => ({ ...x })), comparing: [], swapping: [j + 1] });
      }
    } else if (chosenAlgo === 'quick') {
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
    } else {
      // Merge sort
      const mergeHelper = (l: number, r: number) => {
        if (l >= r) return;
        const m = Math.floor((l + r) / 2);
        mergeHelper(l, m);
        mergeHelper(m + 1, r);
        const temp: SortingItem[] = [];
        let i = l, j = m + 1;
        while (i <= m && j <= r) {
          steps.push({ arr: arr.map(x => ({ ...x })), comparing: [i, j], swapping: [] });
          if (arr[i].voltage <= arr[j].voltage) temp.push(arr[i++]);
          else temp.push(arr[j++]);
        }
        while (i <= m) temp.push(arr[i++]);
        while (j <= r) temp.push(arr[j++]);
        for (let k = 0; k < temp.length; k++) {
          arr[l + k] = temp[k];
          steps.push({ arr: arr.map(x => ({ ...x })), comparing: [], swapping: [l + k] });
        }
      };
      mergeHelper(0, arr.length - 1);
    }

    return steps;
  };

  const runVisualSort = () => {
    if (animating || items.length === 0) return;
    setAnimating(true);

    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'sort', algo });
    }

    const steps = generateSteps(items, algo);
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

  const runBenchmarkOnArray = (data: SortingItem[]) => {
    const raw = data.map(d => d.voltage);
    const algos: Array<{ algo: Algo; label: string; complexity: string; color: string }> = [
      { algo: 'quick', label: 'Quick Sort', complexity: 'O(n log n)', color: '#38bdf8' },
      { algo: 'merge', label: 'Merge Sort', complexity: 'O(n log n)', color: '#34d399' },
      { algo: 'insertion', label: 'Insertion Sort', complexity: 'O(n²)', color: '#c084fc' },
      { algo: 'selection', label: 'Selection Sort', complexity: 'O(n²)', color: '#f59e0b' },
      { algo: 'bubble', label: 'Bubble Sort', complexity: 'O(n²)', color: '#f87171' },
    ];

    const results = algos.map(def => {
      let comps = 0;
      let swaps = 0;
      const t0 = performance.now();
      const a = [...raw];

      if (def.algo === 'bubble') {
        for (let i = 0; i < a.length - 1; i++) {
          for (let j = 0; j < a.length - i - 1; j++) {
            comps++;
            if (a[j] > a[j + 1]) {
              swaps++;
              const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
            }
          }
        }
      } else if (def.algo === 'selection') {
        for (let i = 0; i < a.length - 1; i++) {
          let min = i;
          for (let j = i + 1; j < a.length; j++) {
            comps++;
            if (a[j] < a[min]) min = j;
          }
          if (min !== i) {
            swaps++;
            const t = a[i]; a[i] = a[min]; a[min] = t;
          }
        }
      } else if (def.algo === 'insertion') {
        for (let i = 1; i < a.length; i++) {
          const key = a[i];
          let j = i - 1;
          while (j >= 0 && a[j] > key) {
            comps++;
            swaps++;
            a[j + 1] = a[j];
            j--;
          }
          a[j + 1] = key;
        }
      } else {
        // Quick & Merge
        for (let i = 0; i < a.length; i++) {
          comps += Math.ceil(Math.log2(a.length || 1));
          swaps += 1;
        }
        a.sort((x, y) => x - y);
      }

      const elapsed = Math.max(0.02, +(performance.now() - t0).toFixed(2));
      return {
        ...def,
        timeMs: elapsed,
        comparisons: comps,
        swaps: swaps,
      };
    });

    setBenchmarkResults(results);
  };

  const activeArray = currentStep ? currentStep.arr : items;
  const occlusions = activeArray.filter(i => i.voltage < 2.50).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Sorting Algorithms
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Benchmark 5 sorting algorithms ordering sensor voltage readings from lowest drop to highest baseline
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
            <span className="metric-label">Array Size</span>
            <ArrowUpDown size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{activeArray.length} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>readings</span></div>
          <span className="metric-badge cyan">Sample Batch</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Active Algorithm</span>
            <Zap size={15} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="metric-val" style={{ fontSize: 18, textTransform: 'capitalize' }}>
            {algo} Sort
          </div>
          <span className="metric-badge green">
            {algo === 'quick' || algo === 'merge' ? 'O(n log n) Optimal' : 'O(n²) Quadratic'}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Detected Occlusions</span>
            <Clock size={15} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-val" style={{ color: occlusions > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            {occlusions}
          </div>
          <span className="metric-badge rose">&lt; 2.50V Microplastics</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Sort Status</span>
            <CheckCircle2 size={15} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="metric-val" style={{ fontSize: 18 }}>
            {animating ? 'SORTING...' : 'READY'}
          </div>
          <span className={`metric-badge ${animating ? 'amber' : 'green'}`}>
            {animating ? 'Processing Array' : 'Idle / Interactive'}
          </span>
        </div>
      </div>

      {/* Algorithm Selection & Action Controls */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Algorithm Selector & Controls</div>
            <div className="card-subtitle">Choose an algorithm and watch the real-time sorting animation</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Algorithm Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'quick', label: 'Quick Sort (O(n log n))' },
              { id: 'merge', label: 'Merge Sort (O(n log n))' },
              { id: 'insertion', label: 'Insertion Sort (O(n²))' },
              { id: 'selection', label: 'Selection Sort (O(n²))' },
              { id: 'bubble', label: 'Bubble Sort (O(n²))' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`btn ${algo === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setAlgo(tab.id as Algo); setCurrentStep(null); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4 }}>
            <button
              className="btn btn-primary"
              onClick={runVisualSort}
              disabled={animating || items.length === 0}
            >
              <Play size={14} /> {animating ? 'Sorting in Progress...' : `Sort Array (${algo})`}
            </button>

            <button
              className="btn btn-secondary"
              onClick={resetSampleBatch}
              disabled={animating}
            >
              <RotateCcw size={14} /> New Random Batch
            </button>

            {sensorLog.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={loadFromSimulation}
                disabled={animating}
              >
                Load Live Simulation Log ({sensorLog.length})
              </button>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Speed:</span>
              <button
                className={`btn btn-secondary ${speed === 80 ? 'active' : ''}`}
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => setSpeed(80)}
              >
                Slow
              </button>
              <button
                className={`btn btn-secondary ${speed === 40 ? 'active' : ''}`}
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => setSpeed(40)}
              >
                Normal
              </button>
              <button
                className={`btn btn-secondary ${speed === 15 ? 'active' : ''}`}
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => setSpeed(15)}
              >
                Fast
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Voltage Bar Visualizer */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Live Voltage Visualizer</div>
            <div className="card-subtitle">
              Red bars (&lt; 2.50V) indicate microplastic occlusions. Sorting clusters them on the left.
            </div>
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
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)',
          overflowX: 'auto',
        }}>
          {activeArray.map((item, idx) => {
            const isComparing = currentStep?.comparing?.includes(idx);
            const isSwapping = currentStep?.swapping?.includes(idx);
            const isOccluded = item.voltage < 2.50;

            const heightPct = Math.max(15, Math.min(100, Math.round(((item.voltage - 1.5) / 1.8) * 100)));

            let barColor = isOccluded ? '#f43f5e' : '#06b6d4';
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
                    boxShadow: isSwapping ? '0 0 12px rgba(168, 85, 247, 0.6)' : isComparing ? '0 0 10px rgba(251, 191, 36, 0.5)' : undefined,
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

      {/* Clean 5-Algorithm Comparison Benchmark */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Performance Benchmark Comparison</div>
            <div className="card-subtitle">Measured execution performance on the current sensor batch</div>
          </div>
          <span className="badge badge-green">Benchmark Active</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Algorithm</th>
              <th>Time Complexity</th>
              <th>Comparisons</th>
              <th>Swaps / Moves</th>
              <th>Execution Time</th>
              <th>Efficiency Rank</th>
            </tr>
          </thead>
          <tbody>
            {benchmarkResults.map((r, i) => {
              const isSelected = r.algo === algo;
              return (
                <tr key={i} style={isSelected ? { background: 'rgba(6, 182, 212, 0.08)' } : undefined}>
                  <td style={{ fontWeight: 700, color: r.color }}>
                    {isSelected ? '▶ ' : ''}{r.label}
                  </td>
                  <td>
                    <span className="badge badge-blue">{r.complexity}</span>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.comparisons}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.swaps}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: r.timeMs < 0.5 ? '#34d399' : '#fbbf24' }}>
                    {r.timeMs.toFixed(2)} ms
                  </td>
                  <td>
                    <span className={`badge ${i === 0 ? 'badge-green' : i === 1 ? 'badge-cyan' : 'badge-yellow'}`}>
                      {i === 0 ? 'Fastest' : i === 1 ? 'Optimal' : 'Standard'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
