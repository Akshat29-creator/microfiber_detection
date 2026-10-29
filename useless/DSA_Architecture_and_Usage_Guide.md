# 🧠 Microplastic Detector — DSA Architecture & Implementation Guide

---

## 📌 Executive Summary

The **Microplastic Detection System** processes high-speed optical and physical sensor readings in real-time on resource-constrained embedded hardware (ESP32) and native C++ environments. To ensure high throughput, zero memory leaks, and deterministic latency, the backend does not rely on heavy third-party containers or generic standard templates. Instead, it implements **custom, purpose-built Data Structures and Algorithms (DSA)** tailored to fluid telemetry, signal filtering, anomaly detection, and failsafe control.

---

## 🏗️ Master DSA Architecture & File Mapping

| File Name | Primary DSA Pattern | Auxiliary Concepts | Time Complexity | Core Role in System |
|:---|:---|:---|:---:|:---|
| [`SensorLinkedList.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/SensorLinkedList.h) | **Singly Linked List** | Head/Tail Pointers, Dynamic Nodes | Append: $O(1)$<br>Search: $O(n)$ | **Master Historical Log**: Stores every raw physical reading across all sensors without pre-allocation. |
| [`CircularBuffer.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/CircularBuffer.h) | **Circular Linked List / Ring Buffer** | Modulo Pointer Arithmetic, Fixed Window | Insert: $O(1)$<br>Average: $O(1)$ | **Real-time Sliding Window**: Tracks the last 10 photodiode samples to compute moving baseline & variance. |
| [`EventDoublyList.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/EventDoublyList.h) | **Doubly Linked List** | Bidirectional Pointers (`prev`, `next`) | Append: $O(1)$<br>Delete: $O(1)^*$ | **Detection Incident Registry**: Stores confirmed particles; allows forward & reverse chronological audits. |
| [`DetectionBST.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/DetectionBST.h) | **Binary Search Tree (BST)** | Tree Traversal, Recursive Binary Partitioning | Lookup: $O(\log n)$<br>Insert: $O(\log n)$ | **Temporal Search Index**: Organizes detections by timestamp for instant range queries ($t_1 \le t \le t_2$). |
| [`CalibrationStack.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/CalibrationStack.h) | **Stack (LIFO)** | Dynamic Pointer Stack | Push: $O(1)$<br>Pop: $O(1)$ | **Sensor Calibration Rollback**: Manages baseline calibration history with instant undo/redo functionality. |
| [`AlertQueue.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/AlertQueue.h) | **Queue (FIFO) + Priority Queue** | Head/Tail Pointers, Preemptive Insertion | Enqueue: $O(1)$<br>Priority: $O(n)$ | **Failsafe Telemetry Dispatch**: Standard alerts queued FIFO; critical pump alarms preempt to the front. |
| [`SortingAlgorithms.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/SortingAlgorithms.h) | **5 Sorting Algorithms** | In-place, Divide & Conquer, Benchmarking | Merge/Quick: $O(n \log n)$<br>Quadratic: $O(n^2)$ | **Statistical Data Organization**: Sorts voltage drops and sensor readings; benchmarks execution efficiency. |
| [`SearchAlgorithms.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/SearchAlgorithms.h) | **Searching Algorithms** | Binary Search, Linear Search, Counters | Binary: $O(\log n)$<br>Linear: $O(n)$ | **Threshold Filtering & Pinpoint Querying**: Finds specific voltage anomalies and verifies thresholds. |
| [`SensorReading.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/SensorReading.h) | **Encapsulation / Composite Model** | Data Abstraction, Value Object Pattern | Instantiation: $O(1)$ | **Standardized Data Capsule**: Holds immutable reading values, sensor tags, and validity flags. |
| [`MicroplasticEvent.h`](file:///d:/kirti_project/MicroplasticDetectorESP32_WiFi/MicroplasticEvent.h) | **Classification / Mathematical Heuristic** | Weighted Scoring, State Machine | Calculation: $O(1)$ | **Incident Evaluator**: Calculates voltage drop %, assigns severity (LOW/MED/HIGH), scores confidence. |

---

## 🔍 Detailed File-by-File Breakdown

---

### 1. `SensorLinkedList.h` — Master Historical Data Log
* **Data Structure:** Singly Linked List with `head` and `tail` pointers.
* **Nodes:** `SensorNode` containing a `SensorReading` and a single `next` pointer.

#### Technical Implementation & Methods
* `append(reading)`: Attaches a new node at `tail->next`, updates `tail`, increments size. Runs in strictly **$O(1)$**.
* `insertAtHead(reading)`: Prepends a node for high-priority historical backfills in **$O(1)$**.
* `deleteAtPosition(index)`: Traverses to `index - 1`, updates pointers, and frees dynamic memory in **$O(n)$**.
* `countByType(sensorType)`: Traverses the list counting occurrences of `"PHOTODIODE"`, `"TURBIDITY"`, or `"TEMPERATURE"`.

#### Why This DSA is Used (Core Importance)
1. **Dynamic Runtime Expansion in ESP32 RAM:** In continuous fluid monitoring, the total number of samples cannot be predicted in advance. Standard static arrays (`float arr[1000]`) waste scarce microcontroller RAM (SRAM is limited to ~320 KB on ESP32) and cause stack overflow if exceeded.
2. **Deterministic $O(1)$ Append:** Using both `head` and `tail` pointers ensures that inserting a newly sampled sensor reading never degrades in performance as the list grows from 10 to 10,000 readings.
3. **No Expensive Array Reallocations:** In C++, resizing dynamic arrays (`std::vector`) triggers memory reallocation, copying existing elements, and memory fragmentation. The linked list allocates memory strictly per sample.

---

### 2. `CircularBuffer.h` — Real-Time Sliding Window
* **Data Structure:** Circular Linked List / Ring Buffer with fixed capacity ($N = 10$).
* **Nodes:** `BufferNode` where each node points to the next, and the 10th node connects back to the 1st node.

#### Technical Implementation & Methods
* `insert(reading)`: Overwrites the data at the `head` pointer and advances both `head` and `tail` by one node.
* `getMovingAverage()`: Sums the last 10 readings and divides by the window count in **$O(1)$** to **$O(k)$** ($k \le 10$).
* `getVariance()`: Computes $\sigma^2 = \frac{1}{N}\sum(x_i - \mu)^2$ to evaluate signal noise and optical turbidity jitter.
* `getMin()` / `getMax()`: Scans the active 10 nodes to find short-term voltage fluctuations.

#### Why This DSA is Used (Core Importance)
1. **Zero Memory Leaks / Bounded Space Complexity:** The circular buffer pre-allocates exactly 10 nodes during system boot and **never allocates or frees memory again during sampling**. This completely prevents heap fragmentation in continuous embedded loops.
2. **Optical Transit Moving Baseline:** Water without particles naturally experiences slight ambient light and thermal variations. The circular buffer provides a rolling moving average representing the **clean-water optical baseline**, allowing the system to distinguish real microplastic voltage drops from slow environmental drift.

---

### 3. `EventDoublyList.h` — Chronological & Reverse Incident Audit
* **Data Structure:** Doubly Linked List with `head`, `tail`, `next`, and `prev` pointers.
* **Nodes:** `EventNode` containing a `MicroplasticEvent` object.

#### Technical Implementation & Methods
* `append(event)`: Inserts a newly detected microplastic at the end in **$O(1)$**.
* `displayForward()`: Traverses from `head` to `tail` ($O(n)$) to show chronological timeline.
* `displayReverse()`: Traverses from `tail` to `head` ($O(n)$) to immediately display the **most recent alerts** on the operator's screen.
* `deleteByID(id)`: Locates the specified event ID, bypasses it via `node->prev->next = node->next` and `node->next->prev = node->prev`, and releases memory.

#### Why This DSA is Used (Core Importance)
1. **Bidirectional Auditing:** Lab technicians and environmental monitoring dashboards must display both **historical trends** (start of water batch to finish) and **real-time alerts** (newest events first). A doubly linked list enables backward navigation without reversing or cloning arrays in memory.
2. **Instant Deletion of False Positives:** If an optical spike was caused by an air bubble or vibration, the operator can delete the incident by ID in **$O(1)$ pointer reconfiguration** once the target node is identified, with zero shifting of neighboring elements.

---

### 4. `DetectionBST.h` — Fast Temporal Indexing & Window Queries
* **Data Structure:** Binary Search Tree (BST).
* **Nodes:** `BSTNode` with left child, right child, and a `MicroplasticEvent` keyed by `timestamp`.

#### Technical Implementation & Methods
* `insert(event)`: Recursively places the event based on timestamp ($t < \text{node.timestamp}$ goes left, $t \ge \text{node.timestamp}$ goes right) in **$O(\log n)$** average time.
* `search(timestamp)`: Locates a specific particle event by exact transit time in **$O(\log n)$**.
* `rangeQuery(t1, t2)`: Traverses the tree to retrieve all contamination incidents occurring between two arbitrary timestamps ($t_1$ and $t_2$).
* `inorder()`: Performs in-order traversal (Left $\rightarrow$ Root $\rightarrow$ Right), yielding a **naturally sorted chronological sequence**.

#### Why This DSA is Used (Core Importance)
1. **Time-Window Analytics:** Environmental regulations often require reporting contamination rates per minute or per hour. Instead of running an $O(n)$ full scan across every log, the BST prunes unnecessary subtrees and answers interval queries in **$O(\log n + k)$** (where $k$ is the number of matches).
2. **Automatic Sorting at Ingestion:** Because insertion naturally organizes nodes by key, extracting sorted event data requires zero explicit sorting algorithms.

---

### 5. `CalibrationStack.h` — LIFO Baseline Calibration Rollback
* **Data Structure:** Stack (Last-In, First-Out) implemented via a pointer-linked list.
* **Nodes:** `StackNode` containing a `CalibrationRecord` (timestamp, raw voltage, thermal factor, corrected voltage, notes).

#### Technical Implementation & Methods
* `push(record)`: Prepends a new calibration record onto the top of the stack in **$O(1)$**.
* `pop()`: Removes and returns the most recent calibration record in **$O(1)$**.
* `peek()`: Inspects the currently active baseline without removing it in **$O(1)$**.
* `isEmpty()`: Quick guard check in **$O(1)$**.

#### Why This DSA is Used (Core Importance)
1. **Undo / Redo Multi-Stage Sensor Calibration:** Water calibration happens in stages (e.g., dry chamber reference $\rightarrow$ deionized pure water $\rightarrow$ temperature adjusted baseline). If a technician calibrates with contaminated water or bad lighting, they can hit **Undo** (`pop()`) to roll back to the previously verified baseline instantly.
2. **Strict LIFO Invariant:** Only the most recent valid calibration state should govern current detection thresholds. Stacks enforce this invariant at compile and runtime.

---

### 6. `AlertQueue.h` — Priority Failsafe & Telemetry Queue
* **Data Structure:** FIFO (First-In, First-Out) Queue combined with a **Priority Queue** mechanism.
* **Nodes:** `QueueNode` containing an `Alert` struct (type, message, timestamp, priority 1–4).

#### Technical Implementation & Methods
* `enqueue(alert)`: Inserts routine telemetry messages (`INFO`, `WARNING`) at the `rear` pointer in **$O(1)$**.
* `enqueuePriority(alert)`: Used exclusively for emergency conditions (`CRITICAL`, Priority 1). Inserts the alert **directly at the front** (`head`), allowing it to preempt all routine messages.
* `dequeue()`: Extracts and processes the alert at the `front` in **$O(1)$**.

#### Why This DSA is Used (Core Importance)
1. **Preemptive Safety Failsafe:** When the turbidity sensor detects muddy water ($< 2.5\text{V}$) or the motor draws overcurrent, waiting in a FIFO queue behind 50 routine `INFO` packets would delay emergency shutoff. `enqueuePriority` guarantees that critical hardware alarms jump straight to the head of the dispatch pipeline.
2. **Decoupled Telemetry Transmission:** Decouples sensor acquisition from slow communication buses (WiFi WebSocket packets and Serial printing), preventing sensor loop blocking.

---

### 7. `SortingAlgorithms.h` — Data Organization & Algorithmic Benchmarks
* **Algorithms Implemented:**
  1. **Bubble Sort:** $O(n^2)$ time, $O(1)$ space.
  2. **Selection Sort:** $O(n^2)$ time, $O(1)$ space.
  3. **Insertion Sort:** $O(n^2)$ worst, $O(n)$ best for nearly sorted data, $O(1)$ space.
  4. **Merge Sort:** $O(n \log n)$ time, $O(n)$ space (stable).
  5. **Quick Sort:** $O(n \log n)$ average time, $O(\log n)$ recursive stack space (in-place partition).

#### Technical Implementation & Methods
* `sortReadingsByVoltage()` / `sortEventsByDrop()`: Accepts a contiguous array converted from a linked list and sorts it in place or via divide-and-conquer.
* Benchmarks microsecond execution timing (`micros()`) across all 5 algorithms side-by-side.

#### Why This DSA is Used (Core Importance)
1. **Pre-requisite for Fast Binary Search:** Binary search strictly requires sorted data. Sorting algorithms organize historical voltage drops from lowest to highest.
2. **Academic & Performance Benchmarking:** Demonstrates the trade-offs of in-place quadratic algorithms ($O(n^2)$ with minimal RAM footprint) versus divide-and-conquer algorithms ($O(n \log n)$ with stack/heap overhead) on embedded microcontrollers.

---

### 8. `SearchAlgorithms.h` — Pinpoint Voltage Querying
* **Algorithms Implemented:**
  1. **Linear Search ($O(n)$):** Evaluates every element sequentially; supports conditions such as "find first reading below threshold $V$".
  2. **Binary Search ($O(\log n)$):** Evaluates sorted sensor arrays using iterative midpoint calculation `mid = low + (high - low) / 2`.

#### Technical Implementation & Methods
* `linearSearchByVoltage(arr, n, targetVoltage, findBelow)`: Finds the first voltage matching the inequality and logs comparison counts.
* `binarySearchByVoltage(arr, n, targetVoltage, tolerance)`: Searches a sorted array for a specific calibration voltage, narrowing search space by 50% per iteration.

#### Why This DSA is Used (Core Importance)
1. **Fast Anomaly Verification:** When an operator wants to inspect whether a specific voltage dip (e.g., $1.85\text{V}$) occurred, Binary Search finds it in $\approx 10$ steps out of 1,000 readings, compared to 1,000 steps with Linear Search.
2. **Real-time Threshold Testing:** Allows verifying whether any readings breached safety thresholds without iterating through irrelevant entries.

---

### 9. `SensorReading.h` & `MicroplasticEvent.h` — Data Modeling & Severity Engine
* **Concepts:** Object-Oriented Encapsulation, State Machines, Mathematical Heuristics.

#### Technical Implementation & Formulas
* **Voltage Drop Calculation:**
  $$\Delta V = V_{\text{baseline}} - V_{\text{photodiode}}$$
* **Percentage Drop:**
  $$\text{dropPercent} = \left(\frac{\Delta V}{V_{\text{baseline}}}\right) \times 100$$
* **Severity Classification Engine:**
  $$\text{Severity} = \begin{cases} \mathbf{HIGH} & \text{if } \text{dropPercent} > 20.0\% \\ \mathbf{MEDIUM} & \text{if } 10.0\% < \text{dropPercent} \le 20.0\% \\ \mathbf{LOW} & \text{if } \text{dropPercent} \le 10.0\% \end{cases}$$
* **Detection Confidence Score:**
  $$\text{Score} = \left(\frac{\Delta V}{V_{\text{baseline}}} \times 70\right) + \left(\min\left(1.0, \frac{5.0}{\text{duration}_{\text{ms}}}\right) \times 30\right)$$

#### Why This is Used (Core Importance)
* Standardizes data structures across the C++ firmware, the WebSocket telemetry protocol, and the Next.js React frontend, ensuring all layers calculate microplastic concentrations identically.

---

## 📊 Summary Matrix: Operations & Complexities

```
+--------------------+----------------------+-------------------+-------------------+------------------------------+
| File Name          | Primary Data Struct  | Insertion / Push  | Deletion / Pop    | Search / Lookup              |
+--------------------+----------------------+-------------------+-------------------+------------------------------+
| SensorLinkedList.h | Singly Linked List   | O(1) [tail/head]  | O(n) [O(1) head]  | O(n) [Linear scan]           |
| CircularBuffer.h   | Circular Ring Buffer | O(1) [overwrite]  | N/A (Fixed size)  | O(1) avg / O(N) min-max      |
| EventDoublyList.h  | Doubly Linked List   | O(1) [tail/head]  | O(1) with pointer | O(n) Bidirectional          |
| DetectionBST.h     | Binary Search Tree   | O(log n) avg      | O(log n) avg      | O(log n) avg / Range: O(k+log n)|
| CalibrationStack.h | LIFO Stack           | O(1) [push]       | O(1) [pop]        | O(1) [peek top]              |
| AlertQueue.h       | Priority FIFO Queue  | O(1) norm / O(n) pri| O(1) [dequeue]   | O(1) [front peek]            |
| SortingAlgorithms  | 5 Sorting Algos      | N/A (Array sort)  | N/A               | Sort time: O(n log n) - O(n^2)|
| SearchAlgorithms   | Linear & Binary Srch | N/A (Array search)| N/A               | Binary: O(log n), Linear: O(n)|
+--------------------+----------------------+-------------------+-------------------+------------------------------+
```
