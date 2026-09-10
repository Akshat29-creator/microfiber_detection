'use client';
import { useWS } from '@/context/WebSocketContext';
import { motion } from 'framer-motion';
import { Play, BarChart3, Database, RotateCcw, Clock, Layers, Zap, Flame, AlertCircle, CheckCircle2, Waves, Sliders } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Algo = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';
type DatasetDist = 'given' | 'reverse' | 'sorted' | 'nearly';
type BenchScope = 'current' | 'all-log' | 'scale-100' | 'scale-500' | 'scale-1000';

interface SensorItem {
  voltage: number;
  ts: number;
  isBreach: boolean;
}

// ============================================================
// Visual Step Generators (For animated photodiode voltage array)
// ============================================================
function bubbleSortSteps(arr: SensorItem[]) {
  const a = [...arr];
  const steps = [a.slice()];
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j].voltage > a[j + 1].voltage) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push(a.slice());
      }
    }
  }
  return steps;
}

function selectionSortSteps(arr: SensorItem[]) {
  const a = [...arr];
  const steps = [a.slice()];
  for (let i = 0; i < a.length - 1; i++) {
    let m = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j].voltage < a[m].voltage) m = j;
    }
    if (m !== i) {
      [a[i], a[m]] = [a[m], a[i]];
      steps.push(a.slice());
    }
  }
  return steps;
}

function insertionSortSteps(arr: SensorItem[]) {
  const a = [...arr];
  const steps = [a.slice()];
  for (let i = 1; i < a.length; i++) {
    const k = a[i];
    let j = i - 1;
    while (j >= 0 && a[j].voltage > k.voltage) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = k;
    steps.push(a.slice());
  }
  return steps;
}

function mergeSortSteps(arr: SensorItem[]) {
  const a = [...arr];
  const steps = [a.slice()];
  function ms(a: SensorItem[], l: number, r: number) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    ms(a, l, m);
    ms(a, m + 1, r);
    const L = a.slice(l, m + 1);
    const R = a.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < L.length && j < R.length) a[k++] = L[i].voltage <= R[j].voltage ? L[i++] : R[j++];
    while (i < L.length) a[k++] = L[i++];
    while (j < R.length) a[k++] = R[j++];
    steps.push(a.slice());
  }
  ms(a, 0, a.length - 1);
  return steps;
}

function quickSortSteps(arr: SensorItem[]) {
  const a = [...arr];
  const steps = [a.slice()];
  function qs(a: SensorItem[], lo: number, hi: number) {
    if (lo >= hi) return;
    const p = a[hi].voltage;
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (a[j].voltage <= p) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    steps.push(a.slice());
    qs(a, lo, i);
    qs(a, i + 2, hi);
  }
  qs(a, 0, a.length - 1);
  return steps;
}

// ============================================================
// High-Performance Benchmark Runners (Evaluated on Given Values)
// ============================================================
function benchmarkBubble(orig: number[]): { comparisons: number; swaps: number; totalOps: number; timeMs: number } {
  const n = orig.length;
  let comparisons = 0, swaps = 0;
  const a = new Float64Array(orig);
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      if (a[j] > a[j + 1]) {
        const tmp = a[j]; a[j] = a[j + 1]; a[j + 1] = tmp;
        swaps++; swapped = true;
      }
    }
    if (!swapped) break;
  }

  // Microsecond timing loop for small arrays
  const runs = n <= 32 ? 2000 : n <= 100 ? 500 : n <= 500 ? 50 : 5;
  const t0 = performance.now();
  for (let r = 0; r < runs; r++) {
    const copy = new Float64Array(orig);
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (copy[j] > copy[j + 1]) {
          const tmp = copy[j]; copy[j] = copy[j + 1]; copy[j + 1] = tmp;
          swapped = true;
        }
      }
      if (!swapped) break;
    }
  }
  const timeMs = Math.max(0.001, +((performance.now() - t0) / runs).toFixed(3));
  return { comparisons, swaps, totalOps: comparisons + swaps, timeMs };
}

