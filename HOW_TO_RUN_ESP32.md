# 🚀 Complete Step-by-Step Guide: Running the Microplastic Detector DSA Project on ESP32

**Project:** Microplastic Detection & Environmental Analysis System  
**Subject:** Data Structures and Algorithms (DSA) — 3rd Semester  
**Target Board:** ESP32 (NodeMCU-32S / ESP32 Dev Module)  
**Platform:** Arduino IDE (v2.0 or higher)  
**Author:** Akshit Bansal | B.Tech Cyber Physical Systems | MIT Manipal  

---

## 📌 Summary: What Is This Project?

This project combines an **environmental hardware system** (microplastic detection in water using laser scattering and turbidity failsafe) with a **complete Data Structures & Algorithms (DSA) backend**. 

All data structures are **coded from scratch in pure C++ using pointers and classes** (no external libraries needed). The entire program runs directly inside an **ESP32 microcontroller** and is controlled interactively via the **Arduino Serial Monitor**.

### 🌟 The Best Part: Hardware is 100% Optional!
- **With Hardware:** Connects to real photodiode, turbidity sensor, DS18B20 temperature sensor, laser, and relay pump.
- **Without Hardware (Simulation Mode):** If no sensors are connected, the code automatically senses floating analog pins and generates realistic physical sensor readings (turbidity fluctuations, photodiode laser voltage drops, temperature variations).
- **You can run and demonstrate the ENTIRE project with just an ESP32 board and a USB cable plugged into your laptop!**

---

## 🧰 Prerequisites & What You Need

### 1. Hardware Needed
| Item | Description | Required? |
| :--- | :--- | :--- |
| **ESP32 Board** | Any standard ESP32 (ESP32 Dev Module, NodeMCU-32S, ESP-WROOM-32, DOIT DevKit V1) | **YES** |
| **Micro-USB or Type-C Cable** | **MUST BE A DATA CABLE**, not a charge-only cable | **YES** |
| **Turbidity Sensor (Analog)** | Measures water cloudiness (Connected to GPIO 34) | Optional |
| **BPW34 Photodiode + LM358** | Laser detection chamber (Connected to GPIO 35) | Optional |
| **DS18B20 Temp Sensor** | Water temperature (Connected to GPIO 4) | Optional |
| **5V Relay Module** | Controls pump (Connected to GPIO 26) | Optional |
| **650nm Laser Diode** | Laser light source (Connected to GPIO 27) | Optional |

> ⚠️ **CRITICAL USB CABLE WARNING:** Many cheap USB cables sold with power banks or toys are "charging only" (they only have 2 power wires inside and NO data wires). If your computer doesn't make a sound or show a COM port when you plug in the ESP32, **switch your USB cable!**

---

## 💻 Step-by-Step Setup Guide

---

### Step 1: Download & Install Arduino IDE

