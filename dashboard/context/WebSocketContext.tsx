'use client';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  SimulationEngine, SensorLinkedList, CircularBuffer as CircBuf,
  AlertQueue as AQ, SensorReading as SR, MicroplasticEvent,
  TurbiditySensor, TemperatureSensor, LaserChamber,
  bubbleSort, selectionSort, insertionSort, mergeSort, quickSort,
  type Alert, type SimLog
} from '@/lib/SimulationEngine';

// ============================================================
//  Types
// ============================================================
interface SensorData { photodiode: number; temperature: number; turbidity: number; }
export interface DetectionEvent { id: number; timestamp: number; voltageDrop: number; baseline: number; severity: string; confidence: number; }
interface AlertData { type: string; message: string; timestamp: number; priority: number; }
export interface SensorReading {
  timestamp: number;
  voltage: number;
  sensorType: string;
  valid: boolean;
  dateStr?: string;
  wallClockTime?: string;
  recordedAt?: string;
}
interface SortResult { algo: string; data: { ts: number; v: number }[]; timeUs: number; }

interface SystemStatus {
  pump: string; laser: string; turbidityVoltage: number; temperature: number; photodiode: number;
  detections: number; freeHeap: number; simTime: number; sensorLogSize: number;
  slidingWindowSize: number; slidingWindowCap: number; alertQueueSize: number;
}

type AppMode = 'demo' | 'real';

export interface SimSampleResult {
  type: 'detection' | 'rejected' | 'clear';
  ts: number;
  voltage?: number;
  drop?: number;
  severity?: string;
  confidence?: number;
}

interface WSState {
  mode: AppMode;
  connected: boolean;
  connecting: boolean;
  connectionError: string;
  espIp: string;
  setEspIp: (ip: string) => void;
  connect: () => void;
  disconnect: () => void;
  sendCommand: (cmd: object) => void;
  sensors: SensorData;
  detections: DetectionEvent[];
  alerts: AlertData[];
  sensorLog: SensorReading[];
  sortResults: SortResult[];
  systemStatus: SystemStatus;
  voltageHistory: { ts: number; v: number }[];
  circularBuffer: { slots: SensorReading[]; capacity: number; used: number; avg: number };
  simulationProgress: { phase: string; current: number; total: number; running: boolean };
  simResults: SimSampleResult[];
  // Demo-only: direct access to the simulation engine
  engine: SimulationEngine | null;
  runDemoSimulation: (numSamples: number) => Promise<void>;
  resetDemoSimulation: () => void;
  // Demo DSA operations
  demoSensorLogAppend: (ts: number, v: number) => void;
  demoSensorLogInsertHead: () => void;
  demoSensorLogDeleteFirst: () => void;
  demoSensorLogDeleteLast: () => void;
  demoSlidingWindowAdd: (v: number) => void;
  demoAlertAdd: (priority: number) => void;
  demoAlertProcessOne: () => void;
  demoAlertProcessAll: () => void;
  demoSort: (algo: string) => void;
  clearSensorLog: () => void;
  togglePump: () => void;
  toggleLaser: () => void;
}

const defaultStatus: SystemStatus = {
  pump: 'OFF', laser: 'OFF', turbidityVoltage: 0, temperature: 25, photodiode: 0,
  detections: 0, freeHeap: 0, simTime: 0, sensorLogSize: 0,
  slidingWindowSize: 0, slidingWindowCap: 10, alertQueueSize: 0,
};

const WSContext = createContext<WSState | null>(null);