function benchmarkSelection(orig: number[]): { comparisons: number; swaps: number; totalOps: number; timeMs: number } {
  const n = orig.length;
  let comparisons = 0, swaps = 0;
  const a = new Float64Array(orig);
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      const tmp = a[i]; a[i] = a[minIdx]; a[minIdx] = tmp;
      swaps++;
    }
  }

  const runs = n <= 32 ? 2000 : n <= 100 ? 500 : n <= 500 ? 50 : 5;
  const t0 = performance.now();
  for (let r = 0; r < runs; r++) {
    const copy = new Float64Array(orig);
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (copy[j] < copy[minIdx]) minIdx = j;
      }
      if (minIdx !== i) {
        const tmp = copy[i]; copy[i] = copy[minIdx]; copy[minIdx] = tmp;
      }
    }
  }
  const timeMs = Math.max(0.001, +((performance.now() - t0) / runs).toFixed(3));
  return { comparisons, swaps, totalOps: comparisons + swaps, timeMs };
}

function benchmarkInsertion(orig: number[]): { comparisons: number; swaps: number; totalOps: number; timeMs: number } {
  const n = orig.length;
  let comparisons = 0, swaps = 0;
  const a = new Float64Array(orig);
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0) {
      comparisons++;
      if (a[j] > key) {
        a[j + 1] = a[j];
        swaps++;
        j--;
      } else break;
    }
    a[j + 1] = key;
  }

  const runs = n <= 32 ? 2000 : n <= 100 ? 500 : n <= 500 ? 50 : 5;
  const t0 = performance.now();
  for (let r = 0; r < runs; r++) {
    const copy = new Float64Array(orig);
    for (let i = 1; i < n; i++) {
      const key = copy[i];
      let j = i - 1;
      while (j >= 0 && copy[j] > key) {
        copy[j + 1] = copy[j];
        j--;
      }
      copy[j + 1] = key;
    }
  }
  const timeMs = Math.max(0.001, +((performance.now() - t0) / runs).toFixed(3));
  return { comparisons, swaps, totalOps: comparisons + swaps, timeMs };
}

function benchmarkMerge(orig: number[]): { comparisons: number; swaps: number; totalOps: number; timeMs: number } {
  const a = new Float64Array(orig);
  const temp = new Float64Array(a.length);
  let comparisons = 0, swaps = 0;

  function merge(l: number, m: number, r: number) {
    let i = l, j = m + 1, k = l;
    while (i <= m && j <= r) {
      comparisons++;
      if (a[i] <= a[j]) temp[k++] = a[i++];
      else temp[k++] = a[j++];
      swaps++;
    }
    while (i <= m) { temp[k++] = a[i++]; swaps++; }
    while (j <= r) { temp[k++] = a[j++]; swaps++; }
    for (let idx = l; idx <= r; idx++) a[idx] = temp[idx];
  }

  function sort(l: number, r: number) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    sort(l, m);
    sort(m + 1, r);
    merge(l, m, r);
  }

  sort(0, a.length - 1);

  const n = orig.length;
  const runs = n <= 32 ? 2000 : n <= 100 ? 500 : n <= 500 ? 50 : 5;
  const t0 = performance.now();
  for (let r = 0; r < runs; r++) {
    const copy = new Float64Array(orig);
    const tmp = new Float64Array(copy.length);
    function mSort(l: number, rIdx: number) {
      if (l >= rIdx) return;
      const m = Math.floor((l + rIdx) / 2);
      mSort(l, m);
      mSort(m + 1, rIdx);
      let i = l, j = m + 1, k = l;
      while (i <= m && j <= rIdx) tmp[k++] = copy[i] <= copy[j] ? copy[i++] : copy[j++];
      while (i <= m) tmp[k++] = copy[i++];
      while (j <= rIdx) tmp[k++] = copy[j++];
      for (let idx = l; idx <= rIdx; idx++) copy[idx] = tmp[idx];
    }
    mSort(0, copy.length - 1);
  }
  const timeMs = Math.max(0.001, +((performance.now() - t0) / runs).toFixed(3));
  return { comparisons, swaps, totalOps: comparisons + swaps, timeMs };
}

