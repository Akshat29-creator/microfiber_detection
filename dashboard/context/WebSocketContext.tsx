'use client';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  SimulationEngine, SensorLinkedList, EventDoublyList, CircularBuffer as CircBuf,
  AlertQueue as AQ, CalibrationStack as CS, DetectionBST as BST,
  SensorReading as SR, MicroplasticEvent, TurbiditySensor, TemperatureSensor, LaserChamber,
  bubbleSort, selectionSort, insertionSort, mergeSort, quickSort,
  linearSearchBelow, binarySearchByVoltage,
  type Alert, type CalibrationState, type SimLog
} from '@/lib/SimulationEngine';

// ============================================================
//  Types
// ============================================================
interface SensorData { photodiode: number; temperature: number; turbidity: number; }
export interface DetectionEvent { id: number; timestamp: number; voltageDrop: number; baseline: number; severity: string; confidence: number; }
interface AlertData { type: string; message: string; timestamp: number; priority: number; }
interface CalibrationData { baseline: number; threshold: number; correction: number; timestamp: number; description: string; }
interface SensorReading { timestamp: number; voltage: number; sensorType: string; valid: boolean; }
interface SortResult { algo: string; data: { ts: number; v: number }[]; timeUs: number; }

interface SystemStatus {
  pump: string; laser: string; turbidityVoltage: number; temperature: number; photodiode: number;
  detections: number; freeHeap: number; simTime: number; sensorLogSize: number; eventHistorySize: number;
  slidingWindowSize: number; slidingWindowCap: number; alertQueueSize: number; calibStackSize: number;
  bstSize: number; bstHeight: number;
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
  calibrationStack: CalibrationData[];
  sortResults: SortResult[];
  systemStatus: SystemStatus;
  voltageHistory: { ts: number; v: number }[];
  circularBuffer: { slots: SensorReading[]; capacity: number; used: number; avg: number };
  bstData: { inorder: DetectionEvent[]; preorder: DetectionEvent[]; height: number; size: number };
  simulationProgress: { phase: string; current: number; total: number; running: boolean };
  searchResult: { found: boolean; index: number; comparisons: number; data: SensorReading | null };
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
  demoEventDeleteById: (id: number) => void;
  demoSlidingWindowAdd: (v: number) => void;
  demoCalibPush: (b: number, t: number) => void;
  demoCalibUndo: () => void;
  demoAlertAdd: (priority: number) => void;
  demoAlertProcessOne: () => void;
  demoAlertProcessAll: () => void;
  demoBSTInsert: (ts: number, drop: number) => void;
  demoBSTClear: () => void;
  demoBSTSearch: (ts: number) => MicroplasticEvent | null;
  demoSort: (algo: string) => void;
}

