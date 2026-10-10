// ============================================================
//  SimulationEngine.ts
//  TypeScript port of C++ DSA data structures
//  from MicroplasticDetector/ — runs in the browser for demo mode
// ============================================================

// ============================================================
//  SensorReading — Class with encapsulation
// ============================================================
export class SensorReading {
  constructor(
    public timestamp: number = 0,
    public voltage: number = 0,
    public sensorType: string = 'UNKNOWN',
    public valid: boolean = true
  ) {}
}

// ============================================================
//  MicroplasticEvent — Auto-classifies severity
// ============================================================
let nextEventID = 1;
export class MicroplasticEvent {
  eventID: number;
  timestamp: number;
  voltageDrop: number;
  baselineVoltage: number;
  duration: number;
  waterTemperature: number;
  severity: string;

  constructor(ts: number, drop: number, baseline: number, dur: number, temp: number) {
    this.eventID = nextEventID++;
    this.timestamp = ts;
    this.voltageDrop = drop;
    this.baselineVoltage = baseline;
    this.duration = dur;
    this.waterTemperature = temp;
    const dropPercent = (drop / baseline) * 100;
    this.severity = dropPercent > 20 ? 'HIGH' : dropPercent > 10 ? 'MEDIUM' : 'LOW';
  }

  confidence(): number {
    const dropRatio = this.voltageDrop / this.baselineVoltage;
    const durationFactor = this.duration < 5 ? 1.0 : 5.0 / this.duration;
    return dropRatio * 70 + durationFactor * 30;
  }
}

// ============================================================
//  SensorLinkedList — SINGLY LINKED LIST
//  DSA: O(1) append, O(n) delete from end, pointer traversal
// ============================================================
class SensorNode {
  data: SensorReading;
  next: SensorNode | null = null;
  constructor(reading: SensorReading) { this.data = reading; }
}

export class SensorLinkedList {
  private head: SensorNode | null = null;
  private tail: SensorNode | null = null;
  private _size: number = 0;

  append(reading: SensorReading): void {
    const newNode = new SensorNode(reading);
    if (this.head === null) { this.head = newNode; this.tail = newNode; }
    else { this.tail!.next = newNode; this.tail = newNode; }
    this._size++;
  }

  insertAtBeginning(reading: SensorReading): void {
    const newNode = new SensorNode(reading);
    newNode.next = this.head;
    this.head = newNode;
    if (this.tail === null) this.tail = newNode;
    this._size++;
  }

  deleteFromBeginning(): boolean {
    if (this.head === null) return false;
    this.head = this.head.next;
    if (this.head === null) this.tail = null;
    this._size--;
    return true;
  }

  deleteFromEnd(): boolean {
    if (this.head === null) return false;
    if (this.head === this.tail) { this.head = null; this.tail = null; this._size = 0; return true; }
    let current = this.head;
    while (current.next !== this.tail) current = current.next!;
    current.next = null;
    this.tail = current;
    this._size--;
    return true;
  }

  deleteAtPosition(index: number): boolean {
    if (index < 0 || index >= this._size || this.head === null) return false;
    if (index === 0) return this.deleteFromBeginning();
    if (index === this._size - 1) return this.deleteFromEnd();
    let current = this.head;
    for (let i = 0; i < index - 1; i++) current = current.next!;
    current.next = current.next!.next;
    this._size--;
    return true;
  }

  toArray(): SensorReading[] {
    const arr: SensorReading[] = [];
    let current = this.head;
    while (current !== null) { arr.push(current.data); current = current.next; }
    return arr;
  }

  countValid(): number {
    let count = 0;
    let current = this.head;
    while (current !== null) { if (current.data.valid) count++; current = current.next; }
    return count;
  }

  getSize(): number { return this._size; }
  isEmpty(): boolean { return this.head === null; }
}

// ============================================================
//  CircularBuffer — CIRCULAR LINKED LIST (Sliding Window)
//  DSA: Ring buffer, O(1) overwrite oldest, moving average
// ============================================================
class CircularNode {
  data: SensorReading;
  next: CircularNode | null = null;
  constructor(reading: SensorReading) { this.data = reading; }
}

export class CircularBuffer {
  private tail: CircularNode | null = null;
  private capacity: number;
  private _size: number = 0;

  constructor(cap: number = 10) { this.capacity = cap; }

  insert(reading: SensorReading): void {
    if (this._size === 0) {
      const n = new CircularNode(reading); n.next = n; this.tail = n; this._size++;
    } else if (this._size < this.capacity) {
      const n = new CircularNode(reading); n.next = this.tail!.next; this.tail!.next = n; this.tail = n; this._size++;
    } else {
      // FULL: overwrite oldest (head = tail.next)
      const oldHead = this.tail!.next!;
      oldHead.data = reading;
      this.tail = oldHead; // advance tail → old head becomes new tail
    }
  }

