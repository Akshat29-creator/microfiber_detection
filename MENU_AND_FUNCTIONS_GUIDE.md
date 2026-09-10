# 🖥️ Main Menu & Function Architecture Guide
### Microplastic Detection System — Cyber-Physical DSA Implementation
**Author:** Akshat Awasthi | **Institution:** MIT Manipal | **Dept:** B.Tech Cyber-Physical Systems (CPS)

---

## 📌 Executive Summary of the Screen

When you run either the **Desktop C++ Executable** (`MicroplasticDetector.exe`) or open the **ESP32 Serial Monitor** at `115200 baud`, you are greeted by the centralized **Main Menu**:

```text
  +======================================================+
  |     MICROPLASTIC DETECTION SYSTEM — MAIN MENU        |
  |     DSA Project | MIT Manipal | 3rd Semester         |
  +======================================================+
  |                                                      |
  |   1.  Run Full Detection Simulation                  |
  |   2.  Sensor Log (Singly Linked List)                |
  |   3.  Event History (Doubly Linked List)             |
  |   4.  Sliding Window (Circular Linked List)          |
  |   5.  Sorting Algorithms                             |
  |   6.  Searching Algorithms                           |
  |   7.  Calibration Stack (Undo/Redo)                  |
  |   8.  Alert Queue                                    |
  |   9.  Detection BST (Tree Operations)                |
  |  10.  System Dashboard                               |
  |  11.  View All System Status                         |
  |   0.  Exit                                           |
  |                                                      |
  +======================================================+
```

### Why this screen exists:
This menu acts as the **central controller** and **live inspector** for the entire cyber-physical pipeline. Rather than simply printing static output, it provides an interactive testbed that allows professors, evaluators, and engineers to:
1. Trigger real-time water flow, optical sensing, and microplastic particle detection.
2. Inspect, insert, traverse, and delete nodes in all **6 individual Data Structures** (Singly LL, Doubly LL, Circular LL, Stack, Queue, Binary Search Tree).
3. Run microsecond-precision benchmarks comparing **5 Sorting Algorithms** and **2 Searching Algorithms**.
4. Test failsafe behaviors (muddy water rejection, emergency pump cutoff, sensor calibration undo).

---

## 🧠 Memory & Architecture Diagram

All 11 options interact with a unified set of **global objects** allocated in memory:

```
[Option 1: Full Simulation]
         │
         ├──► 1. Turbidity Check ──────► Reject? ──► [AlertQueue] (Priority Alarm)
         │                                       └──► [PumpController] (Emergency Stop)
         │
         ├──► 2. Laser ADC Reading ───► [SensorLinkedList] (Singly Linked List)
         │                            └──► [CircularBuffer]  (Sliding Window Avg)
         │
         └──► 3. Drop >= 0.15V? ──────► [EventDoublyList] (Doubly Linked List)
                                      ├──► [DetectionBST]   (Timestamp Tree Index)
                                      └──► [AlertQueue]     (Standard Alert)

[Option 7: Calibration] ──────────────► [CalibrationStack] (LIFO History / Undo)
[Option 5: Sorting] ──────────────────► [sensorLog.toArray()] ──► Bubble/Select/Insert/Merge/Quick
[Option 6: Searching] ────────────────► [sensorLog.toArray()] ──► Linear vs Binary Search
```

---

## 📑 Detailed Breakdown of Every Menu Option & Submenu

---

### 🟢 OPTION 1: Run Full Detection Simulation
* **Function in Code:** `runFullSimulation()`
* **Primary Purpose:** Executes the complete end-to-end cyber-physical pipeline across all sensors and data structures.
* **Input Requested:** `How many water samples to process? (5-50)`

