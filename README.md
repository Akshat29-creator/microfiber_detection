# 🌊 Microplastic Detection & Environmental Analysis System

### A Cyber-Physical System & Data Structures and Algorithms (DSA) Implementation

**Author:** Akshit Bansal
**Institution:** Manipal Institute of Technology (MIT), Manipal
**Department:** B.Tech Cyber Physical Systems (CPS) | 3rd Semester
**Course Context:** Data Structures and Algorithms (DSA) Lab & Theory Project

---

## 📖 Executive Project Overview

Microplastic contamination in freshwater and municipal supplies poses a severe threat to ecosystems and human health. This project implements a **Low-Cost Optical Attenuation & Turbidity Failsafe Microplastic Detection System** paired with a complete, production-grade **Data Structures and Algorithms (DSA) backend**.

The project is structured into two dual-platform implementations:

1. **`MicroplasticDetector/` (PC Desktop Version):** Pure C++ implementation with interactive terminal UI, built for Windows/Linux/macOS benchmarking, automated simulation, and academic grading via standard C++ compilers (`g++`, Clang, MSVC) or direct execution via `MicroplasticDetector.exe`.
2. **`MicroplasticDetectorESP32/` (Embedded Hardware Version):** Native Arduino/C++ firmware running inside an **ESP32 microcontroller**, interfacing with real analog/digital sensors (Photodiode, Turbidity, DS18B20 Temp, 650nm Laser, Pump Relay) or falling back to self-generating hardware simulation if sensors are unplugged.

---

## 🎯 DSA Syllabus Compliance Matrix

This project strictly adheres to the MIT Manipal DSA Project Guidelines:

| DSA Guideline                      | Requirement                 | How It Is Implemented                                                                               | Core Files                                   |
| :--------------------------------- | :-------------------------- | :-------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| **Common Problem Statement** | Same problem for DSA and ST | Real-time microplastic detection and telemetry tracking                                             | All files                                    |
| **Language**                 | C++ or Python               | **Pure C++ (Standard C++17 & Arduino C++)**                                                   | All files                                    |
| **Classes & Objects**        | **Mandatory**         | Encapsulated classes for readings, events, lists, trees, buffers, sensors                           | `SensorReading.h`, `MicroplasticEvent.h` |
| **Pointers**                 | **Mandatory**         | Raw memory allocation (`new`/`delete`), pointer links (`next`, `prev`, `left`, `right`) | All header files                             |
| **Singly Linked List**       | **Mandatory**         | Sequential sensor log tracking timestamped voltages (`Node* next`)                                | `SensorLinkedList.h`                       |
| **Doubly Linked List**       | **Mandatory**         | Bidirectional detection event history (`prev` & `next` pointers)                                | `EventDoublyList.h`                        |
| **Circular Linked List**     | **Mandatory**         | Fixed-size sliding window (size 10) for real-time moving average                                    | `CircularBuffer.h`                         |
| **Stack (LIFO)**             | Advanced DS                 | Sensor baseline calibration history with Undo/Redo capability                                       | `CalibrationStack.h`                       |
| **Queue & Priority Queue**   | Advanced DS                 | FIFO operational alerts + high-priority alarms that jump the queue                                  | `AlertQueue.h`                             |
| **Binary Search Tree**       | Advanced DS                 | Timestamp-indexed BST with In-Order, Pre-Order, Post-Order traversals & range query                 | `DetectionBST.h`                           |
| **5 Sorting Algorithms**     | Algorithms                  | Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort                                 | `SortingAlgorithms.h`                      |
| **2 Searching Algorithms**   | Algorithms                  | Linear Search ($O(n)$) vs Binary Search ($O(\log n)$) with step telemetry                       | `SearchAlgorithms.h`                       |

---

## 📂 Repository Structure & Complete File Catalog