function benchmarkQuick(orig: number[]): { comparisons: number; swaps: number; totalOps: number; timeMs: number } {
  const a = new Float64Array(orig);
  let comparisons = 0, swaps = 0;

  function qs(lo: number, hi: number) {
    if (lo >= hi) return;
    const mid = lo + Math.floor((hi - lo) / 2);
    const pivot = a[mid];
    let i = lo, j = hi;
    while (i <= j) {
      while (a[i] < pivot) { comparisons++; i++; }
      comparisons++;
      while (a[j] > pivot) { comparisons++; j--; }
      comparisons++;
      if (i <= j) {
        if (i !== j) {
          const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
          swaps++;
        }
        i++; j--;
      }
    }
    if (lo < j) qs(lo, j);
    if (i < hi) qs(i, hi);
  }

  qs(0, a.length - 1);

  const n = orig.length;
  const runs = n <= 32 ? 2000 : n <= 100 ? 500 : n <= 500 ? 50 : 5;
  const t0 = performance.now();
  for (let r = 0; r < runs; r++) {
    const copy = new Float64Array(orig);
    function qSort(lo: number, hi: number) {
      if (lo >= hi) return;
      const mid = lo + Math.floor((hi - lo) / 2);
      const pivot = copy[mid];
      let i = lo, j = hi;
      while (i <= j) {
        while (copy[i] < pivot) i++;
        while (copy[j] > pivot) j--;
        if (i <= j) {
          if (i !== j) {
            const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
          }
          i++; j--;
        }
      }
      if (lo < j) qSort(lo, j);
      if (i < hi) qSort(i, hi);
    }
    qSort(0, copy.length - 1);
  }
  const timeMs = Math.max(0.001, +((performance.now() - t0) / runs).toFixed(3));
  return { comparisons, swaps, totalOps: comparisons + swaps, timeMs };
}

const algoMap: Record<Algo, {
  stepFn: (a: SensorItem[]) => SensorItem[][];
  benchFn: (a: number[]) => { comparisons: number; swaps: number; totalOps: number; timeMs: number };
  label: string;
  complexity: string;
  bestCase: string;
  spaceComplexity: string;
  color: string;
  cyberPhysicalRole: string;
}> = {
  bubble: {
    stepFn: bubbleSortSteps,
    benchFn: benchmarkBubble,
    label: 'Bubble Sort',
    complexity: 'O(n²)',
    bestCase: 'O(n)',
    spaceComplexity: 'O(1)',
    color: '#818cf8',
    cyberPhysicalRole: 'Simple adjacent comparator. Useful in firmware for small circular buffer scans.'
  },
  selection: {
    stepFn: selectionSortSteps,
    benchFn: benchmarkSelection,
    label: 'Selection Sort',
    complexity: 'O(n²)',
    bestCase: 'O(n²)',
    spaceComplexity: 'O(1)',
    color: '#f87171',
    cyberPhysicalRole: 'Minimizes physical memory writes (O(n) swaps). Best for saving ESP32 Flash/EEPROM endurance.'
  },
  insertion: {
    stepFn: insertionSortSteps,
    benchFn: benchmarkInsertion,
    label: 'Insertion Sort',
    complexity: 'O(n²)',
    bestCase: 'O(n)',
    spaceComplexity: 'O(1)',
    color: '#fbbf24',
    cyberPhysicalRole: 'Highest efficiency O(n) for continuous telemetry streams where new readings arrive nearly sorted.'
  },
  merge: {
    stepFn: mergeSortSteps,
    benchFn: benchmarkMerge,
    label: 'Merge Sort',
    complexity: 'O(n log n)',
    bestCase: 'O(n log n)',
    spaceComplexity: 'O(n)',
    color: '#34d399',
    cyberPhysicalRole: 'Guaranteed stable O(n log n) divide-and-conquer for compiling daily analytical contamination logs.'
  },
  quick: {
    stepFn: quickSortSteps,
    benchFn: benchmarkQuick,
    label: 'Quick Sort',
    complexity: 'O(n log n)',
    bestCase: 'O(n log n)',
    spaceComplexity: 'O(log n)',
    color: '#22d3ee',
    cyberPhysicalRole: 'In-place cache-friendly partitioning. Fastest batch sorting for high-frequency optical ADC buffers.'
  },
};

export interface BenchmarkRecord {
  algo: string;
  label: string;
  complexity: string;
  bestCase: string;
  comparisons: number;
  swaps: number;
  totalOps: number;
  timeMs: number;
  color: string;
  cyberPhysicalRole: string;
}