#### Step-by-Step Execution Phases:
1. **Phase 1: Boot & Thermal Calibration:**
   - Reads DS18B20 water temperature (`tempSensor.readTemp()`).
   - Calculates water refractive index correction factor ($1.0 - (\Delta T \times 0.001)$).
   - Calibrates 650nm laser photodiode baseline voltage (`laserChamber.calibrate()`).
   - Pushes the baseline configuration to the **Calibration Stack** (`calibrationStack.push()`).
2. **Phase 2: Actuator Activation:**
   - Energizes peristaltic pump relay (`pumpController.start()`).
   - Activates 650nm laser diode (`laserChamber.laserActivate()`).
3. **Phase 3: Real-Time Sample Processing Loop:**
   - **Turbidity Failsafe Gate:** Calls `turbiditySensor.validateSample()`. If voltage $< 2.5\text{V}$ (muddy water), optical detection is blocked, sample is marked invalid, a high-priority alert is queued (`alertQueue.enqueuePriority()`), and the pump performs an emergency cutoff.
   - **Optical Sensing:** Calls `laserChamber.takeReading()`. Stores voltage and timestamp into the **Singly Linked List** (`sensorLog.append()`) and updates the **Circular Buffer** (`slidingWindow.insert()`).
   - **Particle Analysis:** If photodiode voltage drops by $\ge 0.15\text{V}$, light scattering from a microplastic is detected:
     - Instantiates a `MicroplasticEvent` dynamically.
     - Appends to the **Doubly Linked List** (`eventHistory.append()`).
     - Inserts into the **Binary Search Tree** (`detectionTree.insert()`).
     - Enqueues a notification into the **Alert Queue** (`alertQueue.enqueue()`).
     - Frees temporary memory (`delete event`).
4. **Phase 6: Safe Shutdown & Dashboard:**
   - Shuts down laser and pump relay.
   - Renders live detection dashboard and prints summary totals (Samples, Detections, Rejections).

* **Viva Question:** *"Why do you insert detection events into both a Doubly Linked List and a BST?"*  
  **Answer:** The Doubly Linked List preserves strict arrival sequence for chronological and reverse review, while the BST provides logarithmic $O(\log n)$ search and timestamp range queries that would otherwise take $O(n)$ in a list.

---

### 🟢 OPTION 2: Sensor Log (Singly Linked List)
* **Function in Code:** `sensorLogMenu()`
* **Primary Data Structure:** `SensorLinkedList` (`SensorNode* head`, `SensorNode* tail`)
* **DSA Concept:** Dynamic node allocation, pointer traversal, $O(1)$ append, $O(n)$ deletion.
* **Why it is used:** Stores continuous raw telemetry data (timestamps, voltages, sensor types) without fixed memory limits.

#### Sub-Menu Options:
```text
  === SENSOR LOG (Singly Linked List) ===
  1. Display all readings
  2. Add a manual reading
  3. Add at beginning
  4. Add at position
  5. Delete from beginning
  6. Delete from end
  7. Delete by timestamp
  8. Count by sensor type
  9. Show size & valid count
  0. Back to main menu
```

| Choice | Function Called | Description & Computational Complexity |
| :--- | :--- | :--- |
| **1** | `sensorLog.displayAll()` | Iterates through `head` to `tail` printing timestamp, voltage, and sensor validity. Complexity: $O(n)$. |
| **2** | `sensorLog.append(reading)` | Inserts a new `SensorReading` at the end of the list using `tail->next`. Complexity: $O(1)$. |
| **3** | `sensorLog.insertAtBeginning(reading)` | Allocates new `SensorNode`, points `newNode->next = head`, updates `head`. Complexity: $O(1)$. |
| **4** | `sensorLog.insertAtPosition(reading, pos)` | Traverses to position $k$, adjusts pointer links: `newNode->next = curr->next; curr->next = newNode`. Complexity: $O(k)$. |
| **5** | `sensorLog.deleteFromBeginning()` | Deletes the first node: `head = head->next`, reclaims memory via `delete`. Complexity: $O(1)$. |
| **6** | `sensorLog.deleteFromEnd()` | Traverses to second-to-last node, sets `secondLast->next = nullptr`, updates `tail`. Complexity: $O(n)$. |
| **7** | `sensorLog.deleteByTimestamp(ts)` | Searches for target timestamp and unlinks the node. Complexity: $O(n)$. |
| **8** | `sensorLog.countByType(type)` | Traverses list counting occurrences of `"PHOTODIODE"`, `"TURBIDITY"`, or `"TEMPERATURE"`. |
| **9** | `sensorLog.getSize()`, `countValid()` | Displays total count of nodes and valid vs rejected sample counts. |
| **0** | `break` | Exits submenu back to main menu. |