```text
kirti_project/
├── README.md                           <-- (This Document) Master Architecture & Usage Guide
├── HOW_TO_RUN_ESP32.md                 <-- Dedicated Arduino IDE & ESP32 Flashing Guide
├── MENU_AND_FUNCTIONS_GUIDE.md         <-- Complete Menu Options & Function Architecture Guide
│
├── MicroplasticDetector/               <-- 🖥️ DESKTOP C++ IMPLEMENTATION (PC)
│   ├── main.cpp                        <-- Console CLI entry point & interactive menu
│   ├── MicroplasticDetector.exe        <-- Pre-compiled Windows executable (Double-click to run!)
│   ├── SensorReading.h                 <-- Telemetry data model (OOP encapsulation)
│   ├── MicroplasticEvent.h             <-- Detection event model with severity ratings
│   ├── SensorLinkedList.h              <-- Singly Linked List implementation
│   ├── EventDoublyList.h               <-- Doubly Linked List implementation (Bidirectional)
│   ├── CircularBuffer.h                <-- Circular Linked List implementation (Sliding Window)
│   ├── CalibrationStack.h              <-- LIFO Stack implementation (Undo/Redo)
│   ├── AlertQueue.h                    <-- FIFO Queue & Priority Queue implementation
│   ├── DetectionBST.h                  <-- Binary Search Tree implementation
│   ├── SortingAlgorithms.h             <-- 5 Sorting algorithms with microsecond benchmarking
│   ├── SearchAlgorithms.h              <-- Linear & Binary Search with comparison count
│   ├── TurbiditySensor.h               <-- Turbidity sensor simulation class
│   ├── LaserChamber.h                  <-- 650nm Laser + BPW34 optical chamber model
│   ├── TemperatureSensor.h             <-- DS18B20 temperature compensation model
│   ├── PumpController.h                <-- Peristaltic pump actuator controller
│   └── Dashboard.h                     <-- Blynk IoT Digital Twin simulation dashboard
│
└── MicroplasticDetectorESP32/          <-- ⚡ EMBEDDED FIRMWARE (ESP32 / ARDUINO)
    ├── MicroplasticDetectorESP32.ino   <-- Main Arduino sketch (Serial Monitor CLI)
    ├── HOW_TO_RUN_ESP32.md             <-- Step-by-step setup guide for teammates
    ├── SensorReading.h                 <-- ESP32 RAM-optimized telemetry data model
    ├── MicroplasticEvent.h             <-- ESP32 detection event model
    ├── SensorLinkedList.h              <-- Singly Linked List (Serial formatted)
    ├── EventDoublyList.h               <-- Doubly Linked List (Serial formatted)
    ├── CircularBuffer.h                <-- Circular Linked List (Sliding Window)
    ├── CalibrationStack.h              <-- LIFO Stack (Calibration history)
    ├── AlertQueue.h                    <-- FIFO & Priority Queue (Alerts)
    ├── DetectionBST.h                  <-- Binary Search Tree (Serial formatted)
    ├── SortingAlgorithms.h             <-- 5 Sorts benchmarked via ESP32 hardware micros()
    └── SearchAlgorithms.h              <-- 2 Searches with step comparison telemetry
```

---

## 🔍 Detailed File-by-File Description

### 1. `MicroplasticDetector/` (PC Desktop Version)