const defaultStatus: SystemStatus = {
  pump: 'OFF', laser: 'OFF', turbidityVoltage: 0, temperature: 25, photodiode: 0,
  detections: 0, freeHeap: 0, simTime: 0, sensorLogSize: 0, eventHistorySize: 0,
  slidingWindowSize: 0, slidingWindowCap: 10, alertQueueSize: 0, calibStackSize: 0,
  bstSize: 0, bstHeight: 0,
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
  const [sensorLog, setSensorLog] = useState<SensorReading[]>([]);
  const [calibrationStack, setCalibrationStack] = useState<CalibrationData[]>([]);
  const [sortResults, setSortResults] = useState<SortResult[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(defaultStatus);
  const [voltageHistory, setVoltageHistory] = useState<{ ts: number; v: number }[]>([]);
  const [circularBuffer, setCircularBuffer] = useState({ slots: [] as SensorReading[], capacity: 10, used: 0, avg: 0 });
  const [bstData, setBstData] = useState({ inorder: [] as DetectionEvent[], preorder: [] as DetectionEvent[], height: 0, size: 0 });
  const [simulationProgress, setSimulationProgress] = useState({ phase: 'IDLE', current: 0, total: 0, running: false });
  const [searchResult, setSearchResult] = useState({ found: false, index: -1, comparisons: 0, data: null as SensorReading | null });
  const [simResults, setSimResults] = useState<SimSampleResult[]>([]);

  // Demo mode: simulation engine (ported from C++ MicroplasticDetector)
  const engineRef = useRef<SimulationEngine>(new SimulationEngine());

  // Sync engine state → React state
  const syncEngineState = useCallback(() => {
    const eng = engineRef.current;
    const logArr = eng.sensorLog.toArray();
    setSensorLog(logArr.map(r => ({ timestamp: r.timestamp, voltage: r.voltage, sensorType: r.sensorType, valid: r.valid })));

    const events = eng.eventHistory.forwardTraversal();
    setDetections(events.map(e => ({ id: e.eventID, timestamp: e.timestamp, voltageDrop: e.voltageDrop, baseline: e.baselineVoltage, severity: e.severity, confidence: e.confidence() })));

    const slots = eng.slidingWindow.getSlots();
    setCircularBuffer({
      slots: slots.map(s => ({ timestamp: s.timestamp, voltage: s.voltage, sensorType: s.sensorType, valid: s.valid })),
      capacity: 10, used: eng.slidingWindow.getSize(), avg: eng.slidingWindow.getMovingAverage(),
    });

    setAlerts(eng.alertQueue.toArray().map(a => ({ type: a.type, message: a.message, timestamp: a.timestamp, priority: a.priority })));
    setCalibrationStack(eng.calibrationStack.toArray());

    const inorder = eng.detectionTree.inorder();
    const preorder = eng.detectionTree.preorder();
    setBstData({
      inorder: inorder.map(e => ({ id: e.eventID, timestamp: e.timestamp, voltageDrop: e.voltageDrop, baseline: e.baselineVoltage, severity: e.severity, confidence: e.confidence() })),
      preorder: preorder.map(e => ({ id: e.eventID, timestamp: e.timestamp, voltageDrop: e.voltageDrop, baseline: e.baselineVoltage, severity: e.severity, confidence: e.confidence() })),
      height: eng.detectionTree.getHeight(),
      size: eng.detectionTree.getSize(),
    });

    setSensors({ photodiode: eng.laserChamber.baseline, temperature: eng.tempSensor.temperature, turbidity: eng.turbiditySensor.voltage });
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
    setSimulationProgress({ phase: 'STARTING', current: 0, total: numSamples, running: true });
    await eng.runSimulation(numSamples, (log: SimLog) => {
      if (log.type === 'progress') {
        setSimulationProgress(log.data as { phase: string; current: number; total: number; running: boolean });
      } else if (log.type === 'sampleResult') {
        setSimResults(prev => [...prev, log.data as SimSampleResult]);
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

  const demoEventDeleteById = useCallback((id: number) => {
    engineRef.current.eventHistory.deleteByID(id);
    syncEngineState();
  }, [syncEngineState]);

  const demoSlidingWindowAdd = useCallback((v: number) => {
    engineRef.current.simulationTime += 0.5;
    engineRef.current.slidingWindow.insert(new SR(engineRef.current.simulationTime, v, 'PHOTODIODE', true));
    syncEngineState();
  }, [syncEngineState]);

  const demoCalibPush = useCallback((b: number, t: number) => {
    engineRef.current.simulationTime += 1;
    engineRef.current.calibrationStack.push({ baseline: b, threshold: t, correction: 1.0, timestamp: engineRef.current.simulationTime, description: `Calibration #${engineRef.current.calibrationStack.getSize() + 1}` });
    syncEngineState();
  }, [syncEngineState]);

  const demoCalibUndo = useCallback(() => {
    engineRef.current.calibrationStack.undo();
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

  const demoBSTInsert = useCallback((ts: number, drop: number) => {
    const evt = new MicroplasticEvent(ts, drop, 3.0, 2.0, 25.0);
    engineRef.current.detectionTree.insert(evt);
    engineRef.current.eventHistory.append(evt);
    syncEngineState();
  }, [syncEngineState]);

  const demoBSTClear = useCallback(() => {
    engineRef.current.detectionTree.clear();
    syncEngineState();
  }, [syncEngineState]);

  const demoBSTSearch = useCallback((ts: number): MicroplasticEvent | null => {
    return engineRef.current.detectionTree.search(ts);
  }, []);

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
      switch (msg.type) {
        case 'sensor':
          setSensors({ photodiode: msg.photodiode ?? 0, temperature: msg.temperature ?? 25, turbidity: msg.turbidity ?? 0 });
          if (msg.photodiode) setVoltageHistory(prev => [...prev.slice(-99), { ts: msg.ts ?? Date.now() / 1000, v: msg.photodiode }]);
          break;
        case 'detection':
          setDetections(prev => [...prev, msg as DetectionEvent]);
          setBstData(prev => ({
            ...prev,
            inorder: [...prev.inorder, msg as DetectionEvent],
            preorder: [...prev.preorder, msg as DetectionEvent],
            size: (prev.size || 0) + 1,
            height: Math.max(1, Math.ceil(Math.log2((prev.size || 0) + 2))),
          }));
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
        case 'sensorReading':
          setSensorLog(prev => [...prev, msg as SensorReading]);
          setVoltageHistory(prev => [...prev.slice(-99), { ts: msg.timestamp, v: msg.voltage }]);
          setCircularBuffer(prev => {
            const nextSlots = [...prev.slots, msg as SensorReading].slice(-10);
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
        case 'sortResult':
          setSortResults(prev => [...prev, msg as SortResult]);
          break;
        case 'status':
          setSystemStatus(msg as SystemStatus);
          setSensors({ photodiode: msg.photodiode ?? 0, temperature: msg.temperature ?? 25, turbidity: msg.turbidityVoltage ?? 0 });
          if (msg.slidingWindowSize !== undefined) {
            setCircularBuffer(prev => ({ ...prev, used: msg.slidingWindowSize, capacity: msg.slidingWindowCap ?? 10 }));
          }
          if (msg.bstSize !== undefined) {
            setBstData(prev => ({ ...prev, size: msg.bstSize, height: msg.bstHeight ?? prev.height }));
          }
          break;
        case 'simProgress':
          if (msg.phase === 'CALIBRATING' || msg.current === 0) {
            setSimResults([]);
          }
          setSimulationProgress(msg);
          break;
        case 'searchResult':
          setSearchResult(msg);
          break;
        case 'calibState':
          if (msg.action === 'push') {
            setCalibrationStack(prev => [{
              baseline: msg.baseline ?? 3.0,
              threshold: msg.threshold ?? 2.5,
              correction: 1.0,
              timestamp: msg.timestamp ?? Date.now() / 1000,
              description: msg.desc ?? 'Hardware Snapshot'
            }, ...prev]);
          } else if (msg.action === 'undo') {
            setCalibrationStack(prev => prev.slice(1));
          }
          break;
        case 'sensorLogAction':
          if (msg.action === 'deleteFirst') {
            setSensorLog(prev => prev.slice(1));
          } else if (msg.action === 'deleteLast') {
            setSensorLog(prev => prev.slice(0, -1));
          }
          break;
        case 'eventAction':
          if (msg.action === 'deleteById' && msg.id !== undefined) {
            setDetections(prev => prev.filter(e => e.id !== msg.id));
            setBstData(prev => ({
              ...prev,
              inorder: prev.inorder.filter(e => e.id !== msg.id),
              preorder: prev.preorder.filter(e => e.id !== msg.id),
              size: Math.max(0, prev.size - 1),
            }));
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
        ws.send(JSON.stringify({ cmd: 'status' }));
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
      sensors, detections, alerts, sensorLog, calibrationStack, sortResults,
      systemStatus, voltageHistory, circularBuffer, bstData, simulationProgress,
      searchResult, simResults, engine: engineRef.current,
      runDemoSimulation, resetDemoSimulation,
      demoSensorLogAppend, demoSensorLogInsertHead, demoSensorLogDeleteFirst, demoSensorLogDeleteLast,
      demoEventDeleteById, demoSlidingWindowAdd,
      demoCalibPush, demoCalibUndo,
      demoAlertAdd, demoAlertProcessOne, demoAlertProcessAll,
      demoBSTInsert, demoBSTClear, demoBSTSearch, demoSort,
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
