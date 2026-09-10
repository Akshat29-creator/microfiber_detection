// ============================================================
//  SimulationEngine.ts
//  TypeScript port of ALL C++ DSA data structures
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
    this._size--;
    if (this.head === null) this.tail = null;
    return true;
  }

  deleteFromEnd(): boolean {
    if (this.head === null) return false;
    if (this.head === this.tail) {
      this.head = null; this.tail = null; this._size--; return true;
    }
    let current = this.head;
    while (current.next !== this.tail) current = current.next!;
    this.tail = current; this.tail.next = null; this._size--;
    return true;
  }

  toArray(): SensorReading[] {
    const arr: SensorReading[] = [];
    let current = this.head;
    while (current !== null) { arr.push(current.data); current = current.next; }
    return arr;
  }

  countByType(type: string): number {
    let count = 0; let current = this.head;
    while (current) { if (current.data.sensorType === type) count++; current = current.next; }
    return count;
  }

  countValid(): number {
    let count = 0; let current = this.head;
    while (current) { if (current.data.valid) count++; current = current.next; }
    return count;
  }

  getSize(): number { return this._size; }
  isEmpty(): boolean { return this.head === null; }
}

// ============================================================
//  EventDoublyList — DOUBLY LINKED LIST
//  DSA: Forward/reverse traversal, O(n) delete by ID
// ============================================================
class EventNode {
  data: MicroplasticEvent;
  next: EventNode | null = null;
  prev: EventNode | null = null;
  constructor(event: MicroplasticEvent) { this.data = event; }
}

export class EventDoublyList {
  private head: EventNode | null = null;
  private tail: EventNode | null = null;
  private _size: number = 0;

  append(event: MicroplasticEvent): void {
    const newNode = new EventNode(event);
    if (this.head === null) { this.head = newNode; this.tail = newNode; }
    else { newNode.prev = this.tail; this.tail!.next = newNode; this.tail = newNode; }
    this._size++;
  }