---

### 🟢 OPTION 3: Event History (Doubly Linked List)
* **Function in Code:** `eventHistoryMenu()`
* **Primary Data Structure:** `EventDoublyList` (`EventNode* head`, `EventNode* tail`, bidirectional pointers `next` & `prev`)
* **DSA Concept:** Doubly Linked List, bidirectional traversal, $O(1)$ deletion given node pointer.
* **Why it is used:** Incident analysis. Operators can traverse backward from a critical contamination event to examine preceding events leading up to the spike.

#### Sub-Menu Options:
```text
  === EVENT HISTORY (Doubly Linked List) ===
  1. Display forward (chronological)
  2. Display reverse (most recent first)
  3. Add manual event
  4. Delete event by ID
  5. Show statistics
  6. Show size
  0. Back to main menu
```

| Choice | Function Called | Description & Computational Complexity |
| :--- | :--- | :--- |
| **1** | `eventHistory.displayForward()` | Starts at `head`, traverses forward using `current = current->next`. Prints oldest to newest. Complexity: $O(n)$. |
| **2** | `eventHistory.displayReverse()` | Starts at `tail`, traverses backward using `current = current->prev`. Prints newest to oldest. Complexity: $O(n)$. |
| **3** | `eventHistory.append(event)` | Creates a new `EventNode`, connects `tail->next = newNode` and `newNode->prev = tail`. Complexity: $O(1)$. |
| **4** | `eventHistory.deleteByID(id)` | Searches for event ID and unlinks: `node->prev->next = node->next; node->next->prev = node->prev`. Used to remove false positives. |
| **5** | `eventHistory.displayStatistics()` | Calculates average particle size ($\mu\text{m}$), maximum voltage drop, and severity breakdown (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). |
| **6** | `eventHistory.getSize()` | Returns total detected event count in $O(1)$ time. |
| **0** | `break` | Returns to main menu. |

---

### 🟢 OPTION 4: Sliding Window (Circular Linked List)
* **Function in Code:** `slidingWindowMenu()`
* **Primary Data Structure:** `CircularBuffer` (`Node* head`, `Node* tail`, `tail->next = head`, fixed capacity = 10)
* **DSA Concept:** Circular Linked List, sliding window smoothing, circular pointer wrap-around.
* **Why it is used:** Optical sensor readings suffer from high-frequency electrical and optical noise. A sliding window of the last 10 readings computes a continuous moving average without reallocating memory.

#### Sub-Menu Options:
```text
  === SLIDING WINDOW (Circular Linked List) ===
  1. Display current window
  2. Add a reading to window
  3. Show moving average
  4. Show min/max voltage
  5. Fill with sample data
  0. Back to main menu
```

| Choice | Function Called | Description & Computational Complexity |
| :--- | :--- | :--- |
| **1** | `slidingWindow.display()` | Traverses from `head` through circular links until returning to `head`. Displays all readings currently in window. |
| **2** | `slidingWindow.insert(reading)` | Inserts new reading into the circle. If buffer is full, it overwrites the oldest node by advancing the `head` pointer (`head = head->next`). |
| **3** | `slidingWindow.getMovingAverage()` | Sums all voltages in the 10-node ring and divides by current size. Returns smoothed baseline voltage. Complexity: $O(k)$ where $k \le 10$. |
| **4** | `slidingWindow.getMinVoltage()`, `getMaxVoltage()` | Evaluates signal jitter by finding minimum and maximum voltages in the active window. |
| **5** | `slidingWindow.fillSampleData()` | Automatically inserts 15 sample readings to demonstrate the ring wrapping around and overwriting older values. |
| **0** | `break` | Returns to main menu. |

