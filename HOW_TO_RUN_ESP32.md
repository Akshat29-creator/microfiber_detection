# 🚀 Master Setup & Run Guide: Microplastic Detection & Environmental Analysis System

**Project:** Microplastic Detection & Water Analysis System  
**Subject:** Data Structures and Algorithms (DSA) — 3rd Semester  
**Target Microcontroller:** ESP32 (NodeMCU-32S / ESP32 Dev Module / DOIT DevKit V1)  
**Firmware Platform:** Arduino IDE (v2.0 or higher) — C++ Pointer Engine  
**Frontend Platform:** Next.js 16 (React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts)  
**Author:** Akshat Awasthi | B.Tech Cyber Physical Systems (CPS) | MIT Manipal  

---

## 📌 Executive Summary: What Is This Project?

This project combines an **environmental physical computing system** (microplastic detection in water using laser scattering and turbidity failsafe) with a **complete Data Structures & Algorithms (DSA) backend** and an **interactive Dark-Glassmorphism Web Dashboard**.

All 8 core data structures are **coded from scratch in pure C++ using pointers, dynamic memory allocation, and classes** (no standard template library `std::vector` or external data structure libraries).

### 🌟 Flexible Architecture: Dual Operating Modes
1. **Real Hardware Mode (`http://localhost:3001` via `start_real.bat`):**
   - Connects to an ESP32 running `MicroplasticDetectorESP32_WiFi.ino` over high-speed bidirectional WebSockets (Port 81).
   - Reads physical sensors: BPW34 Photodiode + LM358 Op-Amp, Analog Turbidity Sensor, and DS18B20 Digital Temperature Probe.
   - Directly actuates physical hardware: 12V Peristaltic Pump Relay and 650nm Laser Diode.
2. **Demo / Simulation Mode (`http://localhost:3000` via `start_demo.bat`):**
   - **Hardware is 100% Optional!**
   - If you do not have the physical sensors or ESP32 connected, you can run and demonstrate the entire project in Demo Mode.
   - Simulates physical sensor physics (laser beam attenuation, turbidity cloudiness, temperature drift) and executes all 8 C++ DSA structures directly in the browser!
3. **Standalone Serial Monitor Mode:**
   - Run directly on the ESP32 via USB and interact through the Arduino IDE Serial Monitor at 115200 baud without opening a web browser.

---

## 📐 System Architecture Diagram

```mermaid
graph TD
    subgraph Physical Hardware Layer
        PUMP[12V Peristaltic Pump\nGPIO 26 Relay] --> CHAMBER[Detection Chamber]
        LASER[650nm Laser Diode\nGPIO 27] --> CHAMBER
        CHAMBER --> PHOTO[BPW34 Photodiode + LM358\nGPIO 35 Analog ADC1_CH7]
        TURB[Analog Turbidity Sensor\nGPIO 34 Analog ADC1_CH6]
        TEMP[DS18B20 Digital Temp Probe\nGPIO 4 OneWire Bit-Bang]
    end

    subgraph ESP32 Microcontroller Core [Pure C++ Pointer DSA Engine]
        PHOTO --> SLL[1. Singly Linked List\nSensor Log]
        PHOTO --> DLL[2. Doubly Linked List\nEvent History]
        PHOTO --> CIRC[3. Circular Buffer\nSliding Window DSP]
        TURB --> SAFE{Turbidity Failsafe\nThreshold: 2.50V}
        SAFE -->|Breach| ALRT[4. Alert Queue\nFIFO + Priority Preemption]
        TEMP --> CAL[5. Calibration Stack\nLIFO Undo/Redo]
        DLL --> BST[6. Detection BST\nIn/Pre/Post Traversals]
        SLL --> SORT[7. Sorting Algorithms\nBubble, Sel, Ins, Merge, Quick]
        SLL --> SRCH[8. Searching Algorithms\nLinear vs Binary vs Breach]
    end

    subgraph Communication Layer
        ESP32 Core <-->|USB 115200 Baud| SER[Arduino Serial Monitor]
        ESP32 Core <-->|WebSocket Port 81| WS[Bidirectional JSON Stream]
    end

    subgraph Next.js Web Dashboard
        WS <--> REAL[Real Mode Dashboard\nhttp://localhost:3001]
        DEMO[Demo Simulation Dashboard\nhttp://localhost:3000]
    end
```

