# 🔬 Complete Feature Analysis — Microplastic Detection System
### Every Feature, Every Hardware Sensor, Every DSA Pattern, and How They All Connect

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [How Readings Are Taken (Hardware Sensors)](#2-how-readings-are-taken-hardware-sensors)
3. [How Readings Flow Through DSA Patterns](#3-how-readings-flow-through-dsa-patterns)
4. [Deep Dive: Every DSA Structure & What It Does With Readings](#4-deep-dive-every-dsa-structure--what-it-does-with-readings)
5. [Backend (C++ & ESP32 Firmware) — Feature-by-Feature](#5-backend-c--esp32-firmware--feature-by-feature)
6. [Frontend (Next.js Dashboard) — Feature-by-Feature](#6-frontend-nextjs-dashboard--feature-by-feature)
7. [How Each Hardware Sensor Is Detected & Read](#7-how-each-hardware-sensor-is-detected--read)
8. [What You Can Modify & Customize](#8-what-you-can-modify--customize)
9. [Full Data Flow Diagram](#9-full-data-flow-diagram)

---

## 1. System Architecture Overview

The project has **three independent runtimes** that all share the same DSA logic:

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Desktop C++ CLI** | Pure C++17 ([`main.cpp`](file:///d:/kirti_project/MicroplasticDetector/main.cpp)) | Offline simulation & DSA testing on a PC terminal |
| **ESP32 Embedded Firmware** | Arduino C++ ([`MicroplasticDetectorESP32_WiFi.ino`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/MicroplasticDetectorESP32_WiFi.ino)) | Reads **real hardware ADC pins**, runs DSA on-chip, serves WebSocket on port 81 |
| **Next.js Web Dashboard** | TypeScript/React ([`dashboard/`](file:///d:/kirti_project/dashboard)) | Browser UI with live charts, either **Demo mode** (simulates in JS) or **Real mode** (connects to ESP32 via WebSocket) |

```
 ┌──────────────────────┐      ┌────────────────────────────┐
 │   Desktop C++ CLI    │      │   ESP32 Microcontroller     │
 │  (Simulation Only)   │      │  (Real ADC Pins + WiFi)     │
 │                      │      │                              │
 │  rand() → voltage    │      │  analogRead(34) → voltage   │
 │  Sensor classes      │      │  Sensor classes              │
 │  8 DSA structures    │      │  8 DSA structures            │
 │  ASCII dashboard     │      │  WebSocket Server (:81)      │
 └──────────────────────┘      └──────────┬───────────────────┘
                                          │ ws://<IP>:81
                                          ▼
                               ┌──────────────────────────────┐
                               │  Next.js 16 Web Dashboard     │
                               │  Port 3000 (Demo) / 3001 (Real)│
                               │                                │
                               │  Demo: SimulationEngine.ts    │
                               │  Real: WebSocket client       │
                               │  Recharts live graphs         │
                               │  Interactive DSA pages        │
                               └──────────────────────────────┘
```

---

## 2. How Readings Are Taken (Hardware Sensors)

### 2.1 Turbidity Sensor (GPIO 34)

**Hardware:** Analog turbidity sensor probe → adapter board → ESP32 ADC1_CH6

**How it reads:**
```cpp
// ESP32 firmware — TurbiditySensor::readSensor()
int raw = analogRead(TURBIDITY_PIN);  // GPIO 34, 12-bit ADC → 0–4095
currentVoltage = (raw / 4095.0f) * 3.3f;  // Convert to 0–3.3V
```

**What the voltage means:**
| Voltage | Water Condition | System Action |
|:---|:---|:---|
| **≥ 2.50V** | Clear water | ✅ Sample approved, proceed to laser detection |
| **< 2.50V** | Muddy/turbid water | ❌ Emergency pump shutoff, sample rejected |

**Desktop simulation:** Uses `rand() % 100` — 15% chance of generating muddy voltage (1.0–3.0V), 85% clear (3.5–5.0V).

---

### 2.2 Photodiode + Laser Chamber (GPIO 35 read, GPIO 27 laser control)

**Hardware:** 650nm laser diode (GPIO 27) → water flow cell inside black PVC dark chamber → BPW34 photodiode → LM358 op-amp → ESP32 ADC1_CH7 (GPIO 35)

**How it reads:**
```cpp
// ESP32 firmware — LaserChamber::takeReading()
int raw = analogRead(PHOTODIODE_PIN);  // GPIO 35, 12-bit ADC
float voltage = (raw / 4095.0f) * 3.3f;
return SensorReading(timestamp, voltage, "PHOTODIODE");
```

**How laser is controlled:**
```cpp
void laserActivate() {
    digitalWrite(LASER_PIN, HIGH);  // GPIO 27 → HIGH → Laser ON
}
void laserDeactivate() {
    digitalWrite(LASER_PIN, LOW);   // GPIO 27 → LOW → Laser OFF
}
```

**Detection logic:**
```cpp
// LaserChamber::analyzeReading()
float drop = baselineVoltage - reading.getVoltage();
if (drop >= detectionThreshold) {  // default threshold = 0.15V
    // A microplastic particle scattered the laser beam!
    MicroplasticEvent* event = new MicroplasticEvent(
        timestamp, drop, baseline, durationMs, waterTemp
    );
    return event;  // POINTER returned to caller
}
return nullptr;    // No particle detected
```

**Desktop simulation:** 20% chance of a voltage drop (0.15V–0.80V below baseline); 80% chance of clear water with ±0.05V noise.

---

### 2.3 DS18B20 Temperature Sensor (GPIO 4)

**Hardware:** Waterproof stainless steel digital probe → 1-Wire protocol → GPIO 4 (with 4.7kΩ pull-up resistor to 3.3V)

**How it reads (zero external libraries — bit-banged 1-Wire):**
```cpp
// ESP32 firmware — custom OneWire driver
float readPhysicalDS18B20(int pin) {
    ds18b20Reset(pin);           // Send reset pulse (480µs LOW)
    ds18b20WriteByte(pin, 0xCC); // Skip ROM command
    ds18b20WriteByte(pin, 0x44); // Start temperature conversion
    delay(20);                    // Wait for conversion
    ds18b20Reset(pin);
    ds18b20WriteByte(pin, 0xCC);
    ds18b20WriteByte(pin, 0xBE); // Read scratchpad command
    uint8_t tempLSB = ds18b20ReadByte(pin);
    uint8_t tempMSB = ds18b20ReadByte(pin);
    int16_t rawTemp = (tempMSB << 8) | tempLSB;
    return (float)rawTemp / 16.0f;  // 12-bit resolution → °C
}
```

**Fallback cascade:**
1. Try DS18B20 digital 1-Wire probe → if valid (-55°C to +125°C), use it
2. Try analog LM35 sensor (10mV/°C) → if voltage 0.10V–1.50V, compute temp
3. If nothing detected → fall back to reference baseline 25.0°C

**What it does with the temperature:**
```cpp
// Temperature correction factor for optical baseline
correctionFactor = 1.0 - ((currentTemp - 25.0) * 0.001);
correctedBaseline = rawBaseline * correctionFactor;
```
Water refraction changes ~0.01 per 10°C. This adjusts the laser detection threshold so cold or warm water doesn't create false positives.

---

### 2.4 Peristaltic Pump + 5V Relay (GPIO 26)

**Hardware:** ESP32 GPIO 26 → 5V relay module (optocoupled) → 12V peristaltic pump

**How it's controlled:**
```cpp
void start() {
    digitalWrite(RELAY_PIN, HIGH);  // GPIO 26 HIGH → Relay closes → Pump runs
}
void stop() {
    digitalWrite(RELAY_PIN, LOW);   // GPIO 26 LOW → Relay opens → Pump stops
}
void emergencyShutoff(const String& reason) {
    digitalWrite(RELAY_PIN, LOW);   // Immediate halt
    // Triggered by turbidity failsafe
}
```

**State machine:** `PUMP_OFF` → `PUMP_RUNNING` → `PUMP_EMERGENCY_STOP` → `reset()` → `PUMP_OFF`

---

## 3. How Readings Flow Through DSA Patterns

Here is the **exact journey of one sensor reading** through every data structure:

```
 [SENSOR READING TAKEN]  (voltage + timestamp + sensorType)
         │
         ├──► 1. Singly Linked List (sensorLog.append)
         │         Sequential chronological log of ALL readings
         │
         ├──► 2. Circular Buffer (slidingWindow.insert)
         │         Last 10 readings → moving average noise filter
         │
         ├──(if voltage drop ≥ 0.15V detected)──►
         │         │
         │         ├──► 3. MicroplasticEvent created (severity classified)
         │         │
         │         ├──► 4. Doubly Linked List (eventHistory.append)
         │         │         Bidirectional detection event history
         │         │
         │         ├──► 5. Binary Search Tree (detectionTree.insert)
         │         │         Timestamp-indexed O(log n) lookup
         │         │
         │         └──► 6. Alert Queue (alertQueue.enqueue)
         │                   FIFO processing of notifications
         │
         └──(if turbidity too high)──►
                   │
                   ├──► 7. Alert Queue (alertQueue.enqueuePriority)
                   │         CRITICAL alert jumps to front
                   │
                   └──► 8. Pump emergency shutoff triggered
```

**Calibration changes** are stored on the **Calibration Stack** (LIFO) so the operator can undo/redo baseline adjustments.

**Sorting & Searching** are applied to copies of the sensorLog array when the user requests analysis.

---

## 4. Deep Dive: Every DSA Structure & What It Does With Readings

### 4.1 Singly Linked List — `SensorLinkedList` ([SensorLinkedList.h](file:///d:/kirti_project/MicroplasticDetector/SensorLinkedList.h))

**What it stores:** Every `SensorReading` (timestamp, voltage, sensorType, valid) in chronological order.

**Node structure:**
```cpp
struct SensorNode {
    SensorReading data;   // The reading
    SensorNode* next;     // POINTER → next node
};
```

**Operations & their complexities:**
| Operation | Method | Complexity | What it does |
|:---|:---|:---|:---|
| Append | `append()` | O(1) | New reading arrives → add at tail |
| Insert at head | `insertAtBeginning()` | O(1) | Manually inject a backdated reading |
| Insert at position | `insertAtPosition()` | O(n) | Insert at specific index |
| Delete from head | `deleteFromBeginning()` | O(1) | Remove oldest reading |
| Delete from tail | `deleteFromEnd()` | O(n) | Remove newest reading |
| Delete by timestamp | `deleteByTimestamp()` | O(n) | Remove a specific reading |
| Traverse all | `displayAll()` | O(n) | Print every reading in order |
| Convert to array | `toArray()` | O(n) | Extract array for sorting/searching |
| Count by type | `countByType("PHOTODIODE")` | O(n) | How many photodiode vs turbidity readings |

**How readings are used:** Every reading from every sensor (PHOTODIODE, TURBIDITY, TEMPERATURE) is appended here. It is the **master log** of all raw sensor data.

**How to modify:**
- Change the sensor type labels to add new sensors (e.g., `"pH"`, `"DO"`)
- Add `insertSorted()` to keep readings sorted by voltage instead of arrival time
- Add a `maxSize` field with automatic deletion of old readings when full

---

### 4.2 Doubly Linked List — `EventDoublyList` ([EventDoublyList.h](file:///d:/kirti_project/MicroplasticDetector/EventDoublyList.h))

**What it stores:** Only confirmed `MicroplasticEvent` detections (not raw readings).

**Node structure:**
```cpp
struct EventNode {
    MicroplasticEvent data;
    EventNode* next;   // → newer event
    EventNode* prev;   // → older event (DOUBLY LINKED!)
};
```

**Key difference from Singly LL:** The `prev` pointer enables **reverse traversal** — walk backwards from the most recent detection to see what happened before an alarm.

**Operations:**
| Operation | Method | What it does |
|:---|:---|:---|
| Forward traverse | `displayForward()` | Oldest → Newest (chronological) |
| **Reverse traverse** | `displayReverse()` | **Newest → Oldest** (review from alarm backwards) |
| Delete by event ID | `deleteByID(id)` | Mark a detection as false positive and remove it |
| Statistics | `displayStatistics()` | Count HIGH/MEDIUM/LOW severities, average confidence |

**How events are classified in `MicroplasticEvent`:**
```cpp
double dropPercent = (voltageDrop / baselineVoltage) * 100.0;
if (dropPercent > 20.0) severity = "HIGH";
else if (dropPercent > 10.0) severity = "MEDIUM";
else severity = "LOW";
```

**Confidence formula:**
```
confidence = (voltageDrop / baseline) × 70 + durationFactor × 30
// Where durationFactor = min(1.0, 5.0 / duration)
// Shorter dip + bigger drop = higher confidence it's a real particle
```

**How to modify:**
- Change the severity thresholds (20%, 10%) to tune detection sensitivity
- Add a `"CRITICAL"` severity level for drops > 30%
- Add a `filterBySeverity("HIGH")` method to only show high-priority events

---

### 4.3 Circular Linked List (Sliding Window) — `CircularBuffer` ([CircularBuffer.h](file:///d:/kirti_project/MicroplasticDetector/CircularBuffer.h))

**What it stores:** The last **N** sensor readings (default N=10) in a fixed-size ring.

**How it works:**
```cpp
// When buffer is FULL and a new reading arrives:
CircularNode* oldHead = tail->next;  // Head of the ring
oldHead->data = reading;             // OVERWRITE oldest data
tail = oldHead;                      // Old head becomes new tail
// The circular link naturally advances — no memory allocation needed!
```

**Visual:**
```
                    ┌──── tail->next = head ────┐
                    │                           │
 [Slot 1] → [Slot 2] → ... → [Slot 10] → [Slot 1] (circle!)
  oldest                        newest/tail
```

**What it computes:**
- **Moving average** = sum of all voltages ÷ window size → smoothed baseline voltage
- **Min/Max voltage** in the current window → detect abnormal spikes

**Why it matters:** Raw ADC readings have electrical noise. The moving average filters out single-sample noise, so a real microplastic (which creates a sustained multi-sample dip) stands out clearly.

**How to modify:**
- Change `capacity` from 10 to 20 for a wider smoothing window
- Add `getStdDeviation()` to detect when noise is abnormally high
- Add `getMedian()` for outlier-robust baseline estimation

---

### 4.4 Stack (LIFO) — `CalibrationStack` ([CalibrationStack.h](file:///d:/kirti_project/MicroplasticDetector/CalibrationStack.h))

**What it stores:** Snapshots of the calibration state (baseline voltage, turbidity threshold, temperature correction factor).

**How it's used:**
```
User changes baseline from 3.0V → 2.8V → 3.1V → 2.95V
Stack: [2.95V] ← TOP
       [3.1V]
       [2.8V]
       [3.0V] ← BOTTOM (original)

User calls undo():
  → Pops 2.95V
  → Restores 3.1V as current calibration
```

**Operations:** `push()` O(1), `pop()` O(1), `peek()` O(1), `undo()` = pop + restore

**How to modify:**
- Add a `redo()` using a second stack to store popped states
- Set a max depth to prevent unlimited memory growth
- Add `saveToFile()` / `loadFromFile()` to persist calibration across reboots

---

### 4.5 Queue & Priority Queue — `AlertQueue` ([AlertQueue.h](file:///d:/kirti_project/MicroplasticDetector/AlertQueue.h))

**What it stores:** System alerts with types `CRITICAL`, `ERROR`, `WARNING`, `INFO`.

**Two enqueueing modes:**
1. **Normal enqueue** → adds at rear (FIFO order)
2. **Priority enqueue** → inserts based on priority level (lower number = higher priority), so `CRITICAL` (priority 1) jumps ahead of `INFO` (priority 4)

```cpp
// Priority insertion: O(n)
void enqueuePriority(Alert alert) {
    // Traverse queue to find correct position by priority
    // CRITICAL alerts jump to front past WARNING/INFO alerts
}
```

**Real system scenario:**
```
Queue before: [INFO: Detection] → [INFO: Sample OK] → [WARNING: Low flow]

CRITICAL turbidity alert arrives via enqueuePriority():

Queue after:  [CRITICAL: Pump shutdown!] → [INFO: Detection] → [INFO: Sample OK] → [WARNING: Low flow]
```

**How to modify:**
- Add `dequeueByType("ERROR")` to process only error alerts
- Add a max queue size with overflow handling
- Add timestamp-based auto-expiry for old alerts

---

### 4.6 Binary Search Tree — `DetectionBST` ([DetectionBST.h](file:///d:/kirti_project/MicroplasticDetector/DetectionBST.h))

**What it stores:** `MicroplasticEvent` records indexed by **timestamp** as the BST key.

**Tree structure:**
```
              [Event @5.0s]
             /              \
     [Event @2.5s]     [Event @7.5s]
      /       \               \
[Event @1.0s] [Event @3.5s] [Event @9.0s]
```
Left subtree = earlier events, Right subtree = later events.

**Operations:**
| Operation | Complexity | What it does |
|:---|:---|:---|
| Insert | O(log n) avg | Add new detection by timestamp |
| Search by timestamp | O(log n) avg | Find exact event at time T |
| **Range search** | O(log n + k) | **Find ALL events between T₁ and T₂** |
| Inorder traversal | O(n) | Print all events in chronological order |
| Preorder traversal | O(n) | Print in root-left-right order |
| Postorder traversal | O(n) | Print in left-right-root order |
| Delete | O(log n) avg | Remove event (3 cases: leaf / one child / two children) |
| Height | O(n) | Measure tree balance |

**Range search is the killer feature:**
```cpp
// "Show me all detections between 2.0s and 8.0s"
detectionTree.rangeSearch(2.0, 8.0);
// Efficiently traverses only relevant branches, skipping irrelevant subtrees
```

**How to modify:**
- Implement an AVL or Red-Black tree for guaranteed O(log n) worst case
- Index by voltage drop instead of timestamp for severity-based queries
- Add `countInRange()` to count events without printing them

---

### 4.7 Sorting Algorithms ([SortingAlgorithms.h](file:///d:/kirti_project/MicroplasticDetector/SortingAlgorithms.h))

**What they sort:** Arrays of `SensorReading` objects by **voltage** (ascending).

| Algorithm | Complexity | How it works on readings |
|:---|:---|:---|
| **Bubble Sort** | O(n²) | Compares adjacent voltages, swaps if out of order. Optimized with `swapped` flag. |
| **Selection Sort** | O(n²) | Finds minimum voltage in unsorted portion, places it at correct position. |
| **Insertion Sort** | O(n²) best O(n) | Inserts each reading into its correct position. Best for nearly-sorted data. |
| **Merge Sort** | O(n log n) | Divide & conquer: splits array, sorts halves, merges. Uses `new/delete` for temp arrays. |
| **Quick Sort** | O(n log n) avg | Picks last element as pivot (Lomuto partitioning), recursively sorts partitions. |

**How readings are converted for sorting:**
```cpp
// Singly Linked List → dynamically allocated array
SensorReading* arr = sensorLog.toArray(arrSize);  // O(n) traversal
// Sort operates on the COPY, original linked list is untouched
bubbleSort(arr, arrSize);
delete[] arr;  // Free after use
```

**Comparison uses operator overloading:**
```cpp
bool operator<(const SensorReading& other) const {
    return voltage < other.voltage;  // Sort by voltage value
}
```

---

### 4.8 Searching Algorithms ([SearchAlgorithms.h](file:///d:/kirti_project/MicroplasticDetector/SearchAlgorithms.h))

| Algorithm | Complexity | Prerequisite | What it does |
|:---|:---|:---|:---|
| **Linear Search** (by voltage) | O(n) | None | Find first reading below a threshold |
| **Linear Search** (all breaches) | O(n) | None | Find ALL readings below threshold |
| **Linear Search** (by timestamp) | O(n) | None | Find reading at exact time |
| **Binary Search** (by voltage) | O(log n) | **Sorted array** | Divide search space in half each step, find closest match |
| **Find Min/Max** | O(n) | None | Identify extreme voltage values |

**Binary Search with closest-match:**
```cpp
// Even if exact voltage not found, tracks closest match
double closestDiff = 999.0;
while (low <= high) {
    int mid = low + (high - low) / 2;
    double diff = fabs(arr[mid].getVoltage() - target);
    if (diff < closestDiff) { closestDiff = diff; closestIdx = mid; }
    // ... standard binary search logic
}
```

---

## 5. Backend (C++ & ESP32 Firmware) — Feature-by-Feature

### 5.1 Menu System (Desktop CLI)

[`main.cpp`](file:///d:/kirti_project/MicroplasticDetector/main.cpp) provides an 11-option interactive menu:

| Option | Feature | DSA Used |
|:---|:---|:---|
| 1 | **Full Detection Simulation** | All structures simultaneously |
| 2 | Sensor Log operations | Singly Linked List |
| 3 | Event History operations | Doubly Linked List |
| 4 | Sliding Window operations | Circular Linked List |
| 5 | Sorting algorithms | 5 sorting algorithms on arrays |
| 6 | Searching algorithms | Linear & Binary search |
| 7 | Calibration Undo/Redo | Stack (LIFO) |
| 8 | Alert Queue processing | Queue & Priority Queue |
| 9 | BST tree operations | Binary Search Tree |
| 10 | Dashboard display | ASCII formatted dashboard |
| 11 | Full system status | All hardware + DSA status |

### 5.2 Full Simulation Pipeline (Option 1)

The simulation runs in 6 phases matching the real hardware flow:
1. **Boot & Calibrate:** Read temperature → compute correction → calibrate laser baseline → push to calibration stack
2. **Activate Pump:** Set relay state → turn on laser
3. **Per-sample loop (n times):**
   - Turbidity check → if muddy: reject + priority alert + emergency shutoff
   - If clear: take laser reading → append to sensor log + circular buffer
   - Analyze for particle → if detected: create event → doubly list + BST + alert
   - Update dashboard
4. **Shutdown:** Stop pump, deactivate laser
5. **Display results:** Dashboard + voltage graph

### 5.3 ESP32 WebSocket Server

The firmware runs a WebSocket server on port 81 that:
- **Broadcasts JSON status** including all sensor values, DSA sizes, free heap memory
- **Accepts commands** from the web dashboard (`START_FLOW`, `STOP_FLOW`, `CALIBRATE`, `SIMULATE`)
- **Sends real-time detection events** as they happen

```cpp
// JSON broadcast format
{
  "type": "status",
  "pump": "RUNNING",
  "laser": "ON",
  "turbidityVoltage": 3.452,
  "temperature": 24.5,
  "photodiode": 2.987,
  "detections": 7,
  "freeHeap": 245312,
  "sensorLogSize": 15,
  "bstSize": 7,
  "bstHeight": 3
}
```

---

## 6. Frontend (Next.js Dashboard) — Feature-by-Feature

### 6.1 Two Operating Modes

| Mode | Port | Data Source | How it works |
|:---|:---|:---|:---|
| **Demo** | `localhost:3000` | [`SimulationEngine.ts`](file:///d:/kirti_project/dashboard/lib/SimulationEngine.ts) | All 8 DSA structures ported to TypeScript, runs entirely in the browser |
| **Real** | `localhost:3001` | ESP32 via WebSocket `ws://<IP>:81` | Connects to physical hardware, displays real ADC data |

### 6.2 Dashboard Pages

| Page Route | Feature | What it shows |
|:---|:---|:---|
| [`/`](file:///d:/kirti_project/dashboard/app/page.tsx) | **Main Dashboard** | Live voltage waveform chart (Recharts `AreaChart`), sensor cards, hardware pipeline flow bar, detection counter, DSA status grid |
| `/simulation` | **Run Simulation** | Start/stop simulation, sample-by-sample progress, per-sample results (detection/rejected/clear) |
| `/sensor-log` | **Singly Linked List** | View all readings, add/delete nodes, count by type |
| `/events` | **Doubly Linked List** | Forward & reverse traversal of detections, delete by ID, severity statistics |
| `/sliding-window` | **Circular Linked List** | Visual ring buffer, add readings, moving average display |
| `/sorting` | **Sorting Algorithms** | Run all 5 algorithms, visual comparison of sorted arrays |
| `/searching` | **Searching Algorithms** | Linear & binary search with step trace and comparison count |
| `/calibration` | **Calibration Stack** | Push/pop/undo calibration states, visual stack display |
| `/alerts` | **Alert Queue** | View pending alerts, process one/all, add priority alerts |
| `/bst` | **Binary Search Tree** | Inorder/preorder/postorder traversal, search by timestamp, range query |
| `/system` | **System Dashboard** | Hardware diagnostics, GPIO pin status, heap memory, connection info |

### 6.3 WebSocket Context Provider

[`WebSocketContext.tsx`](file:///d:/kirti_project/dashboard/context/WebSocketContext.tsx) is the central state manager:

- In **Demo mode**: Instantiates `SimulationEngine` (TypeScript port of all C++ DSA classes) and calls methods directly
- In **Real mode**: Connects to ESP32 WebSocket, parses JSON packets, updates React state
- Provides unified API: `sensors`, `detections`, `alerts`, `sensorLog`, `calibrationStack`, `bstData`, `voltageHistory`, etc.

### 6.4 SimulationEngine.ts — TypeScript DSA Port

[`SimulationEngine.ts`](file:///d:/kirti_project/dashboard/lib/SimulationEngine.ts) is a **complete TypeScript reimplementation** of every C++ data structure:

| C++ Class | TypeScript Class | Lines |
|:---|:---|:---|
| `SensorReading` | `SensorReading` | Class with timestamp, voltage, sensorType, valid |
| `MicroplasticEvent` | `MicroplasticEvent` | Auto-classifying severity + confidence formula |
| `SensorLinkedList` | `SensorLinkedList` | `SensorNode` with `.next` pointer |
| `EventDoublyList` | `EventDoublyList` | `EventNode` with `.next` and `.prev` pointers |
| `CircularBuffer` | `CircularBuffer` | Ring buffer with sliding window overwrite |
| `CalibrationStack` | `CalibrationStack` | `StackNode` with `.next` pointer |
| `AlertQueue` | `AlertQueue` | Queue with `enqueue()` and `enqueuePriority()` |
| `DetectionBST` | `DetectionBST` | `BSTNode` with `.left` and `.right` pointers |
| All 5 sorting algorithms | `bubbleSort`, `selectionSort`, etc. | Direct ports |
| Both search algorithms | `linearSearchBelow`, `binarySearchByVoltage` | Direct ports |

---

## 7. How Each Hardware Sensor Is Detected & Read

### Detection Flow on ESP32 Boot:

```
ESP32 Powers On
      │
      ├─► GPIO 34 → analogRead() → Turbidity Sensor
      │     Always reads (12-bit ADC). No detection needed — always present.
      │
      ├─► GPIO 35 → analogRead() → Photodiode (BPW34 via LM358)
      │     Always reads (12-bit ADC). Output depends on laser being ON.
      │
      ├─► GPIO 4 → readPhysicalDS18B20() → DS18B20 Temperature
      │     │
      │     ├─ If 1-Wire response (-55°C to +125°C): DETECTED → use digital reading
      │     ├─ If no 1-Wire, try analogRead → LM35 (0.10V–1.50V): DETECTED → use analog
      │     └─ If nothing: NOT DETECTED → default to 25.0°C baseline
      │
      ├─► GPIO 26 → digitalWrite() → Relay Module → Pump
      │     Output pin only. Relay clicks = pump running.
      │
      └─► GPIO 27 → digitalWrite() → 650nm Laser Diode
            Output pin only. HIGH = laser ON, LOW = laser OFF.
```

### Hardware Detection Status in WebSocket:
```json
{
  "temperatureHw": true,     // DS18B20 probe detected
  "turbidityVoltage": 3.452, // Non-zero = sensor connected
  "pump": "RUNNING",         // Relay state
  "laser": "ON",             // Laser GPIO state
  "freeHeap": 245312         // ESP32 available SRAM
}
```

---

## 8. What You Can Modify & Customize

### 8.1 Detection Sensitivity
| Parameter | File | Default | Effect of changing |
|:---|:---|:---|:---|
| `detectionThreshold` | [`LaserChamber.h:30`](file:///d:/kirti_project/MicroplasticDetector/LaserChamber.h#L30) | `0.15V` | Lower = more sensitive (detects smaller particles), higher = fewer false positives |
| `clearThreshold` | [`TurbiditySensor.h:27`](file:///d:/kirti_project/MicroplasticDetector/TurbiditySensor.h#L27) | `2.5V` | Lower = accepts muddier water, higher = stricter turbidity check |
| Severity thresholds | [`MicroplasticEvent.h:42-47`](file:///d:/kirti_project/MicroplasticDetector/MicroplasticEvent.h#L42-L47) | 20%/10% | Change where HIGH/MEDIUM/LOW boundaries are |

### 8.2 Sliding Window Size
| Parameter | File | Default | Effect |
|:---|:---|:---|:---|
| `CircularBuffer capacity` | [`main.cpp:50`](file:///d:/kirti_project/MicroplasticDetector/main.cpp#L50) | `10` | Larger = smoother average but slower to react to changes |

### 8.3 Temperature Compensation
| Parameter | File | Default | Effect |
|:---|:---|:---|:---|
| `referenceTemp` | [`TemperatureSensor.h:28`](file:///d:/kirti_project/MicroplasticDetector/TemperatureSensor.h#L28) | `25.0°C` | Calibration reference temperature |
| Correction formula | [`TemperatureSensor.h:55`](file:///d:/kirti_project/MicroplasticDetector/TemperatureSensor.h#L55) | `1.0 - (tempDiff × 0.001)` | Adjust multiplier for different water types |

### 8.4 ESP32 WiFi & Network
| Parameter | File | Default | What to change |
|:---|:---|:---|:---|
| `WIFI_SSID` | [`.ino:36`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/MicroplasticDetectorESP32_WiFi.ino#L36) | `"YOUR_WIFI_SSID"` | Your WiFi network name |
| `WIFI_PASSWORD` | [`.ino:37`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/MicroplasticDetectorESP32_WiFi.ino#L37) | `"YOUR_WIFI_PASSWORD"` | Your WiFi password |
| WebSocket port | [`.ino:40`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/MicroplasticDetectorESP32_WiFi.ino#L40) | `81` | Change if port 81 is occupied |

### 8.5 Simulation Parameters (Desktop)
| Parameter | File | Default | What it does |
|:---|:---|:---|:---|
| Muddy water probability | [`TurbiditySensor.h:37`](file:///d:/kirti_project/MicroplasticDetector/TurbiditySensor.h#L37) | `15%` | How often simulation generates muddy samples |
| Detection probability | [`LaserChamber.h:64`](file:///d:/kirti_project/MicroplasticDetector/LaserChamber.h#L64) | `20%` | How often a "particle" appears in simulation |
| Sample interval | [`main.cpp:130`](file:///d:/kirti_project/MicroplasticDetector/main.cpp#L130) | `0.5s` | Time between simulated readings |
| Pump flow rate | [`PumpController.h:34`](file:///d:/kirti_project/MicroplasticDetector/PumpController.h#L34) | `2.0 ml/s` | Simulated flow speed |

---

## 9. Full Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PHYSICAL HARDWARE LAYER                       │
│                                                                      │
│   [Sample Beaker] → [Peristaltic Pump] → [40µm Mesh Filter]        │
│                          ▲ GPIO 26                                   │
│                          │ Relay Control                             │
│                                                                      │
│   [DS18B20 Temp]         [Turbidity Sensor]    [Dark PVC Chamber]   │
│     GPIO 4                 GPIO 34               GPIO 27 (Laser)    │
│     1-Wire Digital         ADC Analog            GPIO 35 (Photod.)  │
│                                                                      │
│                          ▼                         ▼                  │
│                    [Failsafe Gate]           [Optical Detection]      │
│                    V ≥ 2.5V? Pass            ΔV ≥ 0.15V? Particle!  │
└────────────────────────────┬────────────────────┬────────────────────┘
                             │                    │
                             ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DSA PROCESSING LAYER                         │
│                                                                      │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│   │ Singly Linked    │  │ Circular Buffer  │  │ Calibration      │  │
│   │ List (Sensor Log)│  │ (Sliding Window) │  │ Stack (Undo)     │  │
│   │ ALL readings     │  │ Last 10 readings │  │ Baseline history │  │
│   │ append() O(1)    │  │ Moving avg O(n)  │  │ push/pop O(1)    │  │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│   │ Doubly Linked    │  │ Binary Search    │  │ Alert Queue      │  │
│   │ List (Events)    │  │ Tree (BST)       │  │ (FIFO+Priority)  │  │
│   │ Forward+Reverse  │  │ Timestamp index  │  │ CRITICAL jumps   │  │
│   │ traverse O(n)    │  │ Range query      │  │ to front         │  │
│   └──────────────────┘  │ O(log n)         │  └──────────────────┘  │
│                          └──────────────────┘                        │
│                                                                      │
│   ┌──────────────────────────────┐  ┌─────────────────────────────┐ │
│   │ 5 Sorting Algorithms         │  │ 2 Searching Algorithms      │ │
│   │ Bubble, Selection, Insertion │  │ Linear O(n)                 │ │
│   │ Merge O(n log n)             │  │ Binary O(log n)             │ │
│   │ Quick O(n log n) avg         │  │ + Min/Max finder            │ │
│   └──────────────────────────────┘  └─────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼ WebSocket (:81) / ASCII Terminal
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                            │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │               Next.js 16 Web Dashboard                       │   │
│   │  ┌──────────┬──────────┬──────────┬──────────┬────────────┐ │   │
│   │  │ Live     │ Sensor   │ Events   │ Sliding  │ BST        │ │   │
│   │  │ Voltage  │ Log      │ History  │ Window   │ Traversals │ │   │
│   │  │ Chart    │ (SLL)    │ (DLL)    │ (CLL)    │ + Range    │ │   │
│   │  ├──────────┼──────────┼──────────┼──────────┼────────────┤ │   │
│   │  │ Sorting  │ Search   │ Calib.   │ Alert    │ System     │ │   │
│   │  │ Bench    │ Compare  │ Stack    │ Queue    │ Diagnostics│ │   │
│   │  └──────────┴──────────┴──────────┴──────────┴────────────┘ │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │            Desktop ASCII Terminal (main.cpp)                 │   │
│   │   11-option interactive menu with formatted output           │   │
│   └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```