---

### 🟢 OPTION 5: Sorting Algorithms
* **Function in Code:** `sortingMenu()`
* **Primary Algorithms:** Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort.
* **DSA Concept:** Algorithmic complexity, comparisons vs swaps, recursive Divide & Conquer vs iterative sorting.
* **Why it is used:** Microplastic events must be sorted by voltage drop or severity to identify the largest contamination spikes and quantify water contamination profiles.

#### Sub-Menu Options:
```text
  === SORTING ALGORITHMS ===
  1. Bubble Sort (by voltage)
  2. Selection Sort (by voltage)
  3. Insertion Sort (by voltage)
  4. Merge Sort (by voltage)
  5. Quick Sort (by voltage)
  6. Run ALL and compare
  0. Back to main menu
```

| Choice | Algorithm | Time Complexity (Best / Avg / Worst) | Space | Description & Profiling |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Bubble Sort** | $O(n)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | Repeatedly steps through list, comparing adjacent pairs and swapping out-of-order elements. Tracks comparison and swap counts. |
| **2** | **Selection Sort** | $O(n^2)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | Finds the minimum element from the unsorted subarray and places it at beginning. Minimizes write operations ($O(n)$ swaps). |
| **3** | **Insertion Sort** | $O(n)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | Builds the sorted array one item at a time. Extremely fast on partially sorted real-time sensor streams. |
| **4** | **Merge Sort** | $O(n \log n)$ / $O(n \log n)$ / $O(n \log n)$ | $O(n)$ | Divide & Conquer: splits array into halves, recursively sorts, and merges. Stable sort with guaranteed $O(n \log n)$ performance. |
| **5** | **Quick Sort** | $O(n \log n)$ / $O(n \log n)$ / $O(n^2)$ | $O(\log n)$ | Divide & Conquer using Lomuto partitioning. Partitions array around a pivot element. Fastest in-place sort for large batches. |
| **6** | **Run ALL & Compare** | All 5 Algorithms | — | Clones the raw sensor array 5 times, runs every algorithm on identical data, and prints a microsecond comparison table showing: **Time ($\mu\text{s}$), Comparisons, and Swaps**. |
| **0** | `break` | — | — | Returns to main menu. |

---

### 🟢 OPTION 6: Searching Algorithms
* **Function in Code:** `searchingMenu()`
* **Primary Algorithms:** Linear Search ($O(n)$) and Binary Search ($O(\log n)$).
* **DSA Concept:** Sequential vs logarithmic search, prerequisite sorted arrays, search step tracing.
* **Why it is used:** Quickly locating specific voltage drops, threshold breaches, or timestamped incidents in thousands of logged records.

#### Sub-Menu Options:
```text
  === SEARCHING ALGORITHMS ===
  1. Linear Search — find first below threshold
  2. Linear Search — find ALL below threshold
  3. Linear Search — by timestamp
  4. Binary Search — by voltage (sorts first)
  5. Find Min voltage
  6. Find Max voltage
  0. Back to main menu
```