  deleteByID(id: number): boolean {
    let current = this.head;
    while (current) {
      if (current.data.eventID === id) {
        if (current.prev) current.prev.next = current.next; else this.head = current.next;
        if (current.next) current.next.prev = current.prev; else this.tail = current.prev;
        this._size--;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  forwardTraversal(): MicroplasticEvent[] {
    const arr: MicroplasticEvent[] = []; let current = this.head;
    while (current) { arr.push(current.data); current = current.next; }
    return arr;
  }

  reverseTraversal(): MicroplasticEvent[] {
    const arr: MicroplasticEvent[] = []; let current = this.tail;
    while (current) { arr.push(current.data); current = current.prev; }
    return arr;
  }

  countBySeverity(sev: string): number {
    let count = 0; let c = this.head;
    while (c) { if (c.data.severity === sev) count++; c = c.next; }
    return count;
  }

  getSize(): number { return this._size; }
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
    return slots.reduce((s, r) => s + r.voltage, 0) / this._size;
  }

  getSize(): number { return this._size; }
  getCapacity(): number { return this.capacity; }
}

// ============================================================
//  AlertQueue — QUEUE (FIFO) with Priority Insertion
//  DSA: Enqueue O(1), Priority insert O(n), Dequeue O(1)
// ============================================================
export interface Alert {
  type: string; message: string; timestamp: number; priority: number;
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
//  CalibrationStack — STACK (LIFO)
//  DSA: Push/Pop O(1), Undo operation
// ============================================================
export interface CalibrationState {
  baseline: number; threshold: number; correction: number; timestamp: number; description: string;
}

class StackNode {
  data: CalibrationState;
  next: StackNode | null = null;
  constructor(state: CalibrationState) { this.data = state; }
}

export class CalibrationStack {
  private top: StackNode | null = null;
  private _size: number = 0;

  push(state: CalibrationState): void {
    const n = new StackNode(state); n.next = this.top; this.top = n; this._size++;
  }

  pop(): CalibrationState | null {
    if (!this.top) return null;
    const state = this.top.data; this.top = this.top.next; this._size--;
    return state;
  }

  peek(): CalibrationState | null { return this.top ? this.top.data : null; }

  undo(): CalibrationState | null {
    if (this._size < 2) return this.peek();
    this.pop();
    return this.peek();
  }

  toArray(): CalibrationState[] {
    const arr: CalibrationState[] = []; let c = this.top;
    while (c) { arr.push(c.data); c = c.next; }
    return arr;
  }

  getSize(): number { return this._size; }
}

// ============================================================
//  DetectionBST — BINARY SEARCH TREE
//  DSA: O(log n) insert/search, inorder/preorder/postorder
// ============================================================
class BSTNode {
  data: MicroplasticEvent;
  left: BSTNode | null = null;
  right: BSTNode | null = null;
  constructor(event: MicroplasticEvent) { this.data = event; }
}

export class DetectionBST {
  private root: BSTNode | null = null;
  private _size: number = 0;

  insert(event: MicroplasticEvent): void {
    this.root = this._insert(this.root, event); this._size++;
  }

  private _insert(node: BSTNode | null, event: MicroplasticEvent): BSTNode {
    if (!node) return new BSTNode(event);
    if (event.timestamp < node.data.timestamp) node.left = this._insert(node.left, event);
    else node.right = this._insert(node.right, event);
    return node;
  }

  search(timestamp: number): MicroplasticEvent | null {
    return this._search(this.root, timestamp);
  }

  private _search(node: BSTNode | null, ts: number): MicroplasticEvent | null {
    if (!node) return null;
    if (Math.abs(ts - node.data.timestamp) < 0.01) return node.data;
    if (ts < node.data.timestamp) return this._search(node.left, ts);
    return this._search(node.right, ts);
  }

  inorder(): MicroplasticEvent[] {
    const arr: MicroplasticEvent[] = []; this._inorder(this.root, arr); return arr;
  }
  private _inorder(node: BSTNode | null, arr: MicroplasticEvent[]): void {
    if (!node) return; this._inorder(node.left, arr); arr.push(node.data); this._inorder(node.right, arr);
  }

  preorder(): MicroplasticEvent[] {
    const arr: MicroplasticEvent[] = []; this._preorder(this.root, arr); return arr;
  }
  private _preorder(node: BSTNode | null, arr: MicroplasticEvent[]): void {
    if (!node) return; arr.push(node.data); this._preorder(node.left, arr); this._preorder(node.right, arr);
  }

  postorder(): MicroplasticEvent[] {
    const arr: MicroplasticEvent[] = []; this._postorder(this.root, arr); return arr;
  }
  private _postorder(node: BSTNode | null, arr: MicroplasticEvent[]): void {
    if (!node) return; this._postorder(node.left, arr); this._postorder(node.right, arr); arr.push(node.data);
  }

  getHeight(): number { return this._height(this.root); }
  private _height(node: BSTNode | null): number {
    if (!node) return -1; return 1 + Math.max(this._height(node.left), this._height(node.right));
  }

  rangeSearch(start: number, end: number): MicroplasticEvent[] {
    const arr: MicroplasticEvent[] = []; this._rangeSearch(this.root, start, end, arr); return arr;
  }
  private _rangeSearch(node: BSTNode | null, s: number, e: number, arr: MicroplasticEvent[]): void {
    if (!node) return;
    if (s < node.data.timestamp) this._rangeSearch(node.left, s, e, arr);
    if (node.data.timestamp >= s && node.data.timestamp <= e) arr.push(node.data);
    if (e > node.data.timestamp) this._rangeSearch(node.right, s, e, arr);
  }

  getSize(): number { return this._size; }

  clear(): void {
    this.root = null;
    this._size = 0;
  }
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
  const L = a.slice(l, m + 1), R = a.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < L.length && j < R.length) a[k++] = L[i].voltage <= R[j].voltage ? L[i++] : R[j++];
  while (i < L.length) a[k++] = L[i++];
  while (j < R.length) a[k++] = R[j++];
}

export function quickSort(arr: SensorReading[]): SensorReading[] {
  const a = arr.map(r => new SensorReading(r.timestamp, r.voltage, r.sensorType, r.valid));
  quickSortHelper(a, 0, a.length - 1);
  return a;
}

function quickSortHelper(a: SensorReading[], lo: number, hi: number): void {
  if (lo >= hi) return;
  const p = a[hi].voltage; let i = lo - 1;
  for (let j = lo; j < hi; j++) if (a[j].voltage <= p) { i++; [a[i], a[j]] = [a[j], a[i]]; }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
  quickSortHelper(a, lo, i); quickSortHelper(a, i + 2, hi);
}

// ============================================================
//  Searching Algorithms
// ============================================================
export function linearSearchBelow(arr: SensorReading[], threshold: number): { index: number; reading: SensorReading } | null {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].voltage < threshold) return { index: i, reading: arr[i] };
  }
  return null;
}