  getSlots(): SensorReading[] {
    if (!this.tail) return [];
    const arr: SensorReading[] = [];
    let current = this.tail.next!; // head
    for (let i = 0; i < this._size; i++) { arr.push(current.data); current = current.next!; }
    return arr;
  }

  getMovingAverage(): number {
    if (this._size === 0) return 0;
    const slots = this.getSlots();
    return slots.reduce((sum, s) => sum + s.voltage, 0) / this._size;
  }

  getMin(): number {
    const slots = this.getSlots();
    return slots.length === 0 ? 0 : Math.min(...slots.map(s => s.voltage));
  }

  getMax(): number {
    const slots = this.getSlots();
    return slots.length === 0 ? 0 : Math.max(...slots.map(s => s.voltage));
  }

  getSize(): number { return this._size; }
  getCapacity(): number { return this.capacity; }
  isFull(): boolean { return this._size === this.capacity; }
}

// ============================================================
//  AlertQueue — FIFO QUEUE + PRIORITY QUEUE
//  DSA: FIFO dequeue, Priority 1 (critical) jumps to front
// ============================================================
export interface Alert {
  type: string;
  message: string;
  timestamp: number;
  priority: number; // 1=CRITICAL, 2=ERROR, 3=WARNING, 4=INFO
}

class QueueNode {
  data: Alert;
  next: QueueNode | null = null;
  constructor(alert: Alert) { this.data = alert; }
}

export class AlertQueue {
  private front: QueueNode | null = null;
  private rear: QueueNode | null = null;
  private _size: number = 0;

  enqueue(alert: Alert): void {
    const n = new QueueNode(alert);
    if (!this.rear) { this.front = n; this.rear = n; }
    else { this.rear.next = n; this.rear = n; }
    this._size++;
  }

  enqueuePriority(alert: Alert): void {
    const n = new QueueNode(alert);
    if (!this.front || alert.priority < this.front.data.priority) {
      n.next = this.front; this.front = n;
      if (!this.rear) this.rear = n;
      this._size++; return;
    }
    let current = this.front;
    while (current.next && current.next.data.priority <= alert.priority) current = current.next;
    n.next = current.next; current.next = n;
    if (!n.next) this.rear = n;
    this._size++;
  }

  dequeue(): Alert | null {
    if (!this.front) return null;
    const alert = this.front.data;
    this.front = this.front.next;
    if (!this.front) this.rear = null;
    this._size--;
    return alert;
  }

  toArray(): Alert[] {
    const arr: Alert[] = []; let c = this.front;
    while (c) { arr.push(c.data); c = c.next; }
    return arr;
  }

  getSize(): number { return this._size; }
  isEmpty(): boolean { return !this.front; }
}

// ============================================================
//  Sorting Algorithms — on SensorReading arrays
// ============================================================
export function bubbleSort(arr: SensorReading[]): SensorReading[] {
  const a = arr.map(r => new SensorReading(r.timestamp, r.voltage, r.sensorType, r.valid));
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < a.length - i - 1; j++)
      if (a[j].voltage > a[j + 1].voltage) [a[j], a[j + 1]] = [a[j + 1], a[j]];
  return a;
}

export function selectionSort(arr: SensorReading[]): SensorReading[] {
  const a = arr.map(r => new SensorReading(r.timestamp, r.voltage, r.sensorType, r.valid));
  for (let i = 0; i < a.length - 1; i++) {
    let m = i; for (let j = i + 1; j < a.length; j++) if (a[j].voltage < a[m].voltage) m = j;
    if (m !== i) [a[i], a[m]] = [a[m], a[i]];
  }
  return a;
}

export function insertionSort(arr: SensorReading[]): SensorReading[] {
  const a = arr.map(r => new SensorReading(r.timestamp, r.voltage, r.sensorType, r.valid));
  for (let i = 1; i < a.length; i++) {
    const key = a[i]; let j = i - 1;
    while (j >= 0 && a[j].voltage > key.voltage) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
  }
  return a;
}

export function mergeSort(arr: SensorReading[]): SensorReading[] {
  const a = arr.map(r => new SensorReading(r.timestamp, r.voltage, r.sensorType, r.valid));
  mergeSortHelper(a, 0, a.length - 1);
  return a;
}

function mergeSortHelper(a: SensorReading[], l: number, r: number): void {
  if (l >= r) return;
  const m = Math.floor((l + r) / 2);
  mergeSortHelper(a, l, m); mergeSortHelper(a, m + 1, r);
  const left = a.slice(l, m + 1), right = a.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length)
    if (left[i].voltage <= right[j].voltage) { a[k++] = left[i++]; } else { a[k++] = right[j++]; }
  while (i < left.length) a[k++] = left[i++];
  while (j < right.length) a[k++] = right[j++];
}