export default function SortingPage() {
  const { sendCommand, connected, mode, sensorLog } = useWS();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  // Visualizer State
  const [algo, setAlgo] = useState<Algo>('bubble');
  const [items, setItems] = useState<SensorItem[]>([]);
  const [animating, setAnimating] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [allSteps, setAllSteps] = useState<SensorItem[][]>([]);
  const [speed, setSpeed] = useState<number>(50);
  const [dataSource, setDataSource] = useState<string>('simulation');

  // Hard Benchmark Engine State (Based on Given Values Only)
  const [benchScope, setBenchScope] = useState<BenchScope>('current');
  const [distribution, setDistribution] = useState<DatasetDist>('given');
  const [activeBenchmarkData, setActiveBenchmarkData] = useState<number[]>([]);
  const [graphMetric, setGraphMetric] = useState<'totalOps' | 'timeMs' | 'comparisons' | 'swaps'>('totalOps');
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkRecord[]>([]);

  // Build benchmark dataset strictly based on the given sensor readings
  const buildGivenDataset = (scope = benchScope, dist = distribution, currentItems = items): number[] => {
    let base: number[] = [];
    if (scope === 'all-log' && sensorLog && sensorLog.length > 0) {
      base = sensorLog.map(s => +s.voltage.toFixed(3));
    } else if (scope === 'scale-100') {
      const src = currentItems.length > 0 ? currentItems.map(i => i.voltage) : [3.02, 2.78, 2.03, 3.10];
      base = Array.from({ length: 100 }, (_, i) => src[i % src.length]);
    } else if (scope === 'scale-500') {
      const src = currentItems.length > 0 ? currentItems.map(i => i.voltage) : [3.02, 2.78, 2.03, 3.10];
      base = Array.from({ length: 500 }, (_, i) => src[i % src.length]);
    } else if (scope === 'scale-1000') {
      const src = currentItems.length > 0 ? currentItems.map(i => i.voltage) : [3.02, 2.78, 2.03, 3.10];
      base = Array.from({ length: 1000 }, (_, i) => src[i % src.length]);
    } else {
      // 'current' default: strictly the given chamber readings
      base = currentItems.length > 0
        ? currentItems.map(i => i.voltage)
        : [3.02, 2.78, 2.03, 3.10, 3.02, 3.08, 2.22, 2.31, 2.86, 3.02, 2.86, 3.12, 2.43, 3.01, 3.00, 2.83];
    }

    const data = [...base];
    if (dist === 'reverse') {
      data.sort((a, b) => b - a); // Worst-case for Bubble/Insertion
    } else if (dist === 'sorted') {
      data.sort((a, b) => a - b); // Best-case for Bubble/Insertion
    } else if (dist === 'nearly') {
      data.sort((a, b) => a - b);
      const swaps = Math.max(1, Math.floor(data.length * 0.08));
      for (let k = 0; k < swaps; k++) {
        const i1 = Math.floor(Math.random() * data.length);
        const i2 = Math.floor(Math.random() * data.length);
        [data[i1], data[i2]] = [data[i2], data[i1]];
      }
    }
    // 'given': strictly preserved in given arrival sequence
    return data;
  };

  const runHardBenchmark = (scope = benchScope, dist = distribution, currentItems = items) => {
    setBenchmarking(true);
    setTimeout(() => {
      const data = buildGivenDataset(scope, dist, currentItems);
      setActiveBenchmarkData(data);
      const records: BenchmarkRecord[] = [];

      (Object.keys(algoMap) as Algo[]).forEach(a => {
        const stats = algoMap[a].benchFn(data);
        records.push({
          algo: a,
          label: algoMap[a].label,
          complexity: algoMap[a].complexity,
          bestCase: algoMap[a].bestCase,
          comparisons: stats.comparisons,
          swaps: stats.swaps,
          totalOps: stats.totalOps,
          timeMs: stats.timeMs,
          color: algoMap[a].color,
          cyberPhysicalRole: algoMap[a].cyberPhysicalRole
        });
      });

      startTransition(() => {
        setBenchmarkResults(records);
        setBenchmarking(false);
      });
    }, 40);
  };

  // Convert sensorLog into SensorItem array
  const loadFromSimulation = () => {
    if (sensorLog && sensorLog.length > 0) {
      const slice = sensorLog.slice(-16);
      const loaded: SensorItem[] = slice.map(s => ({
        voltage: +s.voltage.toFixed(2),
        ts: +s.timestamp.toFixed(2),
        isBreach: s.voltage < 2.50
      }));
      setItems(loaded);
      setDataSource(`${mode === 'real' ? 'Live Physical Hardware Log' : 'Active Simulation Log'} (${sensorLog.length} total samples)`);
      runHardBenchmark(benchScope, distribution, loaded);
    } else if (mode === 'real') {
      setItems([]);
      setDataSource('Awaiting ESP32 Hardware Telemetry');
    } else {
      // Default realistic chamber batch in demo mode
      generateSimulatedChamberData();
    }
    setAllSteps([]);
    setStepIdx(0);
    setAnimating(false);
  };

  const generateSimulatedChamberData = () => {
    // Generate 16 photodiode readings: mix of clean water baseline (~2.8V-3.2V) and microplastic dips (< 2.5V)
    const samples: SensorItem[] = Array.from({ length: 16 }, (_, i) => {
      const isContaminated = i === 2 || i === 7 || i === 12 || Math.random() < 0.2;
      const v = isContaminated
        ? +(1.85 + Math.random() * 0.60).toFixed(2)
        : +(2.75 + Math.random() * 0.45).toFixed(2);
      return {
        voltage: v,
        ts: +(i * 0.5).toFixed(1),
        isBreach: v < 2.50
      };
    });
    setItems(samples);
    setDataSource('Synthesized Chamber Telemetry');
    setAllSteps([]);
    setStepIdx(0);
    setAnimating(false);
    runHardBenchmark(benchScope, distribution, samples);
  };

  useEffect(() => {
    setMounted(true);
    if (mode === 'real') {
      if (sensorLog && sensorLog.length > 0) {
        loadFromSimulation();
      } else {
        setItems([]);
        setDataSource('Awaiting ESP32 Hardware Telemetry');
      }
    } else {
      loadFromSimulation();
    }
    runHardBenchmark('current', 'given');
  }, [mode]);

  useEffect(() => {
    if (mode === 'real' && sensorLog && sensorLog.length > 0) {
      loadFromSimulation();
    }
  }, [sensorLog.length, mode]);

  // Run animated visual sort on left card
  const runVisualSort = () => {
    if (items.length === 0) return;
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'sort', algo });
    }

    const steps = algoMap[algo].stepFn(items);
    setAllSteps(steps);
    setStepIdx(0);
    setAnimating(true);
  };

  // Visualizer step animation loop
  useEffect(() => {
    if (!animating || stepIdx >= allSteps.length - 1) {
      if (animating) setAnimating(false);
      return;
    }
    const timer = setTimeout(() => {
      setStepIdx(prev => prev + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [animating, stepIdx, allSteps, speed]);

  const currentItems = allSteps.length > 0 ? allSteps[Math.min(stepIdx, allSteps.length - 1)] : items;
  const maxVal = Math.max(...(currentItems.length > 0 ? currentItems.map(it => it.voltage) : [3.5]));
  const minVoltage = currentItems.length > 0 ? Math.min(...currentItems.map(it => it.voltage)) : 0;
  const maxVoltage = currentItems.length > 0 ? Math.max(...currentItems.map(it => it.voltage)) : 0;
  const breachCount = currentItems.filter(it => it.voltage < 2.50).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Sorting Algorithms Benchmark
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Comparative performance analysis of 5 sorting algorithms on optical photodiode voltage arrays
        </p>
      </div>

      {mode === 'real' && !connected && (
        <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#f87171' }}>
          <AlertCircle size={18} />
          <span><strong>Hardware Disconnected:</strong> Connect your ESP32 in the sidebar to sort real optical sensor voltages.</span>
        </div>
      )}

      {/* Telemetry Status Bar */}
      <motion.div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-blue">Source: {dataSource}</span>
            <span className="badge badge-cyan">{currentItems.length} Telemetry Samples</span>
            {breachCount > 0 ? (
              <span className="badge badge-red">{breachCount} Microplastic Occlusions</span>
            ) : (
              <span className="badge badge-green">Nominal Baseline</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {sensorLog && sensorLog.length > 0 && (
              <button className="btn btn-secondary" onClick={loadFromSimulation} title="Load actual sensor readings from simulation run">
                <Database size={13} /> Load Simulation Log ({sensorLog.length})
              </button>
            )}
            {mode === 'demo' && (
              <button className="btn btn-secondary" onClick={generateSimulatedChamberData}>
                Generate New Chamber Batch
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={runVisualSort}
              disabled={animating || currentItems.length === 0}
              style={{ background: algoMap[algo].color, borderColor: algoMap[algo].color }}
            >
              <Play size={13} /> {animating ? 'Sorting...' : `Sort by Voltage (${algoMap[algo].label})`}
            </button>
          </div>
        </div>

        {/* Algorithm Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Choose Algorithm:</span>
          {(Object.keys(algoMap) as Algo[]).map(a => (
            <button
              key={a}
              className={`btn ${algo === a ? 'active' : 'btn-secondary'}`}
              onClick={() => {
                setAlgo(a);
                setAllSteps([]);
                setStepIdx(0);
                setAnimating(false);
              }}
              style={algo === a ? { background: algoMap[a].color, color: '#fff', border: `1px solid ${algoMap[a].color}` } : {}}
            >
              {algoMap[a].label}
              <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 9 }}>{algoMap[a].complexity}</span>
            </button>
          ))}
        </div>

        {/* Algorithm Cyber-Physical Role */}
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.05)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div>
            <strong style={{ color: algoMap[algo].color }}>{algoMap[algo].label} in Cyber-Physical System:</strong>{' '}
            {algoMap[algo].cyberPhysicalRole}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Speed:</span>
            <button className={`btn btn-secondary ${speed === 100 ? 'active' : ''}`} style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => setSpeed(100)}>Slow</button>
            <button className={`btn btn-secondary ${speed === 50 ? 'active' : ''}`} style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => setSpeed(50)}>Normal</button>
            <button className={`btn btn-secondary ${speed === 15 ? 'active' : ''}`} style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => setSpeed(15)}>Fast</button>
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Left = Visualizer with Physical Meaning, Right = Hard Values Benchmark */}
      <div className="grid-2">
        
        {/* Left: Interactive Telemetry Sorting Visualizer */}
        <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="card-header">
            <div>
              <span className="card-title">Live Array Visualizer: {algoMap[algo].label}</span>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Sorting orders readings from lowest voltage (severe occlusion) to highest (clean baseline)
              </div>
            </div>
            {animating && (
              <span className="badge badge-yellow">Step {stepIdx + 1}/{allSteps.length}</span>
            )}
            {!animating && allSteps.length > 0 && (
              <span className="badge badge-green">SORTED ({allSteps.length} steps)</span>
            )}
          </div>

          {/* Microplastic Color Legend */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 11, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
              <span style={{ color: '#fca5a5' }}>Microplastic Contamination (&lt; 2.50V)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
              <span style={{ color: '#6ee7b7' }}>Clean Water Baseline (&gt; 2.70V)</span>
            </div>
          </div>

          {/* Visualizer Bars Container */}
          {currentItems.length === 0 ? (
            <div style={{
              height: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              border: '1px dashed rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              fontSize: 13,
              textAlign: 'center'
            }}>
              {mode === 'real'
                ? 'Awaiting real physical sensor telemetry from ESP32. Connect ESP32 and initiate a detection run from the Simulation page to stream original photodiode readings.'
                : 'No telemetry samples loaded. Click "New Chamber Batch" or run a simulation to load readings.'}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 6,
              height: 220,
              padding: '20px 10px 10px 10px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {currentItems.map((item, i) => {
                const hPct = Math.max(10, Math.min(100, (item.voltage / maxVal) * 100));
                const isBreach = item.voltage < 2.50;
                const barColor = isBreach ? '#ef4444' : '#10b981';

                return (
                  <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ fontSize: 9, color: isBreach ? '#f87171' : '#34d399', marginBottom: 4, fontFamily: 'monospace', fontWeight: 700 }}>
                      {item.voltage.toFixed(2)}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: `${hPct}%`,
                        background: barColor,
                        opacity: 0.85,
                        borderRadius: '4px 4px 0 0',
                        boxShadow: isBreach ? '0 0 10px rgba(239,68,68,0.4)' : '0 0 10px rgba(16,185,129,0.3)',
                        transition: 'height 0.08s ease-out, background 0.2s ease'
                      }}
                    />
                    <div style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>t={item.ts}s</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Scrubber slider */}
          {allSteps.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Step {stepIdx + 1} of {allSteps.length}</span>
                <span>Scrub slider to replay sorting step-by-step</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0}
                max={allSteps.length - 1}
                value={stepIdx}
                onChange={e => {
                  setAnimating(false);
                  setStepIdx(+e.target.value);
                }}
              />
            </div>
          )}

          {/* Physical Interpretation Card */}
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Deepest Microplastic Dip</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginTop: 2 }}>{minVoltage.toFixed(2)}V</div>
              <div style={{ fontSize: 9, color: '#f87171' }}>Index [0] when sorted</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Clear Water Baseline</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', marginTop: 2 }}>{maxVoltage.toFixed(2)}V</div>
              <div style={{ fontSize: 9, color: '#34d399' }}>Index [{currentItems.length - 1}] when sorted</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Contamination Rate</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: breachCount > 0 ? '#fbbf24' : '#34d399', marginTop: 2 }}>
                {((breachCount / (currentItems.length || 1)) * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{breachCount} of {currentItems.length} samples</div>
            </div>
          </div>
        </motion.div>

        {/* Right: Hard Values Benchmark Engine (Given Readings Only) */}
        <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="card-header">
            <div>
              <span className="card-title">📈 Hard Values Benchmark Engine (Given Readings Only)</span>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Benchmarking all 5 algorithms exclusively on the given photodiode telemetry readings • N = {(activeBenchmarkData.length || items.length).toLocaleString()}
              </div>
            </div>
            {benchmarking && (
              <span className="badge badge-yellow" style={{ animation: 'pulse 1s infinite' }}>
                <Zap size={12} /> Benchmarking...
              </span>
            )}
          </div>

          {/* Given Values Input Preview Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.02)',
            padding: '8px 12px',
            borderRadius: 8,
            marginBottom: 14,
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>
              GIVEN VALUES INPUT:
            </span>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, paddingBottom: 2 }}>
              {(activeBenchmarkData.length > 0 ? activeBenchmarkData : items.map(it => it.voltage)).slice(0, 24).map((val, idx) => (
                <span
                  key={idx}
                  className={`badge ${val < 2.50 ? 'badge-red' : 'badge-green'}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '2px 6px', whiteSpace: 'nowrap' }}
                >
                  [{idx}] {val.toFixed(2)}V
                </span>
              ))}
              {(activeBenchmarkData.length || items.length) > 24 && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', whiteSpace: 'nowrap' }}>
                  +{(activeBenchmarkData.length || items.length) - 24} more given values
                </span>
              )}
            </div>
          </div>

          {/* Scope and Ordering Configuration Bar */}
          <div style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.02)',
            padding: '10px 12px',
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {/* Scope / Size Selector */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dataset:</span>
              <button
                className={`btn btn-secondary ${benchScope === 'current' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => {
                  setBenchScope('current');
                  runHardBenchmark('current', distribution);
                }}
                title="Use the exact 16 chamber readings shown above"
              >
                Chamber ({items.length})
              </button>
              {sensorLog && sensorLog.length > 0 && (
                <button
                  className={`btn btn-secondary ${benchScope === 'all-log' ? 'active' : ''}`}
                  style={{ fontSize: 10, padding: '2px 7px' }}
                  onClick={() => {
                    setBenchScope('all-log');
                    runHardBenchmark('all-log', distribution);
                  }}
                  title="Use all logged sensor readings"
                >
                  All Log ({sensorLog.length})
                </button>
              )}
              <button
                className={`btn btn-secondary ${benchScope === 'scale-100' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => {
                  setBenchScope('scale-100');
                  runHardBenchmark('scale-100', distribution);
                }}
                title="Scale given chamber readings to N = 100"
              >
                Scale (100)
              </button>
              <button
                className={`btn btn-secondary ${benchScope === 'scale-500' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => {
                  setBenchScope('scale-500');
                  runHardBenchmark('scale-500', distribution);
                }}
                title="Scale given chamber readings to N = 500"
              >
                Scale (500)
              </button>
              <button
                className={`btn btn-secondary ${benchScope === 'scale-1000' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => {
                  setBenchScope('scale-1000');
                  runHardBenchmark('scale-1000', distribution);
                }}
                title="Scale given chamber readings to N = 1000"
              >
                Scale (1k)
              </button>
            </div>

            {/* Input Order Selector */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Order:</span>
              <button
                className={`btn btn-secondary ${distribution === 'given' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => {
                  setDistribution('given');
                  runHardBenchmark(benchScope, 'given');
                }}
                title="Preserve exact given arrival order of chamber readings"
              >
                As-Given
              </button>
              <button
                className={`btn btn-secondary ${distribution === 'reverse' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px', color: '#f87171' }}
                onClick={() => {
                  setDistribution('reverse');
                  runHardBenchmark(benchScope, 'reverse');
                }}
                title="Reverse sorted order (Worst-Case for Bubble & Insertion)"
              >
                <Flame size={10} /> Worst Case
              </button>
              <button
                className={`btn btn-secondary ${distribution === 'sorted' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px', color: '#38bdf8' }}
                onClick={() => {
                  setDistribution('sorted');
                  runHardBenchmark(benchScope, 'sorted');
                }}
                title="Pre-sorted order (Best-Case for Insertion & Bubble Sort)"
              >
                Best Case
              </button>
              <button
                className={`btn btn-secondary ${distribution === 'nearly' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px', color: '#34d399' }}
                onClick={() => {
                  setDistribution('nearly');
                  runHardBenchmark(benchScope, 'nearly');
                }}
                title="Nearly sorted 90% order of given readings"
              >
                Nearly Sorted
              </button>
            </div>

            <div style={{ flex: 1 }} />

            {/* Run Button */}
            <button
              className="btn btn-success"
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => runHardBenchmark(benchScope, distribution)}
              disabled={benchmarking}
            >
              <BarChart3 size={12} /> {benchmarking ? 'Running...' : 'Run All 5 Benchmarks'}
            </button>
          </div>

          {/* Metric Selector Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Metric:{' '}
              <span style={{ color: '#c084fc' }}>
                {graphMetric === 'totalOps' && 'Total Operations (Comparisons + Swaps)'}
                {graphMetric === 'timeMs' && 'Execution Time (Elapsed CPU Milliseconds)'}
                {graphMetric === 'comparisons' && 'Comparisons Count'}
                {graphMetric === 'swaps' && 'Swaps / Shift Operations'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className={`btn btn-secondary ${graphMetric === 'totalOps' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => setGraphMetric('totalOps')}
              >
                <Layers size={11} /> Total Ops
              </button>
              <button
                className={`btn btn-secondary ${graphMetric === 'timeMs' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => setGraphMetric('timeMs')}
              >
                <Clock size={11} /> Time (ms)
              </button>
              <button
                className={`btn btn-secondary ${graphMetric === 'comparisons' ? 'active' : ''}`}
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => setGraphMetric('comparisons')}
              >
                Comparisons
              </button>
            </div>
          </div>

          {/* Recharts Bar Chart Container */}
          <div style={{ width: '100%', height: 180, marginBottom: 16 }}>
            {mounted && benchmarkResults.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkResults} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    unit={graphMetric === 'timeMs' ? ' ms' : ''}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      color: '#f8fafc',
                      fontSize: 12,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}
                    formatter={(val: unknown) => [
                      graphMetric === 'timeMs'
                        ? `${val} ms elapsed`
                        : `${Number(val).toLocaleString()} operations`,
                      graphMetric === 'timeMs' ? 'Execution Time' : 'Operations'
                    ]}
                  />
                  <Bar dataKey={graphMetric} radius={[5, 5, 0, 0]}>
                    {benchmarkResults.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Loading Benchmark Data...
              </div>
            )}
          </div>

          {/* Benchmark Table with Cyber-Physical Role */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Complexity</th>
                <th>Comparisons</th>
                <th>Swaps</th>
                <th>Total Ops</th>
                <th>Time (ms)</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkResults.map((r, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={r.algo === algo ? { background: 'rgba(99,102,241,0.08)' } : {}}
                >
                  <td style={{ color: r.color, fontWeight: 600 }}>
                    {r.algo === algo ? '▶ ' : ''}{r.label}
                  </td>
                  <td><span className="badge badge-blue" style={{ fontSize: 9 }}>{r.complexity}</span></td>
                  <td style={{ fontFamily: 'monospace' }}>{r.comparisons.toLocaleString()}</td>
                  <td style={{ fontFamily: 'monospace' }}>{r.swaps.toLocaleString()}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {r.totalOps.toLocaleString()}
                  </td>
                  <td style={{ fontFamily: 'monospace', color: r.timeMs < 1 ? '#34d399' : r.timeMs > 5 ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
                    {r.timeMs.toFixed(2)} ms
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </motion.div>
  );
}