| Choice | Function Called | Description & Complexity |
| :--- | :--- | :--- |
| **1** | `linearSearchByVoltage(arr, n, t, true)` | Scans array sequentially until the first voltage dropping below threshold $t$ is found. Returns index and total comparisons. Complexity: $O(n)$. |
| **2** | `linearSearchAllBreach(arr, n, t)` | Exhaustively scans all elements to find every sample that dropped below $t$. Collects total breach count. Complexity: $O(n)$. |
| **3** | `linearSearchByTimestamp(arr, n, ts)` | Locates a specific sensor reading by its exact timestamp ($t \pm 0.05\text{s}$). |
| **4** | `binarySearchByVoltage(arr, n, target)` | **Sorts array first via Merge Sort**, then applies binary search using `mid = (low + high) / 2`. Halves search space each step. Prints step-by-step low/mid/high trace. Complexity: $O(\log n)$. |
| **5** | `findMinVoltage(arr, n)` | Single-pass scan to find the lowest recorded photodiode voltage (representing largest particle). Complexity: $O(n)$. |
| **6** | `findMaxVoltage(arr, n)` | Single-pass scan to find the peak baseline voltage (cleanest water state). Complexity: $O(n)$. |
| **0** | `break` | Returns to main menu. |

---

### 🟢 OPTION 7: Calibration Stack (Undo/Redo)
* **Function in Code:** `calibrationMenu()`
* **Primary Data Structure:** `CalibrationStack` (`StackNode* top`, LIFO policy)
* **DSA Concept:** Stack, Last-In First-Out (LIFO), `push()`, `pop()`, `peek()`.
* **Why it is used:** Optical systems drift over time due to ambient light and temperature. When technicians recalibrate baseline voltages and turbidity thresholds, the system pushes each state onto a Stack. If a calibration causes errors, the technician can **Undo** (`pop()`) back to the previous stable baseline.

#### Sub-Menu Options:
```text
  === CALIBRATION STACK (Undo/Redo) ===
  1. View calibration history (stack)
  2. Push new calibration
  3. Undo last calibration
  4. View current (top) calibration
  5. Show stack size
  0. Back to main menu
```

| Choice | Function Called | Description & Complexity |
| :--- | :--- | :--- |
| **1** | `calibrationStack.display()` | Traverses from `top` downward, displaying full calibration history with timestamps and descriptions. |
| **2** | `calibrationStack.push(state)` | Takes new baseline voltage, turbidity threshold, and description. Creates a `StackNode`, sets `newNode->next = top`, and updates `top`. Complexity: $O(1)$. |
| **3** | `calibrationStack.undo()` | **Pops the top calibration** from the stack and immediately restores hardware thresholds (`laserChamber.setBaseline()` & `turbiditySensor.setThreshold()`). Complexity: $O(1)$. |
| **4** | `calibrationStack.peek()` | Inspects current active calibration parameters without removing the node. Complexity: $O(1)$. |
| **5** | `calibrationStack.getSize()` | Returns current stack depth (how many calibration versions exist). |
| **0** | `break` | Returns to main menu. |

---

### 🟢 OPTION 8: Alert Queue (FIFO & Priority Queue)
* **Function in Code:** `alertQueueMenu()`
* **Primary Data Structure:** `AlertQueue` (`QueueNode* front`, `QueueNode* rear`, FIFO policy + Priority Preemption)
* **DSA Concept:** Queue (First-In First-Out), Priority Queue, pointer splicing.
* **Why it is used:** System alerts (`INFO`, `WARNING`, `ERROR`, `CRITICAL`) are processed in arrival order. However, emergency failsafe alerts (e.g. `PUMP_EMERGENCY_SHUTOFF` or `HIGH_TURBIDITY`) are assigned **Priority Level 1** and jump directly to the head of the queue, preempting routine messages.

#### Sub-Menu Options:
```text
  === ALERT QUEUE ===
  1. View pending alerts
  2. Process all alerts (dequeue all)
  3. Add manual alert
  4. Add priority alert
  5. Process next alert (dequeue one)
  6. Peek front alert
  0. Back to main menu
```