| File Name                              | Purpose & Implementation Details                                                                                                                                                                                                                                                                                                                | DSA Concepts                                          |
| :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| **`main.cpp`**                 | Main entry point containing the console-driven UI. Coordinates the full simulation pipeline (Boot$\rightarrow$ Calibrate $\rightarrow$ Pump $\rightarrow$ Turbidity Failsafe $\rightarrow$ Optical Detection $\rightarrow$ Dashboard) and offers interactive menus for testing every data structure. Supports Windows UTF-8 encoding. | Flow control, System orchestration, OOP integration   |
| **`MicroplasticDetector.exe`** | Ready-to-run 64-bit Windows executable compiled with GCC 16.1.0 (`-std=c++17 -O2`). Runs immediately without needing any compiler or IDE.                                                                                                                                                                                                     | Binary executable                                     |
| **`SensorReading.h`**          | Defines`SensorReading` class storing `timestamp`, `voltage`, and `sensorType`. Demonstrates getter/setter methods, operator overloading, and formatted console output.                                                                                                                                                                  | Classes & Objects, Encapsulation                      |
| **`MicroplasticEvent.h`**      | Defines`MicroplasticEvent` class and `SeverityLevel` enum (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). Computes particle size estimates based on photodiode voltage drop ($V_{\text{drop}}$).                                                                                                                                           | Classes & Objects, Enums, Type safety                 |
| **`SensorLinkedList.h`**       | Implements a**Singly Linked List** using dynamically allocated `SensorNode*` pointers. Supports `insertAtHead`, `insertAtEnd`, `deleteByIndex`, `search`, and traversal. Includes memory cleanup in destructor.                                                                                                                 | Pointers, Singly Linked List, Dynamic memory          |
| **`EventDoublyList.h`**        | Implements a**Doubly Linked List** using `EventNode*` with both `next` and `prev` pointers. Allows bidirectional traversal (oldest-to-newest and newest-to-oldest), $O(1)$ node deletion, and filtering by severity.                                                                                                              | Pointers, Doubly Linked List, Bidirectional traversal |
| **`CircularBuffer.h`**         | Implements a**Circular Linked List** where the last node links back to the first (`tail->next = head`). Implements a fixed-size sliding window (capacity 10) to calculate a continuous moving average of voltages without reallocating memory.                                                                                          | Pointers, Circular Linked List, Moving averages       |
| **`CalibrationStack.h`**       | Implements a**Stack (LIFO)** data structure using node pointers. Stores calibration states (`baselineVoltage`, `threshold`, `tempCorrection`). Supports `push()`, `pop()` (Undo), `peek()`, and history inspection.                                                                                                           | Pointers, Stack (LIFO), Undo mechanism                |
| **`AlertQueue.h`**             | Implements both a**FIFO Queue** and a **Priority Queue**. Standard alerts are processed in arrival order, while critical alarms (e.g. `PUMP_EMERGENCY_SHUTOFF`, `HIGH_TURBIDITY`) jump directly to the head of the queue.                                                                                                       | Pointers, Queue (FIFO), Priority Queue                |
| **`DetectionBST.h`**           | Implements a**Binary Search Tree** keyed by event timestamp. Provides recursive $O(\log n)$ insertion, search, minimum/maximum lookup, In-Order traversal (sorted output), Pre-Order traversal, Post-Order traversal, and range queries between $T_1$ and $T_2$.                                                                    | Pointers, Binary Search Tree, Recursion, Traversals   |
| **`SortingAlgorithms.h`**      | Implements**5 sorting algorithms**: Bubble Sort, Selection Sort, Insertion Sort, Merge Sort (Divide & Conquer), and Quick Sort (Lomuto partitioning). Profiles comparison counts, swap operations, and execution time in microseconds.                                                                                                    | Sorting, Algorithmic complexity, Profiling            |
| **`SearchAlgorithms.h`**       | Implements**Linear Search** ($O(n)$) and **Binary Search** ($O(\log n)$). Displays step-by-step evaluation trace and compares total comparison operations.                                                                                                                                                                      | Searching, Time complexity analysis                   |
| **`TurbiditySensor.h`**        | Models the analog turbidity sensor. If voltage falls below 2.5V (indicating muddy water), the system triggers an emergency failsafe to prevent optical false positives.                                                                                                                                                                         | Classes & Objects, Failsafe logic                     |
| **`LaserChamber.h`**           | Models the dark sensing chamber (650nm laser + BPW34 photodiode). Detects voltage dips caused by microplastic light scattering.                                                                                                                                                                                                                 | Physical modeling, Threshold detection                |
| **`TemperatureSensor.h`**      | Models the DS18B20 digital temperature probe. Applies mathematical refractive compensation to calibrate the optical baseline.                                                                                                                                                                                                                   | Thermal compensation, Calibration                     |
| **`PumpController.h`**         | Models the peristaltic pump actuator with relay start, stop, and emergency trip states.                                                                                                                                                                                                                                                         | State machine, Actuator control                       |
| **`Dashboard.h`**              | Simulates the Blynk IoT Digital Twin dashboard, formatting live status, sensor values, and detection counts in clean ASCII borders.                                                                                                                                                                                                             | IoT Digital Twin simulation                           |

---

### 2. `MicroplasticDetectorESP32/` (Arduino / Hardware Version)