export function quickSort(arr: SensorReading[]): SensorReading[] {
  const a = arr.map(r => new SensorReading(r.timestamp, r.voltage, r.sensorType, r.valid));
  quickSortHelper(a, 0, a.length - 1);
  return a;
}

function quickSortHelper(a: SensorReading[], lo: number, hi: number): void {
  if (lo >= hi) return;
  const pivot = a[hi].voltage; let i = lo - 1;
  for (let j = lo; j < hi; j++) if (a[j].voltage <= pivot) { i++; [a[i], a[j]] = [a[j], a[i]]; }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
  quickSortHelper(a, lo, i); quickSortHelper(a, i + 2, hi);
}

// ============================================================
//  TurbiditySensor — Simulates hardware
// ============================================================
export class TurbiditySensor {
  voltage: number = 0;
  threshold: number = 2.5;
  rejected: number = 0;

  read(): number {
    if (Math.random() < 0.15)
      this.voltage = 1.0 + Math.random() * 1.2; // muddy
    else
      this.voltage = 2.7 + Math.random() * 0.5; // clear
    return this.voltage;
  }

  isClear(): boolean { return this.voltage >= this.threshold; }

  validate(): boolean {
    this.read();
    if (!this.isClear()) { this.rejected++; return false; }
    return true;
  }
}

// ============================================================
//  TemperatureSensor
// ============================================================
export class TemperatureSensor {
  temperature: number = 25.0;
  referenceTemp: number = 25.0;
  correctionFactor: number = 1.0;

  read(): number {
    this.temperature = 15.0 + Math.random() * 20;
    this.correctionFactor = 1.0 - ((this.temperature - this.referenceTemp) * 0.001);
    return this.temperature;
  }

  correctBaseline(raw: number): number { return raw * this.correctionFactor; }
}

// ============================================================
//  LaserChamber — simulates photodiode readings
// ============================================================
export class LaserChamber {
  baseline: number = 3.0;
  detectionThreshold: number = 0.15;
  laserOn: boolean = false;
  detectionCount: number = 0;

  activate(): void { this.laserOn = true; }
  deactivate(): void { this.laserOn = false; }

  calibrate(corrected: number): void { this.baseline = corrected; }

  takeReading(timestamp: number): SensorReading {
    if (!this.laserOn) return new SensorReading(timestamp, 0, 'PHOTODIODE');
    let voltage: number;
    if (Math.random() < 0.20) {
      const drop = 0.15 + Math.random() * 0.65;
      voltage = this.baseline - drop;
    } else {
      const noise = (Math.random() * 10 - 5) / 100;
      voltage = this.baseline + noise;
    }
    return new SensorReading(timestamp, voltage, 'PHOTODIODE');
  }

  analyze(reading: SensorReading, waterTemp: number): MicroplasticEvent | null {
    const drop = this.baseline - reading.voltage;
    if (drop >= this.detectionThreshold) {
      this.detectionCount++;
      const duration = +(2.0 + Math.random() * 3.0).toFixed(1);
      return new MicroplasticEvent(reading.timestamp, drop, this.baseline, duration, waterTemp);
    }
    return null;
  }
}

// ============================================================
//  SimulationEngine — Orchestrates the full pipeline
//  This is the main class that ties everything together
// ============================================================
export interface SimLog {
  type: 'sensor' | 'detection' | 'alert' | 'status' | 'progress' | 'sampleResult';
  data: any;
}

export class SimulationEngine {
  sensorLog = new SensorLinkedList();
  slidingWindow = new CircularBuffer(10);
  alertQueue = new AlertQueue();

  turbiditySensor = new TurbiditySensor();
  tempSensor = new TemperatureSensor();
  laserChamber = new LaserChamber();

  simulationTime = 0;
  pumpRunning = false;

  constructor() {
    this.reset();
    this.seedDefaultData();
  }

  // Pre-seed initial 10 baseline samples with one transient optical drop
  seedDefaultData(): void {
    const defaultVoltages = [2.98, 3.02, 2.42, 3.00, 3.05, 3.00, 3.02, 2.75, 2.98, 3.03];
    for (let i = 0; i < defaultVoltages.length; i++) {
      const ts = +((i + 1) * 0.1).toFixed(1);
      const reading = new SensorReading(ts, defaultVoltages[i], 'PHOTODIODE', true);
      this.sensorLog.append(reading);
      this.slidingWindow.insert(reading);
    }
    this.simulationTime = 1.0;
  }