export function linearSearchAllBelow(arr: SensorReading[], threshold: number): { index: number; reading: SensorReading }[] {
  const results: { index: number; reading: SensorReading }[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].voltage < threshold) results.push({ index: i, reading: arr[i] });
  }
  return results;
}

export function binarySearchByVoltage(sortedArr: SensorReading[], target: number): { index: number; reading: SensorReading; comparisons: number } | null {
  let lo = 0, hi = sortedArr.length - 1, comparisons = 0;
  let closest = -1, closestDiff = Infinity;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2); comparisons++;
    const diff = Math.abs(sortedArr[mid].voltage - target);
    if (diff < closestDiff) { closestDiff = diff; closest = mid; }
    if (diff < 0.01) return { index: mid, reading: sortedArr[mid], comparisons };
    if (sortedArr[mid].voltage < target) lo = mid + 1; else hi = mid - 1;
  }
  if (closest >= 0) return { index: closest, reading: sortedArr[closest], comparisons };
  return null;
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
      const duration = 1.0 + Math.random() * 9;
      this.detectionCount++;
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
  eventHistory = new EventDoublyList();
  slidingWindow = new CircularBuffer(10);
  alertQueue = new AlertQueue();
  calibrationStack = new CalibrationStack();
  detectionTree = new DetectionBST();

  turbiditySensor = new TurbiditySensor();
  tempSensor = new TemperatureSensor();
  laserChamber = new LaserChamber();

  simulationTime = 0;
  pumpRunning = false;

  constructor() {
    this.reset();
  }

  // Reset all data structures to fresh, clean initial boot state
  reset(): void {
    this.sensorLog = new SensorLinkedList();
    this.eventHistory = new EventDoublyList();
    this.slidingWindow = new CircularBuffer(10);
    this.alertQueue = new AlertQueue();
    this.calibrationStack = new CalibrationStack();
    this.detectionTree = new DetectionBST();

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
    this.calibrationStack.push({
      baseline: corrected, threshold: this.turbiditySensor.threshold,
      correction: this.tempSensor.correctionFactor, timestamp: this.simulationTime, description: `Run Calib #${this.calibrationStack.getSize() + 1}`
    });

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
          this.eventHistory.append(event);
          this.detectionTree.insert(event);
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
      eventHistorySize: this.eventHistory.getSize(),
      slidingWindowSize: this.slidingWindow.getSize(),
      slidingWindowCap: this.slidingWindow.getCapacity(),
      alertQueueSize: this.alertQueue.getSize(),
      calibStackSize: this.calibrationStack.getSize(),
      bstSize: this.detectionTree.getSize(),
      bstHeight: this.detectionTree.getHeight(),
    };
  }
}