| File Name                                   | Purpose & Implementation Details                                                                                                                                                                                                                             | DSA Concepts                                         |
| :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| **`MicroplasticDetectorESP32.ino`** | Main sketch for the ESP32 microcontroller. Configures GPIO pins, handles the Serial Monitor menu loop at 115200 baud, reads physical analog pins with auto-fallback to simulation if pins are floating, and prints free heap memory (`ESP.getFreeHeap()`). | Embedded systems, ISR-safe design, Memory monitoring |
| **`HOW_TO_RUN_ESP32.md`**           | Standalone, beginner-friendly guide explaining how to install Arduino IDE, install ESP32 board support, select ports, upload using the BOOT button trick, and configure the Serial Monitor.                                                                  | Documentation                                        |
| **`SensorReading.h`**               | ESP32-optimized version of`SensorReading` using `float` (to save RAM) and Arduino `String`.                                                                                                                                                            | Embedded C++, RAM optimization                       |
| **`MicroplasticEvent.h`**           | ESP32-optimized detection event model with static ID incrementing.                                                                                                                                                                                           | Embedded C++, Memory compactness                     |
| **`SensorLinkedList.h`**            | Singly Linked List outputting formatted data to`Serial.print()`.                                                                                                                                                                                           | Embedded Linked List                                 |
| **`EventDoublyList.h`**             | Doubly Linked List with forward and reverse traversal over`Serial`.                                                                                                                                                                                        | Embedded Doubly Linked List                          |
| **`CircularBuffer.h`**              | Circular Linked List implementing sliding window smoothing on microcontroller.                                                                                                                                                                               | Embedded Circular Buffer                             |
| **`CalibrationStack.h`**            | LIFO Stack for baseline sensor calibration undo/redo on microcontroller.                                                                                                                                                                                     | Embedded Stack                                       |
| **`AlertQueue.h`**                  | Queue and Priority Queue processing embedded system alerts.                                                                                                                                                                                                  | Embedded Queue                                       |
| **`DetectionBST.h`**                | Binary Search Tree indexing detection events in ESP32 SRAM with 3 traversals.                                                                                                                                                                                | Embedded Tree data structure                         |
| **`SortingAlgorithms.h`**           | Benchmarks Bubble, Selection, Insertion, Merge, Quick Sort using hardware timer`micros()`.                                                                                                                                                                 | Microcontroller algorithm benchmarking               |
| **`SearchAlgorithms.h`**            | Benchmarks Linear vs Binary Search with comparison count on ESP32.                                                                                                                                                                                           | Microcontroller search algorithms                    |

---

## 🚀 How to Run: Desktop Version (`MicroplasticDetector`)

### Option A: Instant Run (No Compiler Needed — Windows)

1. Open the folder **`d:\kirti_project\MicroplasticDetector\`**.
2. Double-click **`MicroplasticDetector.exe`**.
3. A Windows Command Prompt window will open with the ASCII menu.

### Option B: Compiling from Source (g++ / MinGW / Linux / macOS)

1. Open a terminal (PowerShell, Command Prompt, or bash) in `d:\kirti_project\MicroplasticDetector\`.
2. Compile using standard C++17:
   ```bash
   g++ -std=c++17 -Wall -O2 -static -static-libgcc -static-libstdc++ main.cpp -o MicroplasticDetector.exe
   ```

   *(Note: The `-static` flags embed all C++ runtime libraries directly inside the `.exe`, ensuring it runs on any Windows laptop without needing MinGW or missing DLLs like `libgcc_s_seh-1.dll`!)*
3. Run the executable:
   ```bash
   .\MicroplasticDetector.exe
   ```

### 🎮 PC Interactive Menu Walkthrough

```text
  +======================================================+
  |     MICROPLASTIC DETECTION SYSTEM — MAIN MENU        |
  |     DSA Project | MIT Manipal | 3rd Semester         |
  +======================================================+
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
  +======================================================+