export function WebSocketProvider({ children, mode }: { children: React.ReactNode; mode: AppMode }) {
  // WebSocket state (for real mode)
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [espIp, setEspIp] = useState('192.168.1.100');
  const wsRef = useRef<WebSocket | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shared UI state
  const [sensors, setSensors] = useState<SensorData>({ photodiode: 0, temperature: 25, turbidity: 0 });
  const [detections, setDetections] = useState<DetectionEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [sensorLog, setSensorLog] = useState<SensorReading[]>(() => {
    if (typeof window !== 'undefined' && mode === 'real') {
      try {
        const saved = localStorage.getItem('microdetect_real_sensor_log');
        if (saved) return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return [];
  });
  const [sortResults, setSortResults] = useState<SortResult[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(defaultStatus);
  const [voltageHistory, setVoltageHistory] = useState<{ ts: number; v: number }[]>([]);
  const [circularBuffer, setCircularBuffer] = useState({ slots: [] as SensorReading[], capacity: 10, used: 0, avg: 0 });
  const [simulationProgress, setSimulationProgress] = useState({ phase: 'IDLE', current: 0, total: 0, running: false });
  const [simResults, setSimResults] = useState<SimSampleResult[]>([]);

  // Persist sensor log in real mode whenever readings arrive
  useEffect(() => {
    if (typeof window !== 'undefined' && mode === 'real') {
      try {
        localStorage.setItem('microdetect_real_sensor_log', JSON.stringify(sensorLog));
      } catch { /* ignore */ }
    }
  }, [sensorLog, mode]);

  // Demo mode: simulation engine (ported from C++ MicroplasticDetector)
  const engineRef = useRef<SimulationEngine>(new SimulationEngine());

  // Sync engine state → React state
  const syncEngineState = useCallback(() => {
    const eng = engineRef.current;
    const logArr = eng.sensorLog.toArray();
    const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isoStr = new Date().toISOString();
    setSensorLog(logArr.map(r => ({
      timestamp: r.timestamp,
      voltage: r.voltage,
      sensorType: r.sensorType,
      valid: r.valid,
      dateStr: dateStr,
      wallClockTime: nowStr,
      recordedAt: isoStr,
    })));

    const slots = eng.slidingWindow.getSlots();
    setCircularBuffer({
      slots: slots.map(s => ({ timestamp: s.timestamp, voltage: s.voltage, sensorType: s.sensorType, valid: s.valid })),
      capacity: 10, used: eng.slidingWindow.getSize(), avg: eng.slidingWindow.getMovingAverage(),
    });

    setAlerts(eng.alertQueue.toArray().map(a => ({ type: a.type, message: a.message, timestamp: a.timestamp, priority: a.priority })));
    setSensors({ photodiode: eng.laserChamber.baseline, temperature: eng.tempSensor.temperature, turbidity: eng.turbiditySensor.voltage });
    setVoltageHistory(logArr.map(r => ({ ts: r.timestamp, v: r.voltage })));
    setSystemStatus(eng.getStatus() as unknown as SystemStatus);
  }, []);

  // Initial sync on mount for demo mode
  useEffect(() => {
    if (mode === 'demo') {
      syncEngineState();
    }
  }, [mode, syncEngineState]);

  // ============================================================
  //  DEMO MODE: Run simulation using the TypeScript DSA engine
  // ============================================================
  const runDemoSimulation = useCallback(async (numSamples: number) => {
    const eng = engineRef.current;
    setSimResults([]);
    setDetections([]);
    setSimulationProgress({ phase: 'STARTING', current: 0, total: numSamples, running: true });
    await eng.runSimulation(numSamples, (log: SimLog) => {
      if (log.type === 'progress') {
        setSimulationProgress(log.data as { phase: string; current: number; total: number; running: boolean });
      } else if (log.type === 'sampleResult') {
        setSimResults(prev => [...prev, log.data as SimSampleResult]);
      } else if (log.type === 'detection') {
        setDetections(prev => [...prev, log.data as DetectionEvent]);
      } else if (log.type === 'sensor') {
        const d = log.data as SensorReading;
        setVoltageHistory(prev => [...prev.slice(-99), { ts: d.timestamp, v: d.voltage }]);
      }
      syncEngineState();
    });
  }, [syncEngineState]);

  const resetDemoSimulation = useCallback(() => {
    engineRef.current = new SimulationEngine();
    setSimResults([]);
    setDetections([]);
    setVoltageHistory([]);
    setSortResults([]);
    setSimulationProgress({ phase: 'IDLE', current: 0, total: 0, running: false });
    syncEngineState();
  }, [syncEngineState]);

  // ============================================================
  //  DEMO MODE: Individual DSA operations
  // ============================================================
  const demoSensorLogAppend = useCallback((ts: number, v: number) => {
    engineRef.current.sensorLog.append(new SR(ts, v, 'PHOTODIODE', true));
    engineRef.current.slidingWindow.insert(new SR(ts, v, 'PHOTODIODE', true));
    syncEngineState();
  }, [syncEngineState]);

  const demoSensorLogInsertHead = useCallback(() => {
    const v = 2.8 + Math.random() * 0.4;
    engineRef.current.sensorLog.insertAtBeginning(new SR(0, v, 'PHOTODIODE', true));
    syncEngineState();
  }, [syncEngineState]);

  const demoSensorLogDeleteFirst = useCallback(() => {
    engineRef.current.sensorLog.deleteFromBeginning();
    syncEngineState();
  }, [syncEngineState]);

  const demoSensorLogDeleteLast = useCallback(() => {
    engineRef.current.sensorLog.deleteFromEnd();
    syncEngineState();
  }, [syncEngineState]);

  const demoSlidingWindowAdd = useCallback((v: number) => {
    engineRef.current.simulationTime = +(engineRef.current.simulationTime + 0.1).toFixed(1);
    const reading = new SR(engineRef.current.simulationTime, v, 'PHOTODIODE', true);
    engineRef.current.slidingWindow.insert(reading);
    engineRef.current.sensorLog.append(reading);
    setVoltageHistory(prev => [...prev.slice(-99), { ts: reading.timestamp, v: reading.voltage }]);
    syncEngineState();
  }, [syncEngineState]);

  const demoAlertAdd = useCallback((priority: number) => {
    const msgs: Record<number, string[]> = {
      1: ['Sensor failure detected', 'Pump overheat warning'],
      2: ['Turbidity sensor drift', 'Laser power degradation'],
      3: ['High turbidity detected', 'Temperature outside range'],
      4: ['New reading recorded', 'System check passed'],
    };
    const m = msgs[priority] || msgs[4];
    const msg = m[Math.floor(Math.random() * m.length)];
    const types: Record<number, string> = { 1: 'CRITICAL', 2: 'ERROR', 3: 'WARNING', 4: 'INFO' };
    engineRef.current.simulationTime += 0.1;
    const alert: Alert = { type: types[priority], message: msg, timestamp: engineRef.current.simulationTime, priority };
    engineRef.current.alertQueue.enqueuePriority(alert);
    syncEngineState();
  }, [syncEngineState]);

  const demoAlertProcessOne = useCallback(() => {
    engineRef.current.alertQueue.dequeue();
    syncEngineState();
  }, [syncEngineState]);

  const demoAlertProcessAll = useCallback(() => {
    while (!engineRef.current.alertQueue.isEmpty()) engineRef.current.alertQueue.dequeue();
    syncEngineState();
  }, [syncEngineState]);

  const demoSort = useCallback((algo: string) => {
    const arr = engineRef.current.sensorLog.toArray();
    if (arr.length === 0) return;
    const t0 = performance.now();
    let sorted: SR[];
    switch (algo) {
      case 'bubble': sorted = bubbleSort(arr); break;
      case 'selection': sorted = selectionSort(arr); break;
      case 'insertion': sorted = insertionSort(arr); break;
      case 'merge': sorted = mergeSort(arr); break;
      case 'quick': sorted = quickSort(arr); break;
      default: sorted = bubbleSort(arr);
    }
    const timeMs = performance.now() - t0;
    setSortResults(prev => [...prev, { algo, data: sorted.map(r => ({ ts: r.timestamp, v: r.voltage })), timeUs: timeMs }]);
  }, []);

  // ============================================================
  //  REAL MODE: WebSocket connection
  // ============================================================
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      const currentDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const currentIso = new Date().toISOString();

      switch (msg.type) {
        case 'sensor': {
          const pVoltage = msg.photodiode ?? 0;
          const tVoltage = msg.turbidity ?? 0;
          const tempVal = msg.temperature ?? 25;
          const tsVal = msg.ts ?? +(Date.now() / 1000).toFixed(1);

          setSensors({ photodiode: pVoltage, temperature: tempVal, turbidity: tVoltage });
          if (pVoltage > 0) {
            setVoltageHistory(prev => [...prev.slice(-99), { ts: tsVal, v: pVoltage }]);

            // When testing with hardware: record every sensor reading into sensorLog with date & time
            const readingItem: SensorReading = {
              timestamp: tsVal,
              voltage: pVoltage,
              sensorType: 'PHOTODIODE',
              valid: tVoltage >= 2.50,
              dateStr: currentDateStr,
              wallClockTime: currentTimeStr,
              recordedAt: currentIso,
            };

            setSensorLog(prev => {
              // Avoid exact duplicate at the exact same sub-second timestamp
              if (prev.length > 0 && Math.abs(prev[prev.length - 1].timestamp - tsVal) < 0.05) {
                return prev;
              }
              return [...prev, readingItem];
            });

            setCircularBuffer(prev => {
              const nextSlots = [...prev.slots, readingItem].slice(-10);
              const avg = nextSlots.reduce((sum, r) => sum + r.voltage, 0) / (nextSlots.length || 1);
              return {
                ...prev,
                slots: nextSlots,
                used: nextSlots.length,
                avg,
              };
            });
          }
          break;
        }
        case 'detection':
          setDetections(prev => [...prev, msg as DetectionEvent]);
          setSimResults(prev => [...prev, {
            type: 'detection',
            ts: msg.timestamp ?? Date.now() / 1000,
            voltage: (msg.baseline ?? 3.0) - (msg.voltageDrop ?? 0.5),
            drop: msg.voltageDrop ?? 0.5,
            severity: msg.severity ?? 'MEDIUM',
            confidence: msg.confidence ?? 85
          }]);
          break;
        case 'alert':
          setAlerts(prev => [{
            type: msg.alertType ?? msg.type ?? 'INFO',
            message: msg.message ?? '',
            timestamp: msg.timestamp ?? Date.now() / 1000,
            priority: msg.priority ?? 4,
          }, ...prev].slice(0, 50));
          break;
        case 'sensorReading': {
          const recReading: SensorReading = {
            timestamp: msg.timestamp ?? +(Date.now() / 1000).toFixed(1),
            voltage: msg.voltage ?? 0,
            sensorType: msg.sensorType ?? 'PHOTODIODE',
            valid: msg.valid !== false,
            dateStr: msg.dateStr || currentDateStr,
            wallClockTime: msg.wallClockTime || currentTimeStr,
            recordedAt: msg.recordedAt || currentIso,
          };
          setSensorLog(prev => {
            if (prev.some(p => p.timestamp === recReading.timestamp && p.voltage === recReading.voltage)) {
              return prev;
            }
            return [...prev, recReading];
          });
          setVoltageHistory(prev => [...prev.slice(-99), { ts: recReading.timestamp, v: recReading.voltage }]);
          setCircularBuffer(prev => {
            const nextSlots = [...prev.slots, recReading].slice(-10);
            const avg = nextSlots.reduce((sum, r) => sum + r.voltage, 0) / (nextSlots.length || 1);
            return {
              ...prev,
              slots: nextSlots,
              used: nextSlots.length,
              avg,
            };
          });
          if (msg.sensorType === 'TURBIDITY' && !msg.valid) {
            setSimResults(prev => [...prev, {
              type: 'rejected',
              ts: msg.timestamp ?? Date.now() / 1000,
              voltage: msg.voltage
            }]);
          } else if (msg.sensorType === 'PHOTODIODE' && msg.voltage >= 2.50) {
            setSimResults(prev => [...prev, {
              type: 'clear',
              ts: msg.timestamp ?? Date.now() / 1000,
              voltage: msg.voltage
            }]);
          }
          break;
        }
        case 'sortResult':
          setSortResults(prev => [...prev, msg as SortResult]);
          break;
        case 'status':
          setSystemStatus(msg as SystemStatus);
          setSensors({ photodiode: msg.photodiode ?? 0, temperature: msg.temperature ?? 25, turbidity: msg.turbidityVoltage ?? 0 });
          if (msg.slidingWindowSize !== undefined) {
            setCircularBuffer(prev => ({ ...prev, used: msg.slidingWindowSize, capacity: msg.slidingWindowCap ?? 10 }));
          }
          break;
        case 'simProgress':
          if (msg.phase === 'CALIBRATING' || msg.current === 0) {
            setSimResults([]);
          }
          setSimulationProgress(msg);
          break;
        case 'sensorLogAction':
          if (msg.action === 'deleteFirst') {
            setSensorLog(prev => prev.slice(1));
          } else if (msg.action === 'deleteLast') {
            setSensorLog(prev => prev.slice(0, -1));
          } else if (msg.action === 'clear') {
            setSensorLog([]);
          }
          break;
        case 'alertAction':
          if (msg.action === 'processOne') {
            setAlerts(prev => prev.slice(0, -1));
          } else if (msg.action === 'processAll') {
            setAlerts([]);
          }
          break;
      }
    } catch { /* ignore */ }
  }, []);

  const connectWS = useCallback(() => {
    if (mode !== 'real') return;
    if (wsRef.current) wsRef.current.close();
    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);

    // Validate IP format
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!espIp.trim()) {
      setConnectionError('Please enter an IP address');
      return;
    }
    if (!ipPattern.test(espIp.trim())) {
      setConnectionError(`Invalid IP format: "${espIp}"`);
      return;
    }

    setConnecting(true);
    setConnectionError('');

    try {
      const ws = new WebSocket(`ws://${espIp}:81`);

      // Connection timeout — if no response in 5 seconds, treat as unreachable
      connectTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setConnecting(false);
          setConnected(false);
          setConnectionError(`Could not reach ESP32 at ${espIp}:81 — check IP and ensure device is powered on`);
        }
      }, 5000);

      ws.onopen = () => {
        if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
        setConnected(true);
        setConnecting(false);
        setConnectionError('');
        // Request status and all stored hardware sensor logs from ESP32
        ws.send(JSON.stringify({ cmd: 'status' }));
        ws.send(JSON.stringify({ cmd: 'sensorLog', action: 'dump' }));
      };
      ws.onclose = () => {
        setConnected(false);
        setConnecting(false);
      };
      ws.onerror = () => {
        if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
        setConnected(false);
        setConnecting(false);
        setConnectionError(`Connection failed — ESP32 not found at ${espIp}:81`);
      };
      ws.onmessage = handleMessage;
      wsRef.current = ws;
    } catch {
      setConnected(false);
      setConnecting(false);
      setConnectionError('WebSocket error — check browser console');
    }
  }, [espIp, handleMessage, mode]);

  const disconnect = useCallback(() => {
    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setConnected(false);
    setConnecting(false);
    setConnectionError('');
  }, []);

  const sendCommand = useCallback((cmd: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  const clearSensorLog = useCallback(() => {
    setSensorLog([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('microdetect_real_sensor_log');
      } catch { /* ignore */ }
    }
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'sensorLog', action: 'clear' });
    }
  }, [connected, mode, sendCommand]);

  const togglePump = useCallback(() => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'pump', action: 'toggle' });
    } else {
      const eng = engineRef.current;
      eng.pumpRunning = !eng.pumpRunning;
      syncEngineState();
    }
  }, [mode, connected, sendCommand, syncEngineState]);

  const toggleLaser = useCallback(() => {
    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'laser', action: 'toggle' });
    } else {
      const eng = engineRef.current;
      if (eng.laserChamber.laserOn) {
        eng.laserChamber.deactivate();
      } else {
        eng.laserChamber.activate();
      }
      syncEngineState();
    }
  }, [mode, connected, sendCommand, syncEngineState]);

  // Demo mode: only stream sensor fluctuations when laser or pump is active
  useEffect(() => {
    if (mode !== 'demo') return;
    const interval = setInterval(() => {
      const eng = engineRef.current;
      if (eng.laserChamber.laserOn || eng.pumpRunning) {
        const pv = eng.laserChamber.baseline > 0 ? eng.laserChamber.baseline + (Math.random() - 0.5) * 0.04 : 3.0;
        const temp = eng.tempSensor.temperature > 0 ? eng.tempSensor.temperature + (Math.random() - 0.5) * 0.2 : 25;
        const tv = eng.turbiditySensor.voltage > 0 ? eng.turbiditySensor.voltage : 4.2;
        setSensors({ photodiode: pv, temperature: temp, turbidity: tv });
        setVoltageHistory(prev => [...prev.slice(-99), { ts: Date.now() / 1000, v: pv }]);
        setSystemStatus(prev => ({ ...prev, temperature: temp, photodiode: pv, turbidityVoltage: tv, freeHeap: 240000 + Math.floor(Math.random() * 10000) }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  return (
    <WSContext.Provider value={{
      mode, connected: mode === 'demo' ? true : connected,
      connecting, connectionError,
      espIp, setEspIp, connect: connectWS, disconnect, sendCommand,
      sensors, detections, alerts, sensorLog, sortResults,
      systemStatus, voltageHistory, circularBuffer, simulationProgress,
      simResults, engine: engineRef.current,
      runDemoSimulation, resetDemoSimulation,
      demoSensorLogAppend, demoSensorLogInsertHead, demoSensorLogDeleteFirst, demoSensorLogDeleteLast,
      demoSlidingWindowAdd, demoAlertAdd, demoAlertProcessOne, demoAlertProcessAll, demoSort,
      clearSensorLog,
      togglePump, toggleLaser,
    }}>
      {children}
    </WSContext.Provider>
  );
}

export const useWS = () => {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error('useWS must be used within WebSocketProvider');
  return ctx;
};