| Choice | Function Called | Description & Complexity |
| :--- | :--- | :--- |
| **1** | `alertQueue.display()` | Traverses from `front` to `rear` displaying all queued alerts with severity levels and timestamps. |
| **2** | `alertQueue.processAll()` | Iteratively calls `dequeue()` until queue is empty, simulating real-time dispatch of telemetry alerts. Complexity: $O(n)$. |
| **3** | `alertQueue.enqueue(alert)` | Standard FIFO insertion at `rear->next`. Complexity: $O(1)$. |
| **4** | `alertQueue.enqueuePriority(alert)` | **Priority insertion:** Inserts critical alarms directly at `front` (`newNode->next = front; front = newNode`). Preempts all standard alerts! Complexity: $O(1)$. |
| **5** | `alertQueue.dequeue()` | Removes and returns the alert at `front`, updating `front = front->next`. Complexity: $O(1)$. |
| **6** | `alertQueue.peek()` | Inspects next upcoming alert without removing it from queue. Complexity: $O(1)$. |
| **0** | `break` | Returns to main menu. |

---

### 🟢 OPTION 9: Detection BST (Tree Operations)
* **Function in Code:** `bstMenu()`
* **Primary Data Structure:** `DetectionBST` (`BSTNode* root`, indexed by `timestamp`)
* **DSA Concept:** Binary Search Tree, recursive insertion, tree traversals (In-Order, Pre-Order, Post-Order), range queries, tree height/balance.
* **Why it is used:** While linked lists require $O(n)$ time to find an event, the BST provides average $O(\log n)$ search by timestamp. Furthermore, In-Order traversal guarantees chronologically sorted output, and Range Query retrieves all microplastic events between time $T_1$ and $T_2$ efficiently.

#### Sub-Menu Options:
```text
  === DETECTION BST (Binary Search Tree) ===
  1. Inorder traversal (chronological)
  2. Preorder traversal
  3. Postorder traversal
  4. Search by timestamp
  5. Range search (time range)
  6. Delete by timestamp
  7. Tree info (size, height)
  0. Back to main menu
```

| Choice | Function Called | Description & Complexity |
| :--- | :--- | :--- |
| **1** | `detectionTree.displayInorder()` | **Left $\rightarrow$ Root $\rightarrow$ Right.** Produces output strictly sorted in chronological timestamp order. Complexity: $O(n)$. |
| **2** | `detectionTree.displayPreorder()` | **Root $\rightarrow$ Left $\rightarrow$ Right.** Useful for cloning/serializing tree structure. Complexity: $O(n)$. |
| **3** | `detectionTree.displayPostorder()` | **Left $\rightarrow$ Right $\rightarrow$ Root.** Used for bottom-up cleanup, memory deletion, and hierarchical aggregation. Complexity: $O(n)$. |
| **4** | `detectionTree.search(timestamp)` | Recursively navigates left if $T < \text{node.ts}$ or right if $T > \text{node.ts}$. Average Complexity: $O(\log n)$. |
| **5** | `detectionTree.rangeSearch(t1, t2)` | Efficiently queries all detection events occurring within a specific time window $[T_1, T_2]$, pruning branches outside the range. |
| **6** | `detectionTree.deleteEvent(timestamp)` | Deletes node by handling 3 cases: leaf node, one child, or two children (replacing with in-order successor). |
| **7** | `detectionTree.getSize()`, `getHeight()` | Recursively computes total node count and maximum depth/height of the tree: $1 + \max(h_{\text{left}}, h_{\text{right}})$. |
| **0** | `break` | Returns to main menu. |

---

### 🟢 OPTION 10: System Dashboard
* **Function in Code:** `showDashboard()` (Desktop) / `showStatus()` (ESP32)
* **Primary Purpose:** Renders a clean ASCII visualization simulating a **Blynk IoT Digital Twin** screen and graphical voltage curve.
* **Visual Components:**
  1. **Connection & State Header:** Displays `ONLINE/OFFLINE` and system state (`IDLE`, `SCANNING`, `FAILSAFE_TRIP`).
  2. **Sensor Gauge Box:** Live photodiode voltage ($V$), water temperature ($^\circ\text{C}$), and turbidity voltage ($V$).
  3. **Detection Counter:** Total count of validated microplastic particles detected.
  4. **ASCII Voltage Attenuation Graph:** Renders a vertical or horizontal ASCII bar plot showing voltage dips below the baseline over time.

