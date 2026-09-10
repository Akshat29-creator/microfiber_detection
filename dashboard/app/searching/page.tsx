'use client';
import { useWS } from '@/context/WebSocketContext';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Zap, Database, AlertTriangle, CheckCircle2, RotateCcw, Crosshair } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type SearchMode = 'exact' | 'firstBelow' | 'allBelow';

export default function SearchingPage() {
  const { sendCommand, connected, mode, sensorLog } = useWS();
  const [data, setData] = useState<number[]>([]);
  const [target, setTarget] = useState('2.75');
  const [threshold, setThreshold] = useState('2.50');
  const [searchType, setSearchType] = useState<'linear' | 'binary'>('linear');
  const [searchMode, setSearchMode] = useState<SearchMode>('exact');
  const [searching, setSearching] = useState(false);
  
  // Linear search state
  const [scanIdx, setScanIdx] = useState(-1);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [closestIdx, setClosestIdx] = useState<number | null>(null);

  // Binary search state
  const [lo, setLo] = useState(-1);
  const [hi, setHi] = useState(-1);
  const [mid, setMid] = useState(-1);

  // General metrics
  const [comparisons, setComparisons] = useState(0);
  const [foundMessage, setFoundMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetSearchState = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setScanIdx(-1);
    setMatchedIndices([]);
    setClosestIdx(null);
    setLo(-1);
    setHi(-1);
    setMid(-1);
    setComparisons(0);
    setFoundMessage('');
    setIsSuccess(null);
    setSearching(false);
  };

  const generateData = () => {
    resetSearchState();
    // Generate realistic photodiode voltages, with a few low dips simulating microplastics
    const d = Array.from({ length: 16 }, () => {
      const isContaminated = Math.random() < 0.25;
      return +(isContaminated ? 1.8 + Math.random() * 0.6 : 2.5 + Math.random() * 0.9).toFixed(2);
    });
    // For visual clarity, sort ascending
    d.sort((a, b) => a - b);
    setData(d);
    // Set target to an existing element
    if (d.length > 0) {
      setTarget(d[Math.floor(d.length / 2)].toFixed(2));
    }
  };

  const loadFromSensorLog = () => {
    if (sensorLog.length === 0) return;
    resetSearchState();
    const d = sensorLog.slice(-16).map(s => +s.voltage.toFixed(2));
    d.sort((a, b) => a - b);
    setData(d);
    if (d.length > 0) {
      setTarget(d[Math.floor(d.length / 2)].toFixed(2));
    }
  };

  useEffect(() => {
    if (mode === 'real') {
      if (sensorLog.length > 0) {
        loadFromSensorLog();
      } else {
        setData([]);
      }
    } else {
      generateData();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode]);

  useEffect(() => {
    if (mode === 'real' && sensorLog.length > 0) {
      loadFromSensorLog();
    }
  }, [sensorLog.length, mode]);

  // 1. LINEAR SEARCH — Exact Match or Nearest
  const runLinearExactSearch = (customTarget?: string) => {
    if (data.length === 0) return;
    resetSearchState();
    setSearchType('linear');
    setSearchMode('exact');
    setSearching(true);

    const t = parseFloat(customTarget ?? target);
    if (isNaN(t)) {
      setSearching(false);
      setFoundMessage('Please enter a valid target voltage.');
      setIsSuccess(false);
      return;
    }

    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'search', algo: 'linear', threshold: t });
    }

    let i = 0;
    let bestIdx = 0;
    let minDiff = Math.abs(data[0] - t);

    intervalRef.current = setInterval(() => {
      if (i >= data.length) {
        // End of array
        setSearching(false);
        if (minDiff < 0.005) {
          setMatchedIndices([bestIdx]);
          setIsSuccess(true);
          setFoundMessage(`Exact match found! ${data[bestIdx].toFixed(2)}V at index [${bestIdx}] in ${bestIdx + 1} comparisons.`);
        } else {
          setClosestIdx(bestIdx);
          setIsSuccess(false);
          setFoundMessage(`Target ${t.toFixed(2)}V not in array after ${data.length} comparisons. Closest reading is ${data[bestIdx].toFixed(2)}V at index [${bestIdx}] (Δ ${minDiff.toFixed(2)}V).`);
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      setScanIdx(i);
      setComparisons(i + 1);

      const diff = Math.abs(data[i] - t);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = i;
      }

      // Check exact match (floating point tolerance 0.005)
      if (diff < 0.005) {
        setMatchedIndices([i]);
        setIsSuccess(true);
        setFoundMessage(`Exact match found! ${data[i].toFixed(2)}V at index [${i}] in ${i + 1} comparisons (O(n)).`);
        setSearching(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      i++;
    }, 240);
  };

  // 2. BINARY SEARCH — Exact Match with Range Halving
  const runBinarySearch = (customTarget?: string) => {
    if (data.length === 0) return;
    resetSearchState();
    setSearchType('binary');
    setSearchMode('exact');
    setSearching(true);

    const t = parseFloat(customTarget ?? target);
    if (isNaN(t)) {
      setSearching(false);
      setFoundMessage('Please enter a valid target voltage.');
      setIsSuccess(false);
      return;
    }

    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'search', algo: 'binary', voltage: t });
    }

    // Binary search requires sorted array
    const sorted = [...data].sort((a, b) => a - b);
    setData(sorted);

    let low = 0;
    let high = sorted.length - 1;
    const steps: { lo: number; hi: number; mid: number }[] = [];
    let exactIdx = -1;
    let closestIndex = 0;
    let minDiff = Infinity;

    while (low <= high) {
      const m = Math.floor((low + high) / 2);
      steps.push({ lo: low, hi: high, mid: m });

      const diff = Math.abs(sorted[m] - t);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = m;
      }

      if (diff < 0.005) {
        exactIdx = m;
        break;
      }

      if (sorted[m] < t) {
        low = m + 1;
      } else {
        high = m - 1;
      }
    }

    let s = 0;
    intervalRef.current = setInterval(() => {
      if (s >= steps.length) {
        setSearching(false);
        if (exactIdx !== -1) {
          setMatchedIndices([exactIdx]);
          setIsSuccess(true);
          setFoundMessage(`Binary search match! Found ${sorted[exactIdx].toFixed(2)}V at index [${exactIdx}] in only ${steps.length} halving steps (O(log n))!`);
        } else {
          setClosestIdx(closestIndex);
          setIsSuccess(false);
          setFoundMessage(`Target ${t.toFixed(2)}V not found after ${steps.length} halving steps. Closest value is ${sorted[closestIndex].toFixed(2)}V at index [${closestIndex}] (Δ ${minDiff.toFixed(2)}V).`);
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      setLo(steps[s].lo);
      setHi(steps[s].hi);
      setMid(steps[s].mid);
      setComparisons(s + 1);
      s++;
    }, 420);
  };

  // 3. THRESHOLD BREACH SEARCH — Find ALL readings < threshold (Microplastic Contamination)
  const runBreachScan = () => {
    if (data.length === 0) return;
    resetSearchState();
    setSearchType('linear');
    setSearchMode('allBelow');
    setSearching(true);

    const thresh = parseFloat(threshold);
    if (isNaN(thresh)) {
      setSearching(false);
      setFoundMessage('Please enter a valid threshold voltage.');
      setIsSuccess(false);
      return;
    }

    let i = 0;
    const breaches: number[] = [];

    intervalRef.current = setInterval(() => {
      if (i >= data.length) {
        setSearching(false);
        setMatchedIndices(breaches);
        if (breaches.length > 0) {
          setIsSuccess(true);
          setFoundMessage(`Detection Complete: Found ${breaches.length} microplastic breach sample(s) below ${thresh.toFixed(2)}V threshold!`);
        } else {
          setIsSuccess(false);
          setFoundMessage(`Detection Complete: No readings breached the ${thresh.toFixed(2)}V threshold. Water sample is clean!`);
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      setScanIdx(i);
      setComparisons(i + 1);

      if (data[i] < thresh) {
        breaches.push(i);
        setMatchedIndices([...breaches]);
      }

      i++;
    }, 200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Searching Algorithms Benchmark
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Linear search O(n) and binary search O(log n) for microplastic contamination detection
        </p>
      </div>

      {mode === 'real' && !connected && (
        <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#f87171' }}>
          <AlertTriangle size={18} />
          <span><strong>Hardware Disconnected:</strong> Connect your ESP32 in the sidebar to search through real optical sensor voltages.</span>
        </div>
      )}

      {/* Main Control Panel */}
      <motion.div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          
          {/* Target Voltage Input */}
          <div className="input-group" style={{ width: 140 }}>
            <label>Target Voltage (V)</label>
            <input
              className="input"
              value={target}
              onChange={e => setTarget(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !searching) {
                  searchType === 'linear' ? runLinearExactSearch() : runBinarySearch();
                }
              }}
              placeholder="2.75"
            />
          </div>

          {/* Threshold Input */}
          <div className="input-group" style={{ width: 140 }}>
            <label>Breach Limit (V)</label>
            <input
              className="input"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              placeholder="2.50"
            />
          </div>

          {/* Action: Linear Search */}
          <button
            className="btn btn-primary"
            onClick={() => runLinearExactSearch()}
            disabled={searching || data.length === 0}
            style={{ minWidth: 150, background: '#6366f1', borderColor: '#6366f1' }}
          >
            <SearchIcon size={14} /> {searching && searchType === 'linear' && searchMode === 'exact' ? 'Scanning...' : 'Linear Search O(n)'}
          </button>

          {/* Action: Binary Search */}
          <button
            className="btn btn-primary"
            onClick={() => runBinarySearch()}
            disabled={searching || data.length === 0}
            style={{ minWidth: 150, background: '#06b6d4', borderColor: '#06b6d4' }}
          >
            <Zap size={14} /> {searching && searchType === 'binary' ? 'Halving Range...' : 'Binary Search O(log n)'}
          </button>

          {/* Action: Scan Breaches */}
          <button
            className="btn btn-danger"
            onClick={runBreachScan}
            disabled={searching || data.length === 0}
            title="Linear scan for all optical dips below breach limit"
          >
            <AlertTriangle size={14} /> Scan Breaches (&lt;{threshold}V)
          </button>

          <div style={{ flex: 1, minWidth: 10 }} />

          {/* Load from Real Simulation Sensor Log */}
          {sensorLog.length > 0 && (
            <button className="btn btn-secondary" onClick={loadFromSensorLog} title="Load actual sensor readings from simulation">
              <Database size={14} /> Sensor Log ({sensorLog.length})
            </button>
          )}

          {/* New Random Array (Demo mode only) */}
          {mode === 'demo' && (
            <button className="btn btn-secondary" onClick={generateData} title="Generate new random readings array">
              🎲 New Array
            </button>
          )}

          {/* Reset */}
          <button className="btn btn-secondary" onClick={resetSearchState} title="Reset search state">
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Quick Select Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quick Target Presets:</span>
          {data.length > 0 && (
            <>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => {
                  setTarget(data[0].toFixed(2));
                  runLinearExactSearch(data[0].toFixed(2));
                }}
              >
                Min ({data[0].toFixed(2)}V)
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => {
                  const m = data[Math.floor(data.length / 2)].toFixed(2);
                  setTarget(m);
                  runBinarySearch(m);
                }}
              >
                Mid ({data[Math.floor(data.length / 2)].toFixed(2)}V)
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => {
                  setTarget(data[data.length - 1].toFixed(2));
                  runLinearExactSearch(data[data.length - 1].toFixed(2));
                }}
              >
                Max ({data[data.length - 1].toFixed(2)}V)
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '2px 8px', color: '#f87171' }}
                onClick={() => {
                  setTarget('9.99');
                  runBinarySearch('9.99');
                }}
              >
                Not in Array (9.99V)
              </button>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                💡 Tip: Click on any card below to search for it immediately!
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Visual Search Grid Card */}
      <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">
            {searchType === 'linear' && searchMode === 'exact' && 'Linear Search — Sequentially inspecting element by element'}
            {searchType === 'linear' && searchMode === 'allBelow' && `Contamination Breach Linear Scan — Flagging all readings < ${threshold}V`}
            {searchType === 'binary' && 'Binary Search — Dividing search range in half each step (O(log n))'}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {comparisons > 0 && <span className="badge badge-purple">Comparisons: {comparisons}</span>}
            {matchedIndices.length > 0 && <span className="badge badge-green">MATCH FOUND ({matchedIndices.length})</span>}
            {closestIdx !== null && matchedIndices.length === 0 && <span className="badge badge-yellow">CLOSEST MATCH</span>}
            {isSuccess === false && closestIdx === null && <span className="badge badge-red">NOT FOUND</span>}
          </div>
        </div>

        {/* Live Status Message Banner */}
        {foundMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              borderRadius: 8,
              background: isSuccess ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: isSuccess ? '#34d399' : '#f87171'
            }}
          >
            {isSuccess ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{foundMessage}</span>
          </motion.div>
        )}

        {/* Elements Array Cards */}
        {data.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.08)', margin: '10px 0' }}>
            {mode === 'real'
              ? 'Awaiting real physical sensor telemetry from ESP32. Connect ESP32 and initiate a detection cycle from the Simulation page to stream original photodiode readings.'
              : 'Array is empty. Click "New Array" or run the simulation to populate readings.'}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 0' }}>
            {data.map((v, i) => {
            let bg = 'rgba(255,255,255,0.02)';
            let border = 'rgba(255,255,255,0.08)';
            let color = 'var(--text-secondary)';
            let badgeText = '';

            const isMatched = matchedIndices.includes(i);
            const isClosest = closestIdx === i;

            if (isMatched) {
              if (searchMode === 'allBelow') {
                bg = 'rgba(239,68,68,0.25)';
                border = '#ef4444';
                color = '#fca5a5';
                badgeText = 'BREACH';
              } else {
                bg = 'rgba(16,185,129,0.25)';
                border = '#10b981';
                color = '#34d399';
                badgeText = 'MATCH';
              }
            } else if (isClosest) {
              bg = 'rgba(245,158,11,0.25)';
              border = '#f59e0b';
              color = '#fcd34d';
              badgeText = 'NEAREST';
            } else if (searchType === 'linear' && scanIdx === i) {
              bg = 'rgba(245,158,11,0.2)';
              border = '#f59e0b';
              color = '#fbbf24';
              badgeText = 'CHECKING';
            } else if (searchType === 'linear' && scanIdx >= 0 && i < scanIdx) {
              bg = 'rgba(99,102,241,0.04)';
              border = 'rgba(99,102,241,0.15)';
              color = '#64748b';
            } else if (searchType === 'binary') {
              if (i === mid && mid >= 0) {
                bg = 'rgba(245,158,11,0.25)';
                border = '#f59e0b';
                color = '#fbbf24';
                badgeText = 'MID';
              } else if (i >= lo && i <= hi && lo >= 0) {
                bg = 'rgba(6,182,212,0.12)';
                border = 'rgba(6,182,212,0.4)';
                color = '#67e8f9';
              } else if (lo >= 0) {
                bg = 'rgba(0,0,0,0.35)';
                border = 'rgba(255,255,255,0.02)';
                color = '#334155';
              }
            }

            return (
              <motion.div
                key={i}
                onClick={() => {
                  setTarget(v.toFixed(2));
                  searchType === 'linear' ? runLinearExactSearch(v.toFixed(2)) : runBinarySearch(v.toFixed(2));
                }}
                title="Click to search for this value"
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: bg,
                  border: `1px solid ${border}`,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color,
                  minWidth: 70,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                whileHover={{ scale: 1.08 }}
                animate={isMatched ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.25 }}
              >
                <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>[{i}]</div>
                <div>{v.toFixed(2)}V</div>
                
                {badgeText && (
                  <div style={{ fontSize: 8, fontWeight: 800, marginTop: 4, color: border }}>
                    {badgeText}
                  </div>
                )}
                
                {searchType === 'binary' && i === lo && lo >= 0 && i !== mid && (
                  <div style={{ fontSize: 8, color: '#22d3ee', marginTop: 2 }}>LOW</div>
                )}
                {searchType === 'binary' && i === hi && hi >= 0 && i !== mid && (
                  <div style={{ fontSize: 8, color: '#22d3ee', marginTop: 2 }}>HIGH</div>
                )}
              </motion.div>
            );
          })}
        </div>
        )}
      </motion.div>

      {/* Educational Walkthrough Cards */}
      <div className="grid-2">
        <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="card-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SearchIcon size={16} color="#818cf8" /> Linear Search Walkthrough
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>1. Start from index 0 and inspect each voltage element sequentially.</p>
            <p>2. Compare voltage value against target: if |V[i] - Target| &lt; 0.005, match confirmed!</p>
            <p>3. <strong>Breach Scan Mode:</strong> Scans all readings below threshold limit (&lt;{threshold}V) to catch particulate contamination events.</p>
            <p>4. No array sorting required; ideal for unsorted real-time sensor streams.</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-yellow">Time: O(n)</span>
              <span className="badge badge-blue">Space: O(1)</span>
              <span className="badge badge-purple">No Sorting Needed</span>
            </div>
          </div>
        </motion.div>

        <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="card-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={16} color="#06b6d4" /> Binary Search Walkthrough
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>1. <strong>Mandatory prerequisite</strong>: Array must be sorted in ascending order.</p>
            <p>2. Compute midpoint index: <code style={{ color: '#22d3ee' }}>mid = floor((low + high) / 2)</code>.</p>
            <p>3. If V[mid] == Target &rarr; Match found in logarithmic time!</p>
            <p>4. If Target &lt; V[mid] &rarr; Discard right half (<code style={{ color: '#fbbf24' }}>high = mid - 1</code>).</p>
            <p>5. If Target &gt; V[mid] &rarr; Discard left half (<code style={{ color: '#fbbf24' }}>low = mid + 1</code>).</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-green">Time: O(log n)</span>
              <span className="badge badge-blue">Space: O(1)</span>
              <span className="badge badge-purple">Requires Sorted Array</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