  // Reset all data structures to fresh, clean initial boot state
  reset(): void {
    this.sensorLog = new SensorLinkedList();
    this.slidingWindow = new CircularBuffer(10);
    this.alertQueue = new AlertQueue();

    this.turbiditySensor = new TurbiditySensor();
    this.tempSensor = new TemperatureSensor();
    this.laserChamber = new LaserChamber();

    this.simulationTime = 0;
    this.pumpRunning = false;
  }

  // Run the full simulation, calling onLog for each event
  async runSimulation(numSamples: number, onLog: (log: SimLog) => void): Promise<void> {
    this.reset();

    // Phase 1: Calibrate
    onLog({ type: 'progress', data: { phase: 'CALIBRATING', current: 0, total: numSamples, running: true } });

    const waterTemp = this.tempSensor.read();
    const corrected = this.tempSensor.correctBaseline(3.0);
    this.laserChamber.calibrate(corrected);

    // Phase 2: Start hardware
    this.pumpRunning = true;
    this.laserChamber.activate();
    onLog({ type: 'progress', data: { phase: 'PROCESSING', current: 0, total: numSamples, running: true } });

    // Phase 3: Process samples
    for (let i = 0; i < numSamples; i++) {
      this.simulationTime += 0.5;

      // Turbidity check
      const clear = this.turbiditySensor.validate();
      if (!clear) {
        const turbR = new SensorReading(this.simulationTime, this.turbiditySensor.voltage, 'TURBIDITY', false);
        this.sensorLog.append(turbR);
        onLog({ type: 'sensor', data: { timestamp: turbR.timestamp, voltage: turbR.voltage, sensorType: 'TURBIDITY', valid: false } });

        const alert: Alert = { type: 'ERROR', message: `Sample #${i + 1} rejected — Turbidity ${this.turbiditySensor.voltage.toFixed(2)}V`, timestamp: this.simulationTime, priority: 2 };
        this.alertQueue.enqueuePriority(alert);
        onLog({ type: 'alert', data: alert });
        onLog({ type: 'sampleResult', data: { type: 'rejected', ts: this.simulationTime, voltage: this.turbiditySensor.voltage } });

        // Emergency shutoff + restart
        this.pumpRunning = false;
        this.pumpRunning = true;
      } else {
        // Laser reading
        const reading = this.laserChamber.takeReading(this.simulationTime);
        reading.valid = true;
        this.sensorLog.append(reading);
        this.slidingWindow.insert(reading);
        onLog({ type: 'sensor', data: { timestamp: reading.timestamp, voltage: reading.voltage, sensorType: 'PHOTODIODE', valid: true } });

        // Analyze for microplastics
        const event = this.laserChamber.analyze(reading, waterTemp);
        if (event) {
          onLog({ type: 'detection', data: {
            id: event.eventID, timestamp: event.timestamp, voltageDrop: event.voltageDrop,
            baseline: event.baselineVoltage, severity: event.severity, confidence: event.confidence()
          }});

          const alert: Alert = { type: 'INFO', message: `Microplastic detected! Drop: ${event.voltageDrop.toFixed(2)}V (${event.severity})`, timestamp: this.simulationTime, priority: 4 };
          this.alertQueue.enqueue(alert);
          onLog({ type: 'alert', data: alert });
          onLog({ type: 'sampleResult', data: {
            type: 'detection', ts: event.timestamp, drop: event.voltageDrop,
            severity: event.severity, confidence: event.confidence(), voltage: reading.voltage
          }});
        } else {
          onLog({ type: 'sampleResult', data: { type: 'clear', ts: reading.timestamp, voltage: reading.voltage } });
        }
      }

      onLog({ type: 'progress', data: { phase: 'PROCESSING', current: i + 1, total: numSamples, running: true } });
      onLog({ type: 'status', data: this.getStatus() });

      await new Promise(resolve => setTimeout(resolve, 350)); // Visible animation interval
    }

    // Shutdown
    this.pumpRunning = false;
    this.laserChamber.deactivate();
    onLog({ type: 'progress', data: { phase: 'DONE', current: numSamples, total: numSamples, running: false } });
    onLog({ type: 'status', data: this.getStatus() });
  }

  getStatus(): Record<string, unknown> {
    return {
      pump: this.pumpRunning ? 'RUNNING' : 'OFF',
      laser: this.laserChamber.laserOn ? 'ON' : 'OFF',
      turbidityVoltage: this.turbiditySensor.voltage,
      temperature: this.tempSensor.temperature,
      photodiode: this.laserChamber.baseline,
      detections: this.laserChamber.detectionCount,
      freeHeap: 280000, // simulated
      simTime: this.simulationTime,
      sensorLogSize: this.sensorLog.getSize(),
      slidingWindowSize: this.slidingWindow.getSize(),
      slidingWindowCap: this.slidingWindow.getCapacity(),
      alertQueueSize: this.alertQueue.getSize(),
    };
  }
}