---

## 🧰 Bill of Materials (BOM) & Complete Pinout Table

### 1. Hardware Components
| Component | Function / Purpose | Required for Demo? | Required for Real? |
| :--- | :--- | :---: | :---: |
| **ESP32 Dev Board** | 32-bit dual-core MCU running C++ DSA engine & WebSocket server | **No** | **Yes** |
| **Micro-USB / Type-C Cable** | **Data Cable** for firmware flashing & 5V power | **No** | **Yes** |
| **BPW34 Photodiode + LM358** | Laser attenuation detector (voltage drop on microplastic particle) | **No** | Optional* |
| **Turbidity Sensor (A0)** | Cloudiness safety failsafe (pauses pump if water too murky) | **No** | Optional* |
| **DS18B20 Temp Probe** | Water temperature monitor with optical baseline compensation | **No** | Optional* |
| **5V Relay Module** | Power gating for 12V peristaltic sample pump | **No** | Optional* |
| **650nm Laser Diode** | Collimated optical light source for flow cell chamber | **No** | Optional* |
| **4.7kΩ Resistor** | Pull-up resistor for DS18B20 OneWire Data line to 3.3V | **No** | Optional* |
| **PC / Laptop** | Windows 10/11 running Node.js and Arduino IDE | **Yes** | **Yes** |

*\*Note: The ESP32 firmware automatically detects floating/unconnected pins and seamlessly falls back to synthetic sensor sampling so you can run the physical board even without sensors attached!*

### 2. Complete ESP32 Hardware Pinout Mapping
> ⚠️ **CRITICAL WIRING RULE:** All sensors, actuators, external power supplies, and the ESP32 **MUST share a common Ground (GND) rail**.

```text
               +--------------------------------------+
               |          ESP32 DevKit V1             |
               |                                      |
Turbidity OUT  | GPIO 34 (ADC1_CH6) - Analog In       |
Photodiode OUT | GPIO 35 (ADC1_CH7) - Analog In       |
DS18B20 Data   | GPIO 4  (Pull-up 4.7kΩ to 3.3V)      |
Relay Signal   | GPIO 26 - Digital Out (Active HIGH)  |
Laser Anode(+) | GPIO 27 - Digital Out (Active HIGH)  |
Ground Rail    | GND (Common Ground for all modules)  |
5V Rail        | VIN / 5V Power from USB or PSU       |
3.3V Rail      | 3V3 Clean Low-Noise Regulated Output |
               +--------------------------------------+
```

| Sensor / Actuator | Module Pin | ESP32 Pin | Logic Voltage | Wiring Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Turbidity Sensor** | Signal (A0) | **GPIO 34** | 0 – 3.3V Analog | Connect VCC to 5V (or 3.3V depending on module) |
| | GND | **GND** | 0V | Common Ground rail |
| **Photodiode (LM358)** | OUT | **GPIO 35** | 0 – 3.3V Analog | Operational amplifier output measuring laser beam |
| | VCC / GND | **3V3 / GND** | 3.3V | Power from ESP32 3.3V rail for low noise |
| **DS18B20 Temp** | DQ (Data) | **GPIO 4** | 3.3V Digital | **Must have 4.7kΩ pull-up resistor** to 3.3V |
| | VDD / GND | **3V3 / GND** | 3.3V | Can use parasitics or normal 3-wire mode |
| **5V Relay (Pump)** | IN / Signal | **GPIO 26** | 3.3V / 5V Digital | HIGH = Relay ON (Pump runs), LOW = Relay OFF |
| | VCC / GND | **5V / GND** | 5V DC | Relay coil needs 5V (from VIN or external adapter) |
| **650nm Laser Diode** | Anode (+) | **GPIO 27** | 3.3V Digital | HIGH = Laser ON, LOW = Laser OFF |
| | Cathode (-) | **GND** | 0V | Connect to ground rail |

---

## 💻 Step-by-Step Installation & Software Setup