1. Go to the official Arduino download page:  
   👉 **[https://www.arduino.cc/en/software](https://www.arduino.cc/en/software)**
2. Download **Arduino IDE 2.3.x** (or the latest version) for your operating system (**Windows Win 10 and newer**).
3. Run the downloaded installer (`.exe`) and complete the standard installation:
   - Accept the license agreement.
   - Leave the default install location.
   - If prompted to install device drivers (Adafruit / Arduino USB drivers), click **"Install" / "Yes"**.

---

### Step 2: Install USB-to-UART Drivers (If ESP32 Not Recognized)

Most ESP32 boards communicate with your PC via a USB-to-UART bridge chip (usually either **CH340** or **CP2102**).

1. Plug your ESP32 into your computer via USB.
2. Open **Device Manager** on Windows (Press `Win + X` → click **Device Manager**).
3. Look under **Ports (COM & LPT)**:
   - If you see **"Silicon Labs CP210x USB to UART Bridge (COMx)"** or **"USB-SERIAL CH340 (COMx)"**, your driver is already working! Note down the COM number (e.g., `COM3`, `COM4`, `COM5`).
   - If you see a yellow exclamation mark ⚠️ under **Other Devices** (e.g., "CP2102" or "USB2.0-Serial"), you need to install the driver:
     - **For CP2102 chip:** Download driver from [Silicon Labs CP210x Drivers](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)
     - **For CH340 chip:** Download driver from [WCH CH340 Driver](https://www.wch-ic.com/downloads/CH341SER_EXE.html)
     - Run the installer, restart Arduino IDE, and reconnect the ESP32.

---

### Step 3: Add ESP32 Board Support to Arduino IDE

By default, Arduino IDE only knows basic Arduino boards (Uno, Mega, Nano). We must tell it how to program an ESP32:

1. Open **Arduino IDE**.
2. Go to **File** → **Preferences** (or press `Ctrl + Comma`).
3. Find the field labeled **"Additional boards manager URLs"**.
4. Paste the following official Espressif URL into that box:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   *(If there is already another URL in that box, add a comma `,` at the end and paste this URL).*
5. Click **OK** to save.
6. Now open the **Boards Manager**:
   - In Arduino IDE, click the **Board icon** on the left toolbar (or go to **Tools** → **Board** → **Boards Manager...**).
   - In the search bar at the top, type: `esp32`
   - You will see **"esp32 by Espressif Systems"**.
   - Click **INSTALL** (choose the latest version, e.g., 2.0.x or 3.0.x).
   - *Wait 2-3 minutes for the download and installation to complete.*

---

### Step 4: Verify No External Libraries Are Needed! 🎉

> **Good News:** You **DO NOT** need to install anything from the Arduino Library Manager!
> 
> All required DSA data structures (Linked Lists, Doubly Linked Lists, Circular Buffers, Stacks, Queues, Priority Queues, Binary Search Trees, Sorting algorithms, and Searching algorithms) were written completely from scratch in standard C++ specifically for this project. There are **zero external library dependencies** to worry about.

---

### Step 5: Folder Structure & Opening the Project

Arduino IDE has **one strict rule**:  
> ⚠️ **The project folder name MUST match the `.ino` file name exactly!**

Ensure your folder is named `MicroplasticDetectorESP32` and contains all 11 files:

```text
MicroplasticDetectorESP32/
├── MicroplasticDetectorESP32.ino    <-- Main Arduino sketch file
├── SensorReading.h                  <-- Sensor Reading data class
├── MicroplasticEvent.h              <-- Detection Event data class
├── SensorLinkedList.h               <-- Singly Linked List
├── EventDoublyList.h                <-- Doubly Linked List
├── CircularBuffer.h                 <-- Circular Linked List (Sliding Window)
├── AlertQueue.h                     <-- FIFO Queue & Priority Queue
├── CalibrationStack.h               <-- LIFO Stack (Undo/Redo)
├── DetectionBST.h                   <-- Binary Search Tree (3 Traversals)
├── SortingAlgorithms.h              <-- 5 Sorting Algorithms
└── SearchAlgorithms.h               <-- 2 Searching Algorithms
```

#### How to Open:
1. Double-click **`MicroplasticDetectorESP32.ino`** (inside the `MicroplasticDetectorESP32` folder).
2. Arduino IDE will open.
3. You should see **11 tabs** across the top of Arduino IDE:
   `MicroplasticDetectorESP32 | SensorReading.h | MicroplasticEvent.h | SensorLinkedList.h | ...`
   *(This confirms all header files were detected and loaded properly!)*

---

### Step 6: Select Board & COM Port

1. Connect your ESP32 to the PC with the USB cable.
2. In Arduino IDE top menu, go to **Tools** → **Board** → **esp32** → Select:
   - **"ESP32 Dev Module"**  
   *(or "DOIT ESP32 DEVKIT V1" or "NodeMCU-32S" — all of these work!)*
3. Go to **Tools** → **Port** → Select the COM port corresponding to your ESP32:
   - e.g., `COM3`, `COM4`, `COM7` (do **not** select COM1, as COM1 is usually an internal motherboard port).
4. Go to **Tools** → **Upload Speed** → Select **`115200`** (or `921600` for faster uploads).

---

### Step 7: Upload the Code to ESP32

1. Click the **Upload** button (the right arrow `->` icon in the top left toolbar, or press `Ctrl + U`).
2. The bottom Output window will start compiling the code (`Compiling sketch...`). This takes about 30–60 seconds on the first run.
3. Once compiled, it will begin uploading to the ESP32:
   ```text
   Connecting........_____....._____.....
   ```

#### 🚨 THE FAMOUS ESP32 "BOOT" BUTTON TRICK:
If the output gets stuck at `Connecting........_____.....`:
- **Press and HOLD down the `BOOT` (or `IO0`) button** on your ESP32 board for 2 seconds.
- As soon as you see `Writing at 0x00010000... (xx%)` in the terminal, release the button!
- The upload will finish with:
  ```text
  Leaving...
  Hard resetting via RTS pin...
  Done uploading.
  ```

---

### Step 8: Open Serial Monitor & How to Interact

1. In Arduino IDE, open the **Serial Monitor**:
   - Click the magnifying glass icon in the top right corner (or press `Ctrl + Shift + M`, or go to **Tools** → **Serial Monitor**).
2. **TWO CRITICAL SETTINGS IN SERIAL MONITOR (MUST DO!):**
   - **Baud Rate:** Look at the dropdown menu in the Serial Monitor toolbar. Set it to **`115200 baud`**.  
     *(If it is set to 9600, you will only see garbled unreadable symbols like `⸮`)*.
   - **Line Ending:** Ensure the dropdown is set to **`Newline`** (or `Both NL & CR`).
3. Press the **EN** (or **RST**) physical button on your ESP32 board once to restart it.
4. You will see the project banner appear immediately!

```text
  ==========================================
  |                                        |
  |   MICROPLASTIC DETECTION SYSTEM        |
  |   DSA Project — ESP32 Version          |
  |                                        |
  |   MIT Manipal | B.Tech CPS | Sem 3     |
  |                                        |
  |   Classes, Pointers, Linked Lists,     |
  |   Sorting, Searching, Stack, Queue,    |
  |   Binary Search Tree                   |
  |                                        |
  ==========================================

  >> Open Serial Monitor at 115200 baud
  >> Set line ending to 'Newline'

  ==========================================
   MICROPLASTIC DETECTOR — DSA PROJECT
   MIT Manipal | ESP32 | 3rd Semester
  ==========================================
   1. Run Full Detection Simulation
   2. Sensor Log (Singly Linked List)
   3. Event History (Doubly Linked List)
   4. Sliding Window (Circular LL)
   5. Sorting Algorithms
   6. Searching Algorithms
   7. Calibration Stack
   8. Alert Queue
   9. Detection BST
  10. System Status
  ==========================================
  Enter choice (1-10):
```

5. **How to input commands:**
   - Click into the message input field at the top of the Serial Monitor.
   - Type a number (e.g., `1`) and press **Enter** (or click **Send**).

---

## 🎮 Interactive Menu Walkthrough (How to Test Everything)

Here is a guide on what each menu option does so you can present it to your professors or evaluators:

### Option 1: Run Full Detection Simulation
- **What it does:** Runs the complete end-to-end detection pipeline.
- **Prompt:** Asks `How many samples? (5-30):`. Type `15` and press Enter.
- **Workflow executed:**
  1. Reads DS18B20 temperature sensor & applies optical baseline calibration.
  2. Starts the peristaltic pump relay.
  3. Pre-filtration & turbidity failsafe check (if water turbidity is too high, it pauses to prevent false positives).
  4. Activates 650nm laser chamber and samples photodiode voltage.
  5. Whenever a voltage drop below threshold is detected, it logs a **Microplastic Detection Event**!
  6. Automatically populates all data structures (Singly Linked List, Doubly Linked List, Circular Buffer, Alert Queue, BST).

### Option 2: Sensor Log (Singly Linked List)
- Demonstrates: **Singly Linked List** with dynamic pointer allocation (`Node* next`).
- Sub-menu options:
  - `1. Display all readings`: Traverses from `head` to `tail` and prints all timestamps, voltages, and types.
  - `2. Add manual reading`: Tests `insertAtHead()` or `insertAtEnd()`.
  - `3. Delete reading by index`: Tests node deletion and pointer reconnection.
  - `4. Search by sensor type`: Traverses list to find specific sensors (e.g., `PHOTODIODE`, `TURBIDITY`).
  - `5. List size`: Displays current element count.

### Option 3: Event History (Doubly Linked List)
- Demonstrates: **Doubly Linked List** with two pointers per node (`prev` and `next`).
- Sub-menu options:
  - `1. Display Forward (Oldest -> Newest)`: Traverses `head` → `tail`.
  - `2. Display Reverse (Newest -> Oldest)`: Traverses `tail` → `prev` → `head` (proves bidirectional pointer navigation).
  - `3. Delete event by ID`: Demonstrates deleting a node in $O(1)$ pointer rewiring.
  - `4. Filter by severity`: Filters events marked `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.

### Option 4: Sliding Window (Circular Linked List)
- Demonstrates: **Circular Linked List** where the last node links back to the first (`tail->next = head`).
- Used in real-world DSP to maintain a fixed sliding window (size = 10) of the most recent sensor values.
- When full, it overwrites the oldest node in a circle without needing memory re-allocation.
- Calculates and prints the **real-time Moving Average Voltage**.

### Option 5: Sorting Algorithms Benchmark
- Demonstrates all **5 core sorting algorithms** from the DSA syllabus:
  1. **Bubble Sort** — $O(n^2)$
  2. **Selection Sort** — $O(n^2)$
  3. **Insertion Sort** — $O(n^2)$
  4. **Merge Sort** — $O(n \log n)$ (Divide and Conquer)
  5. **Quick Sort** — $O(n \log n)$ (Pivot partitioning)
- Prints step-by-step element states, comparison counts, swap counts, and execution time in microseconds on the ESP32 chip!

### Option 6: Searching Algorithms Benchmark
- Demonstrates:
  1. **Linear Search** — $O(n)$ scan on unsorted sensor events.
  2. **Binary Search** — $O(\log n)$ divide-and-conquer on sorted timestamp array.
- Compares the number of comparisons made by Linear Search vs Binary Search.

### Option 7: Calibration History Stack
- Demonstrates: **Stack (LIFO — Last In, First Out)** data structure.
- Used for sensor baseline calibration undo/redo:
  - `Push`: Records a new optical/turbidity calibration state.
  - `Pop (Undo)`: Rolls back to the previous baseline voltage setting.
  - `Peek`: Inspects the active active calibration without popping.

### Option 8: Alert Notification Queue
- Demonstrates:
  1. **FIFO Queue (First In, First Out)**: Standard operational alerts processed in arrival order.
  2. **Priority Queue**: High-severity alerts (e.g. `PUMP_OVERCURRENT`, `CRITICAL_TURBIDITY`) jump to the front of the queue ahead of routine alerts!

### Option 9: Detection BST (Binary Search Tree)
- Demonstrates: **Binary Search Tree** ordered by detection timestamp.
- Operations:
  - `In-Order Traversal (Left, Root, Right)`: Outputs all detection events in chronologically sorted order!
  - `Pre-Order Traversal (Root, Left, Right)`: Shows tree hierarchy for serialization.
  - `Post-Order Traversal (Left, Right, Root)`: Used for post-order evaluation / deletion.
  - `Range Query`: Finds all microplastic particles detected between timestamp $T_1$ and $T_2$ in $O(\log n)$ time.

### Option 10: System Status & Free RAM
- Prints microcontroller health, sensor baseline settings, total detection count, and **`ESP.getFreeHeap()`** (shows real-time available RAM in bytes inside the ESP32).

---

## 🔌 Hardware Wiring Guide (If Connecting Real Sensors)

If you have physical sensors and wish to wire them to the ESP32:

```text
               +-----------------------------+
               |         ESP32 DevKit        |
               |                             |
Turbidity OUT  | GPIO 34 (ADC1_CH6)          |
Photodiode OUT | GPIO 35 (ADC1_CH7)          |
DS18B20 Data   | GPIO 4  (Pull-up 4.7k to 3V3|
Relay IN       | GPIO 26                     |
Laser (+)      | GPIO 27                     |
GND            | GND (Common Ground)         |
VIN / 5V       | 5V Power Rail               |
3V3            | 3.3V Power Rail             |
               +-----------------------------+
```

| Sensor Module | Sensor Pin | ESP32 Pin | Note |
| :--- | :--- | :--- | :--- |
| **Turbidity Sensor** | Signal (A0) | **GPIO 34** | Analog voltage 0–3.3V |
| | VCC / GND | 5V / GND | |
| **BPW34 Photodiode + LM358** | Signal OUT | **GPIO 35** | Analog voltage drop on particle |
| | VCC / GND | 3.3V / GND | |
| **DS18B20 Temp Sensor** | Data Pin | **GPIO 4** | 4.7kΩ resistor between Data & 3.3V |
| | VCC / GND | 3.3V / GND | |
| **5V Relay Module (Pump)** | IN / Signal | **GPIO 26** | Controls peristaltic pump |
| | VCC / GND | 5V / GND | |
| **650nm Laser Diode** | Positive (+) | **GPIO 27** | Driven directly or via transistor |
| | Negative (-) | GND | |

*(Remember: If real sensors are not connected, you don't have to change any code! The code detects disconnected pins and runs simulation mode automatically).*

---

## ❓ Troubleshooting & Common Errors

### 1. `A fatal error occurred: Failed to connect to ESP32: Timed out waiting for packet header`
- **Cause:** ESP32 did not enter download mode automatically.
- **Fix:** When Arduino IDE displays `Connecting........_____.....`, **press and hold the `BOOT` button on the ESP32 board** until writing starts, then let go.
- Also make sure you selected the correct COM port in **Tools** → **Port**.

### 2. No COM Port appears under `Tools` → `Port` (Port is greyed out)
- **Cause 1:** Your USB cable is a charge-only cable. **Try 2 or 3 different USB cables** until your PC plays the "USB connected" chime.
- **Cause 2:** The USB-to-UART driver (CP2102 or CH340) is not installed. Follow **Step 2** above.

### 3. Serial Monitor displays weird gibberish characters (`⸮⸮x`)
- **Cause:** Baud rate mismatch.
- **Fix:** In the bottom-right or top-right of the Serial Monitor, change the baud rate dropdown from `9600 baud` to **`115200 baud`**. Then press the `EN` / `RST` button on the ESP32.

### 4. You type a number in Serial Monitor and hit Enter, but nothing happens
- **Cause:** Serial line ending is set to "No line ending".
- **Fix:** Change the line ending dropdown in Serial Monitor from `No line ending` to **`Newline`** (or `Both NL & CR`). The code waits for the newline character to know you finished typing.

### 5. `Compilation error: No such file or directory`
- **Cause:** Arduino IDE couldn't find the `.h` header files.
- **Fix:** Ensure the folder is named **`MicroplasticDetectorESP32`** and that all 10 `.h` files and the 1 `.ino` file are inside the **exact same folder**. When you open `MicroplasticDetectorESP32.ino`, you should see 11 tabs along the top.

### 6. Brownout detector was triggered / ESP32 keeps restarting
- **Cause:** The USB port isn't supplying enough current (especially when relay or laser turns on).
- **Fix:** Plug the USB cable directly into a motherboard USB 3.0 port (blue port) on your PC rather than an unpowered USB hub.

---

## 🎯 How This Satisfies the DSA Project Submission Requirements

| Guideline Requirement | How Our Project Solves It | Implementation File |
| :--- | :--- | :--- |
| **Common Problem Statement** | Microplastic detection in aquatic environments (same as hardware project) | All files |
| **Language: C++** | Pure C++ with dynamic memory & pointers | All `.h` & `.ino` files |
| **Classes & Objects** | `SensorReading`, `MicroplasticEvent`, `Node`, `SensorLinkedList`, `EventDoublyList`, `CircularBuffer`, `DetectionBST`, etc. | `SensorReading.h`, `MicroplasticEvent.h` |
| **Pointers** | All linked data structures use `Node* next`, `Node* prev`, `BSTNode* left/right` | All header files |
| **Singly Linked List** | Sequential sensor log with head/tail pointers | `SensorLinkedList.h` |
| **Doubly Linked List** | Bi-directional event history (forward & reverse traversal) | `EventDoublyList.h` |
| **Circular Linked List** | Sliding window buffer for real-time moving average | `CircularBuffer.h` |
| **Stack (LIFO)** | Sensor baseline calibration history with Undo feature | `CalibrationStack.h` |
| **Queue (FIFO & Priority)** | Real-time alert notifications with critical alert prioritization | `AlertQueue.h` |
| **Binary Search Tree** | Timestamp-indexed search with In-Order, Pre-Order, Post-Order traversals | `DetectionBST.h` |
| **Sorting Algorithms** | Bubble, Selection, Insertion, Merge, Quick Sort with comparison counts | `SortingAlgorithms.h` |
| **Searching Algorithms** | Linear Search ($O(n)$) vs Binary Search ($O(\log n)$) with step counts | `SearchAlgorithms.h` |

---

## 📞 Quick Checklist Before You Send to Friend:
1. Copy the entire folder `MicroplasticDetectorESP32` to a zip file or pendrive.
2. Send this guide (`HOW_TO_RUN_ESP32.md`) along with it.
3. Your friend just needs to follow **Steps 1 to 8** and they will have the entire project running in under 10 minutes!