---

### 🟢 OPTION 11: View All System Status
* **Function in Code:** `viewAllStatus()`
* **Primary Purpose:** Diagnostic snapshot of all cyber-physical hardware and DSA structures simultaneously.
* **Output Displayed:**
  - **Hardware Telemetry:** Pump state (`RUNNING`/`STOPPED`), Turbidity voltage and classification (`CLEAR`/`MUDDY`), Temperature and correction factor, Laser state (`ON`/`OFF`) and calibrated baseline.
  - **Data Structure Metrics:**
    - Singly Linked List: Total count of logged telemetry nodes.
    - Doubly Linked List: Total microplastic event nodes.
    - Circular Linked List: Current window capacity ($k/10$).
    - Alert Queue: Total pending notifications.
    - Calibration Stack: Total calibration checkpoints saved.
    - Binary Search Tree: Total indexed events and current tree height ($h$).
  - **Memory & Simulation Telemetry:** Total elapsed simulation time ($s$) and (on ESP32) free SRAM heap via `ESP.getFreeHeap()`.

---

### 🟢 OPTION 0: Exit
* **Function in Code:** `main()` loop termination
* **Primary Purpose:** Safely shuts down the system.
  - Ensures peristaltic pump relay is turned off.
  - Deactivates laser diode.
  - Triggers C++ class destructors (`~SensorLinkedList()`, `~EventDoublyList()`, etc.) to traverse and deallocate every dynamic node pointer (`delete node`), preventing memory leaks.
  - Gracefully exits the console application.

---

## 🎯 Quick-Reference Evaluation Cheat Sheet

| Menu Option | Primary Data Structure | Key Functions | Time Complexity | Real-World Hardware Equivalent |
| :---: | :---: | :---: | :---: | :---: |
| **1** | Full Pipeline Integration | `runFullSimulation()` | $O(N)$ samples | Automated water treatment line |
| **2** | Singly Linked List | `append()`, `insertAt()`, `delete()` | $O(1)$ append, $O(n)$ search | Raw sensor black-box data logger |
| **3** | Doubly Linked List | `displayForward()`, `displayReverse()` | $O(1)$ append, $O(1)$ delete | Contamination incident log |
| **4** | Circular Linked List | `insert()`, `getMovingAverage()` | $O(1)$ insert, $O(k)$ avg | Optical signal noise smoothing filter |
| **5** | 5 Sorting Algorithms | `bubbleSort()`, `mergeSort()`, `quickSort()` | $O(n \log n)$ to $O(n^2)$ | Spike categorization & ranking |
| **6** | 2 Searching Algorithms | `linearSearch()`, `binarySearch()` | $O(n)$ vs $O(\log n)$ | Fast threshold breach lookup |
| **7** | LIFO Stack | `push()`, `undo()`, `peek()` | $O(1)$ | Optical calibration rollback |
| **8** | Queue & Priority Queue | `enqueue()`, `enqueuePriority()` | $O(1)$ | Supervisory alarm dispatcher |
| **9** | Binary Search Tree | `insert()`, `inorder()`, `rangeSearch()` | $O(\log n)$ avg, $O(n)$ range | Fast timestamp telemetry index |
| **10** | IoT Digital Twin | `displayDashboard()`, `displayGraph()` | $O(n)$ | Blynk / SCADA live operator UI |
| **11** | Diagnostics | `viewAllStatus()` | $O(1)$ | Embedded system health monitor |
| **0** | Destructors / Exit | Dynamic pointer deallocation | $O(n)$ cleanup | Failsafe shutdown & memory reclaim |