Follow these steps once on your laptop to prepare both the ESP32 toolchain and the web dashboard:

---

### Step 1: Install Node.js (Prerequisite for Web Dashboard)
The web dashboard is built using **Next.js 16** and requires **Node.js v18 or higher (LTS recommended)**.

1. Download the official Windows installer from:  
   👉 **[https://nodejs.org/](https://nodejs.org/)** (Choose **LTS** version).
2. Run the `.msi` installer, accept default settings, and finish the installation.
3. Verify installation by opening a new Command Prompt or PowerShell window:
   ```cmd
   node -v
   npm -v
   ```
   *(You should see versions like `v20.x.x` or `v22.x.x` and `npm 10.x.x`).*

---

### Step 2: Install Arduino IDE 2.x
1. Download **Arduino IDE 2.3.x (or newer)** from:  
   👉 **[https://www.arduino.cc/en/software](https://www.arduino.cc/en/software)**
2. Run the installer and grant permission to install any bundled device drivers.

---

### Step 3: Install USB-to-UART Drivers (If ESP32 Not Recognized)
Standard ESP32 boards use a USB-to-UART bridge chip:
- **Silicon Labs CP2102** or **WCH CH340**.

1. Plug your ESP32 into a USB port on your PC using a **known data cable**.
2. Press `Win + X` → open **Device Manager** → expand **Ports (COM & LPT)**:
   - If you see `Silicon Labs CP210x USB to UART Bridge (COMx)` or `USB-SERIAL CH340 (COMx)`, your driver is **already installed**! Note the COM number (e.g., `COM3`, `COM4`).
   - If you see a yellow exclamation mark ⚠️ or `CP2102` / `USB2.0-Serial` under *Other Devices*:
     - **CP2102 Driver:** [Download from Silicon Labs](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)
     - **CH340 Driver:** [Download from WCH](https://www.wch-ic.com/downloads/CH341SER_EXE.html)
     - Install driver, unplug and re-insert your USB cable.

---

### Step 4: Add ESP32 Board Support to Arduino IDE
1. Open **Arduino IDE**.
2. Go to **File** → **Preferences** (or press `Ctrl + Comma`).
3. In the box labeled **Additional boards manager URLs**, paste:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   *(If you already have another URL in this box, separate them with a comma `,`).*
4. Click **OK**.
5. Open the Boards Manager by clicking the **Board Icon** on the left sidebar (or go to **Tools** → **Board** → **Boards Manager...**).
6. Search for `esp32` and locate **esp32 by Espressif Systems**.
7. Click **INSTALL** (wait 2–3 minutes for core tools to download).

---

### Step 5: Install Required Arduino Libraries
1. Open the Library Manager in Arduino IDE:
   - Click the **Book / Library Icon** on the left sidebar (or press `Ctrl + Shift + I`, or go to **Sketch** → **Include Library** → **Manage Libraries...**).
2. In the search box, type: `WebSockets`
3. Look for **WebSockets by Markus Sattler**.
4. Click **INSTALL**.  
   *(This library powers the high-speed WebSocket server on port 81 that talks to our Next.js dashboard).*
5. **Notice on DSA & Sensors:**
   - All 8 data structures (Linked Lists, BST, Stacks, Queues, Sorting, Searching) are built with **zero external libraries**!
   - The DS18B20 temperature sensor uses an in-memory bit-bang OneWire driver written directly in the sketch—no external OneWire or DallasTemperature library is needed!

---

## ⚡ ESP32 Firmware Setup & Flashing

You will find two Arduino sketch directories:
- **`MicroplasticDetectorESP32_WiFi/`** *(Recommended)*: Contains `MicroplasticDetectorESP32_WiFi.ino` with high-speed WebSocket server + Serial Monitor menu + Real Web Dashboard bridge.
- **`MicroplasticDetectorESP32/`**: Contains `MicroplasticDetectorESP32.ino` for standalone Serial-only version (no WiFi required).

---

### Step 1: Configure WiFi Credentials
1. In Arduino IDE, open **`MicroplasticDetectorESP32_WiFi/MicroplasticDetectorESP32_WiFi.ino`**.
2. Check lines 36–37:
   ```cpp
   // ============================================================
   //  WiFi CONFIGURATION — CHANGE THESE!
   // ============================================================
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
3. Replace `"YOUR_WIFI_SSID"` and `"YOUR_WIFI_PASSWORD"` with your actual WiFi name and password.
   > 💡 **PRO TIP (Mobile Hotspot):** The ESP32 only supports **2.4 GHz WiFi**. If your home router is 5 GHz only, turn on your smartphone's Mobile Hotspot and ensure the AP band is set to **2.4 GHz Band**. Set your laptop and ESP32 to connect to this hotspot.

---

### Step 2: Configure Arduino IDE Tools Menu
1. Go to **Tools** → **Board** → **esp32** → Select **ESP32 Dev Module** *(or NodeMCU-32S / DOIT ESP32 DEVKIT V1)*.
2. Go to **Tools** → **Port** → Select your ESP32 COM port (e.g., `COM3`, `COM5`). *(Avoid COM1)*.
3. Go to **Tools** → **Upload Speed** → Select **`115200`** (or `921600` for faster flashing).

---

### Step 3: Compile and Upload
1. Click the **Upload** button (the right arrow `->` icon in the top toolbar, or press `Ctrl + U`).
2. The bottom console will output `Compiling sketch...`.
3. When it reaches:
   ```text
   Connecting........_____....._____.....
   ```
   🚨 **THE BOOT BUTTON TRICK:**
   - **Press and hold the physical `BOOT` (or `IO0`) button** on your ESP32 board for 2 seconds.
   - The moment you see `Writing at 0x00010000... (xx%)`, release the button!
4. The upload will complete with:
   ```text
   Leaving...
   Hard resetting via RTS pin...
   Done uploading.
   ```

---

### Step 4: Open Serial Monitor & Obtain IP Address
1. Click the **Serial Monitor** icon in the top-right corner of Arduino IDE (or press `Ctrl + Shift + M`).
2. Set the baud rate dropdown in the Serial Monitor toolbar to **`115200 baud`**.
3. Set the line ending dropdown to **`Newline`** (or `Both NL & CR`).
4. Press the **EN** (or **RST**) reset button on the ESP32 board once.
5. Watch the boot sequence print:
   ```text
   ==========================================
   |                                        |
   |   MICROPLASTIC DETECTION SYSTEM        |
   |   DSA Project — ESP32 + WiFi Version   |
   |                                        |
   ==========================================
   [WiFi] Connecting to: MyHomeWiFi ..........
   [WiFi] Connected successfully!
   [WiFi] ESP32 IP Address: 192.168.1.45
   [WS] WebSocket server started on port 81
   ```
6. 📝 **Note down the ESP32 IP Address** (e.g., `192.168.1.45`). You will paste this into the Web Dashboard!

---

## 🌐 Web Dashboard Setup & Execution

The dashboard is located in the **`dashboard/`** folder. It features dedicated execution profiles and batch scripts.

---

### Step 1: Install Dashboard Dependencies (First-Time Only)
1. Open a Command Prompt or PowerShell terminal.
2. Navigate to the dashboard directory:
   ```cmd
   cd d:\kirti_project\dashboard
   ```
3. Run the installation command:
   ```cmd
   npm install
   ```
   *(This installs Next.js 16, React 19, Framer Motion, Recharts, Lucide Icons, and Tailwind CSS v4).*

---

### Step 2: Running the Dashboard

We have provided convenient one-click batch scripts in `d:\kirti_project\dashboard`:

#### 🟢 Option A: Demo Mode (Port 3000 — Simulation / No ESP32 needed)
- **Method 1:** Double-click **`dashboard/start_demo.bat`** in Windows File Explorer.
- **Method 2:** Or run in terminal:
  ```cmd
  cd d:\kirti_project\dashboard
  npm run demo
  ```
- Open your browser to: **`http://localhost:3000`**
- **What it does:** Runs with 100% simulated sensor telemetry and browser-evaluated C++ DSA models. Perfect for practice, quick demonstration, or when hardware is not plugged in.

#### 🔵 Option B: Real Hardware Mode (Port 3001 — Physical ESP32 Hardware)
- **Method 1:** Double-click **`dashboard/start_real.bat`** in Windows File Explorer.
- **Method 2:** Or run in terminal:
  ```cmd
  cd d:\kirti_project\dashboard
  npm run real
  ```
- Open your browser to: **`http://localhost:3001`**
- **What it does:** Starts in authentic real-hardware mode awaiting connection to your ESP32. All telemetry graphs, voltages, and data structures populate live from physical sensor readings.

---

### Step 3: Stopping the Servers Cleanly
To stop the servers or release ports 3000 and 3001:
- Double-click **`dashboard/stop_servers.bat`**.
- It safely closes all running Node processes and clears occupied ports.

---

## 🔗 Connecting Dashboard to the Physical ESP32

When running in **Real Hardware Mode** (`http://localhost:3001`):

1. Look at the top navigation bar of the dashboard.
2. You will see an IP input box pre-filled with `192.168.1.x` and an orange badge stating **`Disconnected`**.
3. Type the **ESP32 IP Address** you obtained from the Arduino Serial Monitor (e.g., `192.168.1.45`).
4. Click the green **"Connect"** button.
5. Within 1 second, the connection badge changes to a glowing emerald:  
   `Connected (ws://192.168.1.45:81)`
6. **Instant Bi-Directional Synchronization:**
   - The Photodiode Voltage, Water Temperature, and Turbidity HUD dials immediately display live physical readings.
   - Flipping the **"Laser Active"** or **"Relay Pump"** switches on the dashboard sends instant commands to the ESP32, triggering physical relay clicks and turning the laser diode on/off in real-time!

---

## 🧪 Testing the Complete Pipeline & Data Structures

Here is the recommended step-by-step demonstration sequence to showcase the system to your professors or evaluators:

### 1. Execute Detection Simulation (`/simulation`)
1. Go to the **Simulation** page (`http://localhost:3001/simulation` or `http://localhost:3000/simulation`).
2. Adjust sample count slider (e.g., 15 samples) and click **"Run Detection Simulation"**.
3. Watch the end-to-end flow:
   - **Phase 1: Baseline Calibration** — Reads DS18B20 water temperature probe and pushes optical baseline state onto the LIFO Stack.
   - **Phase 2: Pump Actuation** — Relay closes, activating fluid flow through the chamber.
   - **Phase 3: Turbidity Failsafe Check** — Verifies water clarity ($> 2.50\text{V}$). If water is too cloudy, it halts the pump to prevent false optical scattering.
   - **Phase 4: Laser Chamber Scattering** — 650nm laser activates; photodiode measures optical attenuation.
   - **Phase 5: Microplastic Logging** — Drops below threshold trigger detection events and push alerts to the Priority Queue.
   - **Phase 6: Data Structure Hydration** — Automatically populates the Singly Linked List, Doubly Linked List, Circular Buffer, and Binary Search Tree!

---

### 2. Guided Tour of All 10 Web Dashboard Pages

| Page Route | DSA Concept Demonstrated | Key Features & Interactive Controls |
| :--- | :--- | :--- |
| **`/` (Overview)** | System Telemetry & Aggregator | Live HUD dials, real-time voltage chart, laser/pump hardware toggles, and live system alert notification ticker. |
| **`/simulation`** | End-to-End Pipeline & Failsafe | Automated multi-phase test sequence with step-by-step hardware status indicators. |
| **`/sensor-log`** | **Singly Linked List (`Node* next`)** | Sequential sensor log. Shows pointer memory addresses, node indices, manual insertion at head/tail, index-based node deletion, and sensor-type filtering. |
| **`/events`** | **Doubly Linked List (`prev` and `next`)** | Microplastic breach event history. Interactive **Forward Traversal (Head $\rightarrow$ Tail)** and **Reverse Traversal (Tail $\rightarrow$ Head)** to prove bidirectional pointer navigation. $O(1)$ node deletion by ID. |
| **`/sliding-window`** | **Circular Linked List (`tail->next = head`)** | 10-element circular ring buffer. Shows head/tail pointer progression, automatic overwriting of oldest elements, and real-time DSP **Moving Average Voltage**. |
| **`/calibration`** | **Stack (`LIFO` — Last-In, First-Out)** | Sensor baseline calibration state engine. Interactive `Push` (record new optical baseline), `Pop / Undo` (revert to previous baseline), and `Peek` current state. |
| **`/alerts`** | **FIFO Queue & Priority Queue** | Real-time system alert feed. Routine status alerts processed in arrival order (FIFO), while safety-critical breach alerts (`CRITICAL_TURBIDITY`, `PUMP_OVERCURRENT`) jump to the front of the line! |
| **`/bst`** | **Binary Search Tree** | Dynamic recursive visual tree rendering indexed by timestamp. Interactive tree traversals: **In-Order** (chronological sort), **Pre-Order** (serialization), **Post-Order**, **Range Query** between timestamps $T_1$ and $T_2$, and manual node insertion. |
| **`/sorting`** | **5 Sorting Algorithms** | Sorts real photodiode voltage readings using **Bubble Sort**, **Selection Sort**, **Insertion Sort**, **Merge Sort**, and **Quick Sort**. Features step-by-step state animations, comparison counts, swap counts, and microsecond-level timing comparisons. |
| **`/searching`** | **Searching Algorithms** | Side-by-side performance showdown between **Linear Search ($O(n)$)** and **Binary Search ($O(\log n)$)** with comparison counters. Includes an automated Breach Event Scanner. |
| **`/system`** | **System Diagnostics & RAM** | Real-time hardware health monitor displaying ESP32 Free Heap memory (`ESP.getFreeHeap()`), 240 MHz CPU clock, WiFi RSSI signal strength, device uptime, and GPIO pin statuses. |

---

## ⚙️ Interactive Arduino Serial Monitor (Alternative Mode)

If you wish to run and demonstrate the project entirely through the **Arduino IDE Serial Monitor** without a browser:

1. Flash either `MicroplasticDetectorESP32.ino` or `MicroplasticDetectorESP32_WiFi.ino`.
2. Open Serial Monitor (`Ctrl + Shift + M`) at **115200 baud** with line ending set to **Newline**.
3. Press `EN` on the ESP32. You will see the main interactive text menu:
   ```text
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
4. Type a number (e.g., `1` for simulation, `5` for sorting, `9` for BST) and press Enter to navigate through submenus and perform live pointer operations!

---

## 🛠️ Comprehensive Troubleshooting & FAQ

### 1. Arduino IDE says `Failed to connect to ESP32: Timed out waiting for packet header`
- **Cause:** ESP32 did not enter UART download mode automatically.
- **Fix:** When Arduino IDE console prints `Connecting........_____.....`, **press and hold the `BOOT` button on the ESP32** for 2 seconds until upload begins, then release.

### 2. COM Port is greyed out or missing in Arduino IDE
- **Cause 1:** Your USB cable is "charge-only". Many phone charging cables have no internal data wires. **Switch to a known USB data cable.**
- **Cause 2:** USB bridge drivers (CP2102 or CH340) are missing. Revisit **Step 3** in Software Setup.

### 3. Serial Monitor displays garbled symbols (`⸮⸮x~`)
- **Cause:** Baud rate mismatch.
- **Fix:** Change the baud rate dropdown at the bottom or top of the Serial Monitor to **`115200 baud`**. Press the `EN` / `RST` button on the board.

### 4. ESP32 fails to connect to WiFi (`Connecting to: ... [Failed]`)
- **Cause 1:** ESP32 does **NOT support 5 GHz WiFi networks**. Ensure your router or mobile hotspot is broadcasting on **2.4 GHz**.
- **Cause 2:** Typing mistake in `WIFI_SSID` or `WIFI_PASSWORD` on lines 36–37 of the `.ino` file. Note that passwords are case-sensitive.

### 5. Web Dashboard says `Connection Error (ws://192.168.x.x:81)`
- **Check 1:** Ensure your laptop and the ESP32 are connected to the **exact same WiFi router or mobile hotspot**.
- **Check 2:** Verify you entered the exact IP address shown in the Serial Monitor.
- **Check 3:** Ensure Windows Firewall is not blocking incoming/outgoing connections on port 81.

### 6. Port 3000 or 3001 is already in use (`EADDRINUSE`)
- **Cause:** A previous Node server is still running in the background.
- **Fix:** Double-click **`dashboard/stop_servers.bat`** to instantly kill orphaned Node processes and free both ports.

### 7. ESP32 keeps resetting when the Relay or Laser triggers (`Brownout detector was triggered`)
- **Cause:** The USB port on your PC is not supplying sufficient current when the 5V relay coil energizes.
- **Fix:** Plug your USB cable into a blue USB 3.0 motherboard port on your PC, or use an external 5V 2A power supply with shared common ground.

---

## 🎓 Academic Viva & Presentation Defense Guide

When presenting this project to examiners or professors, use this quick reference mapping:

| Project Component | Syllabus Concept | Theoretical Complexity | Embedded Implementation Detail |
| :--- | :--- | :---: | :--- |
| **Sensor Log** | Singly Linked List | $O(1)$ Insert, $O(n)$ Search | Dynamic `Node* next` allocation for continuous time-series sensor sampling. |
| **Event History** | Doubly Linked List | $O(1)$ Head/Tail, $O(1)$ Delete | `prev` and `next` pointers allow forward playback and reverse historical analysis. |
| **Sliding Window** | Circular Linked List | $O(1)$ Insertion | Fixed ring buffer (`tail->next = head`) computing DSP moving average without reallocation. |
| **Calibration** | Stack (LIFO) | $O(1)$ Push, $O(1)$ Pop | Undo/Redo stack for optical baseline voltages and turbidity threshold drift. |
| **Alert Notification** | Queue (FIFO & Priority) | $O(1)$ Enqueue / Dequeue | Normal alerts handled in arrival order; safety breach alerts jump ahead via priority preemption. |
| **Detection Tree** | Binary Search Tree | $O(\log n)$ Average, $O(n)$ Worst | Indexed by timestamp. In-Order traversal provides chronologically sorted output; supports range queries. |
| **Voltage Benchmark**| Sorting Algorithms | Bubble/Sel/Ins: $O(n^2)$<br>Merge/Quick: $O(n \log n)$ | Sorts real photodiode voltage array with hardware microsecond timing and comparison counters. |
| **Event Search** | Searching Algorithms | Linear: $O(n)$<br>Binary: $O(\log n)$ | Demonstrates exponential efficiency gain of Binary Search on sorted event timestamps. |

---

## 📁 Repository Directory Structure

```text
kirti_project/
├── HOW_TO_RUN_ESP32.md                 <-- Master Setup & Run Guide (This File)
├── MENU_AND_FUNCTIONS_GUIDE.md         <-- Deep-dive into all C++ DSA functions
├── README.md                           <-- Academic overview & report
├── MicroplasticDetectorESP32_WiFi/     <-- Primary Arduino ESP32 WiFi + Dashboard Sketch
│   ├── MicroplasticDetectorESP32_WiFi.ino <-- WiFi + WebSocket + Serial Sketch (Primary)
│   └── *.h                             <-- All 10 DSA Header Files
├── MicroplasticDetectorESP32/          <-- Standalone Offline Serial Arduino Sketch
│   ├── MicroplasticDetectorESP32.ino      <-- Standalone Offline Serial Sketch
│   └── *.h                             <-- All 10 DSA Header Files
└── dashboard/                          <-- Next.js 16 Web Dashboard
    ├── package.json                    <-- Scripts: "demo" (port 3000), "real" (port 3001)
    ├── start_demo.bat                  <-- 1-Click Launch Demo Mode (Port 3000)
    ├── start_real.bat                  <-- 1-Click Launch Real Mode (Port 3001)
    ├── stop_servers.bat                <-- 1-Click Stop Dashboard Servers
    ├── app/                            <-- 10 Next.js Page Routes (Overview, BST, etc.)
    ├── components/                     <-- Reusable Dark-Glass UI components
    └── context/                        <-- WebSocket & Simulation Context state engine
```

---
*Developed with pride at **MIT Manipal** | Department of Cyber Physical Systems | 3rd Semester Data Structures & Algorithms.*