```

- **Press 1:** Runs the full end-to-end pipeline (enter `15` samples). You will see the turbidity check, laser readings, detection alerts, and dashboard updates.
- **Press 2:** Inspect the **Singly Linked List** (traversal, manual insert, delete by index, search).
- **Press 3:** Inspect the **Doubly Linked List** (traverse forward and backwards in time!).
- **Press 4:** Inspect the **Circular Linked List** (observe the moving average calculation).
- **Press 5:** Benchmark the **5 Sorting Algorithms** and view comparison counts and execution times.
- **Press 6:** Run **Linear vs Binary Search** to compare search operations.
- **Press 7:** Test the **Calibration Stack** (Push calibration state $\rightarrow$ Pop to Undo).
- **Press 8:** Test the **Alert Queue** (observe high-severity alerts jumping the queue).
- **Press 9:** Test the **Binary Search Tree** (In-Order, Pre-Order, Post-Order, and Range Queries).

---

## ⚡ How to Run: ESP32 Version (`MicroplasticDetectorESP32`)

The ESP32 version runs directly inside microcontroller hardware. Full, illustrated instructions are also available in [HOW_TO_RUN_ESP32.md](file:///d:/kirti_project/HOW_TO_RUN_ESP32.md).

### 1. Requirements

- **ESP32 Development Board** (NodeMCU-32S, ESP32 Dev Module, DOIT DevKit V1, etc.)
- **Micro-USB / Type-C Data Cable** (must support data transfer, not charge-only)
- **Arduino IDE 2.x** (Download from [arduino.cc/en/software](https://www.arduino.cc/en/software))
- *(Hardware sensors are OPTIONAL — code features automatic simulation if pins are open!)*

### 2. Quick Setup in Arduino IDE

1. Open **Arduino IDE** $\rightarrow$ **File** $\rightarrow$ **Preferences** (`Ctrl + ,`).
2. In **Additional boards manager URLs**, paste:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools** $\rightarrow$ **Board** $\rightarrow$ **Boards Manager...**, search for `esp32`, and click **Install**.
4. **No external libraries needed!** All data structures are self-contained C++ headers.

### 3. Uploading Code

1. Open `d:\kirti_project\MicroplasticDetectorESP32\MicroplasticDetectorESP32.ino`. (All 10 `.h` files will open automatically as tabs).
2. Connect ESP32 via USB.
3. Select **Tools** $\rightarrow$ **Board** $\rightarrow$ **esp32** $\rightarrow$ **"ESP32 Dev Module"** (or "NodeMCU-32S").
4. Select your COM Port under **Tools** $\rightarrow$ **Port** (e.g., `COM3`, `COM4`).
5. Click **Upload** (`Ctrl + U`).
   > 💡 **Boot Button Tip:** If upload displays `Connecting........_____.....`, press and hold the **`BOOT`** button on your ESP32 board for 2 seconds until `Writing at 0x...` appears, then let go.
   >

### 4. Running the Serial Monitor

1. Open **Tools** $\rightarrow$ **Serial Monitor** (`Ctrl + Shift + M`).
2. Set Baud Rate to **`115200 baud`**.
3. Set Line Ending to **`Newline`** (or `Both NL & CR`).
4. Press the **EN / RST** button on the ESP32.
5. The menu will appear in the Serial Monitor! Type a number (e.g. `1`) and press **Enter**.

---

## 🔌 Hardware Wiring Diagram (Optional Physical Sensors)

```text
               +---------------------------------------+
               |             ESP32 DevKit              |
               |                                       |
Turbidity OUT  | GPIO 34 (ADC1_CH6)                    |
Photodiode OUT | GPIO 35 (ADC1_CH7 via LM358)          |
DS18B20 Data   | GPIO 4  (4.7kΩ pull-up to 3.3V)       |
Relay IN       | GPIO 26 (Peristaltic Pump Control)    |
Laser (+)      | GPIO 27 (650nm Laser Diode Control)   |
GND            | GND     (Common Ground Rail)          |
VIN / 5V       | 5V      (Power to Relay & Turbidity)  |
3V3            | 3.3V    (Power to Photodiode & Temp)  |
               +---------------------------------------+
```

---

## 💡 Viva & Evaluation Talking Points

When presenting this project to your professor or lab evaluator, highlight these technical achievements:

1. **Why Dual Implementation?**
   - The **PC Version (`MicroplasticDetector`)** allows rapid algorithmic evaluation, high-throughput testing (50+ samples), and cross-platform verification with standard C++ tools.
   - The **ESP32 Version (`MicroplasticDetectorESP32`)** proves embedded feasibility, real-time analog pin reading, hardware timer benchmarking (`micros()`), and memory tracking in SRAM via `ESP.getFreeHeap()`.
2. **Zero Dependency Design:**
   - Many student projects rely on `std::vector` or external Arduino libraries. This project builds **every single data structure from scratch** using raw C++ pointers (`Node* next`, `Node* prev`, `BSTNode* left/right`).
3. **Domain-Specific DSA Integration:**
   - Every data structure was chosen for a specific physical necessity:
     - *Singly Linked List:* Unbounded chronological sensor logging.
     - *Doubly Linked List:* Bidirectional incident review (step backward from an alarm to see prior conditions).
     - *Circular Linked List:* Rolling sliding window for moving-average optical noise filtering.
     - *Stack:* Optical recalibration history with instant rollback (Undo).
     - *Priority Queue:* Safety-critical trip alarms preempting routine packets.
     - *Binary Search Tree:* Timestamp-indexed lookup and range queries in $O(\log n)$ time.
