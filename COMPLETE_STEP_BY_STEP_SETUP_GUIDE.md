# 📘 Complete Step-by-Step Setup Guide: Hardware Wiring, Software Setup & Web Connection

**Project:** Microplastic Detection & Water Environmental Analysis System  
**Subject:** Cyber-Physical Systems (CPS) & Data Structures and Algorithms (DSA)  
**Author:** Akshat Awasthi | B.Tech Cyber Physical Systems (CPS) | MIT Manipal  
**Target Hardware:** ESP32 DevKit V1 / NodeMCU-32S  
**Target Software:** Next.js 16 (Node.js LTS), Arduino IDE 2.x, WebSocket Telemetry (Port 81)  

---

## 📋 Table of Contents
1. [System Overview & Architecture](#-system-overview--architecture)
2. [Hardware Components & Pin-by-Pin Wiring Guide](#-hardware-components--pin-by-pin-wiring-guide)
   - [Master Pinout Table](#master-pinout-table)
   - [Visual ASCII Circuit Schematic](#visual-ascii-circuit-schematic)
   - [Detailed Connection Steps for Every Part](#detailed-connection-steps-for-every-part)
3. [PC Software Installation (From Zero)](#-pc-software-installation-from-zero)
   - [Step 1: Install Node.js LTS](#step-1-install-nodejs-lts)
   - [Step 2: Install Arduino IDE 2.x](#step-2-install-arduino-ide-2x)
   - [Step 3: Install USB Drivers (CP2102 / CH340)](#step-3-install-usb-drivers-cp2102--ch340)
   - [Step 4: Install ESP32 Board Core in Arduino IDE](#step-4-install-esp32-board-core-in-arduino-ide)
   - [Step 5: Install Required Arduino WebSockets Library](#step-5-install-required-arduino-websockets-library)
4. [Flashing Firmware onto the ESP32](#-flashing-firmware-onto-the-esp32)
   - [Step 1: Network Topology & WiFi Setup (Which Device Hosts the Hotspot?)](#step-1-network-topology--wifi-setup-which-device-hosts-the-hotspot)
   - [Step 2: Configure WiFi Credentials in Firmware](#step-2-configure-wifi-credentials-in-firmware)
   - [Step 3: Arduino IDE Board & Port Configuration](#step-3-arduino-ide-board--port-configuration)
   - [Step 4: Upload Sketch (The Boot Button Trick)](#step-4-upload-sketch-the-boot-button-trick)
   - [Step 5: Open Serial Monitor & Find ESP32 IP Address](#step-5-open-serial-monitor--find-esp32-ip-address)
5. [Installing & Running the Web Dashboard](#-installing--running-the-web-dashboard)
   - [Step 1: Install Dashboard Dependencies (`npm install`)](#step-1-install-dashboard-dependencies-npm-install)
   - [Step 2: Launching Real Hardware Mode (Port 3001)](#step-2-launching-real-hardware-mode-port-3001)
   - [Step 3: Launching Demo Simulation Mode (Port 3000)](#step-3-launching-demo-simulation-mode-port-3000)
   - [Step 4: Stopping Dashboard Servers (`stop_servers.bat`)](#step-4-stopping-dashboard-servers-stop_serversbat)
6. [Connecting the Webpage to the ESP32](#-connecting-the-webpage-to-the-esp32)
   - [Step-by-Step Connection Process](#step-by-step-connection-process)
   - [Understanding the IP Address & Port `:81`](#understanding-the-ip-address--port-81)
   - [Visual Connection Status Indicators](#visual-connection-status-indicators)
7. [Hardware Testing & System Verification](#-hardware-testing--system-verification)
8. [Troubleshooting & Frequently Asked Questions (FAQ)](#-troubleshooting--frequently-asked-questions-faq)

---

## 🌟 System Overview & Architecture

This project connects physical water quality sensors and fluid actuators directly to a real-time dark-mode web telemetry dashboard.

```text
[ Physical Sensors & Actuators ]
   │
   ├── Turbidity Sensor (ADC1_CH6 / GPIO 34)
   ├── Photodiode + Laser Chamber (ADC1_CH7 / GPIO 35 + GPIO 27)
   ├── DS18B20 Temp Probe (GPIO 4 OneWire)
   └── 12V Pump via 5V Relay (GPIO 26)
   │
   ▼
[ ESP32 Microcontroller Core ]
   │  - 8 In-Memory C++ DSA Structures (Linked Lists, BST, Stack, Queue, etc.)
   │  - FreeRTOS Task Scheduling & Real-time Sensor ADC Sampling
   │  - WebSockets Server running on Port 81
   │
   ▼ (WiFi 2.4 GHz WebSocket Stream / Port 81)
   │
[ Next.js 16 Web Dashboard ] ─── http://localhost:3001 (Real Mode)
                                 http://localhost:3000 (Demo Mode)
```

---

## 🔌 Hardware Components & Pin-by-Pin Wiring Guide

### Master Pinout Table

| Component | Component Pin | ESP32 DevKit Pin | Voltage Level | Notes / Protection |
| :--- | :--- | :--- | :--- | :--- |
| **Turbidity Sensor Module** | `Signal / A0` | **GPIO 34** | 0 to 3.3V Analog | Input-only pin (ADC1_CH6). |
| | `VCC` | **VIN (5V) or 3V3** | 5V / 3.3V DC | Check module voltage rating. |
| | `GND` | **GND** | 0V | Connect to common ground rail. |
| **Photodiode Detector (LM358)** | `Analog OUT` | **GPIO 35** | 0 to 3.3V Analog | Input-only pin (ADC1_CH7). |
| | `VCC` | **3V3** | 3.3V DC | Low-noise regulated 3.3V rail. |
| | `GND` | **GND** | 0V | Connect to common ground rail. |
| **DS18B20 Temperature Probe** | `Data (Yellow/White)`| **GPIO 4** | 3.3V Digital | **Requires 4.7kΩ resistor to 3.3V** |
| | `VCC (Red)` | **3V3** | 3.3V DC | Power rail. |
| | `GND (Black)` | **GND** | 0V | Common ground rail. |
| **5V Relay Module (Pump Switch)**| `IN / Signal` | **GPIO 26** | 3.3V Digital Out | Active HIGH (HIGH = Pump ON). |
| | `VCC` | **VIN (5V)** | 5V DC | Relay coil requires 5V to trigger. |
| | `GND` | **GND** | 0V | Common ground rail. |
| **650nm Red Laser Diode** | `Anode (+ / Red)` | **GPIO 27** | 3.3V Digital Out | HIGH = Laser ON, LOW = OFF. |
| | `Cathode (- / Black)`| **GND** | 0V | Common ground rail. |
| **12V Peristaltic Sample Pump** | `Positive (+)` | **Relay NO** | 12V DC | Switched through Relay contact. |
| | `Negative (-)` | **12V PSU (-)** | 0V | Direct to 12V adapter Ground. |
| **12V Power Adapter** | `Positive (+)` | **Relay COM** | 12V DC | Input to relay common terminal. |
| | `Negative (-)` | **GND & Pump (-)**| 0V | Shared common ground rail. |

---

### Visual ASCII Circuit Schematic

```text
                                 +-----------------------------+
                                 |       ESP32 DevKit V1       |
                                 |                             |
Turbidity Analog (A0) ---------->| GPIO 34 (ADC1_CH6)          |
Photodiode Output -------------->| GPIO 35 (ADC1_CH7)          |
DS18B20 Temp Data -------------->| GPIO 4                      |
                                 |    ▲                        |
   3.3V Rail ---[ 4.7kΩ Resistor ]----+                        |
                                 |                             |
Relay Control Signal <-----------| GPIO 26                     |
650nm Laser Diode (+) <----------| GPIO 27                     |
                                 |                             |
Common Breadboard GND <==========| GND                         |
Common Breadboard 3.3V <=========| 3V3                         |
5V Power Rail (from USB) <=======| VIN                         |
                                 +-----------------------------+

======================= RELAY & PUMP WIRING =======================

        [ 12V DC Power Supply (+) ]
                     │
                     ▼
          +--------------------+
          |    5V Relay Module |
          |                    |
          |  [ COM ]  Terminal | <── 12V DC (+) Wire
          |                    |
          |  [ NO  ]  Terminal | ───► [ Pump (+) Red Wire ]
          +--------------------+
                                      [ Pump (-) Black Wire ]
                                                 │
        [ 12V DC Power Supply (-) ] <────────────┴───► Common Breadboard GND
```

---

### Detailed Connection Steps for Every Part

#### 1. Common Ground & Power Rails (Crucial First Step)
1. Place the ESP32 onto a solderless breadboard.
2. Connect one of the **GND** pins on the ESP32 to the blue/negative **(-) power rail** of the breadboard. This is your **Common Ground**.
3. Connect the **3V3** pin of the ESP32 to the red/positive **(+) power rail** on one side (3.3V Rail).
4. Connect the **VIN** pin (5V from USB) to a separate rail for components that need 5V (like the Relay Module).
> ⚠️ **Golden Rule:** Every sensor, actuator, power supply, and ESP32 must connect to the **same GND rail**. Without a common ground, voltage signals float unpredictably!

---

#### 2. Photodiode Sensor Module & Laser Chamber (GPIO 35 & GPIO 27)
1. **Photodiode Board (BPW34 + LM358 Op-Amp)**:
   - **VCC** ➔ Connect to **3V3** rail.
   - **GND** ➔ Connect to **GND** rail.
   - **Analog OUT (or A0)** ➔ Connect to **GPIO 35** on the ESP32.
2. **650nm Laser Diode**:
   - **Red wire (+)** ➔ Connect to **GPIO 27** on the ESP32.
   - **Blue/Black wire (-)** ➔ Connect to **GND** rail.
3. **Physical Optical Alignment**:
   - Place the Laser and the Photodiode on opposite sides of a clear water tube or flow cuvette.
   - Align them so the laser beam shines straight onto the photodiode window. When clear water is inside, baseline voltage reads **3.0V – 3.3V**. When a microplastic particle crosses the beam, it scatters the light, causing a rapid dip to **1.5V – 2.4V**.

---

#### 3. Turbidity Sensor (GPIO 34)
1. Plug the probe cable into the turbidity adapter circuit board.
2. Ensure the toggle switch on the adapter board is set to **A** (Analog output), not D (Digital).
3. Connect the adapter board pins:
   - **VCC** ➔ Connect to **VIN (5V)** rail (or 3.3V if your module specifies 3.3V).
   - **GND** ➔ Connect to **GND** rail.
   - **Signal / A0** ➔ Connect to **GPIO 34** on the ESP32.
4. *Failsafe Threshold:* In clean water, voltage is typically **> 2.50V**. If water becomes murky or muddy (< 2.50V), the firmware triggers an emergency failsafe to stop the pump.

---

#### 4. DS18B20 Waterproof Temperature Sensor (GPIO 4)
The DS18B20 digital sensor uses a 1-Wire communication protocol.
1. Identify the 3 wires:
   - **Red Wire** = VDD (Power)
   - **Black Wire** = GND (Ground)
   - **Yellow (or White) Wire** = Data
2. Connections:
   - **Red Wire** ➔ Connect to **3V3** rail.
   - **Black Wire** ➔ Connect to **GND** rail.
   - **Yellow/White Wire** ➔ Connect to **GPIO 4** on the ESP32.
3. **Install the 4.7kΩ Pull-Up Resistor**:
   - Insert one leg of the **4.7kΩ resistor** into the breadboard row with the **Yellow Data wire (GPIO 4)**.
   - Insert the other leg into the breadboard row with the **3.3V Power Rail**.
   *(Without this resistor, the sensor cannot pull the signal line high, and the ESP32 will read -127°C or fail).*

---

#### 5. 5V Relay Module & 12V Peristaltic Pump (GPIO 26)
1. **Low-Voltage Signal Side (3 Pins)**:
   - **VCC** ➔ Connect to **VIN (5V)** on the ESP32 (relay electromagnets need 5V).
   - **GND** ➔ Connect to **GND** rail.
   - **IN / Signal** ➔ Connect to **GPIO 26** on the ESP32.
2. **High-Voltage Load Side (3 Screw Terminals)**:
   - Identify **COM** (Common), **NO** (Normally Open), and **NC** (Normally Closed).
   - Take the **(+) positive wire** from your **12V DC power adapter** and screw it into **COM**.
   - Screw a wire from **NO** to the **(+) Red wire** of the **12V Peristaltic Pump**.
   - Connect the **(-) Black wire** of the pump directly to the **(-) negative wire** of your 12V adapter and the breadboard **GND**.
3. *How it works:* When GPIO 26 is set to `HIGH`, the relay clicks on, bridging `COM` to `NO`, completing the 12V circuit and running the pump!

---

## 💻 PC Software Installation (From Zero)

Follow these steps on your Windows PC or laptop:

---

### Step 1: Install Node.js LTS
The web dashboard requires Node.js to run its development and production server.

1. Open your browser and go to: **[https://nodejs.org/](https://nodejs.org/)**
2. Download the **LTS (Long Term Support)** installer (e.g., Node.js v20.x or v22.x).
3. Open the downloaded `.msi` file.
4. Click **Next** through the setup wizard, accept the license agreement, leave default settings selected, and click **Install**.
5. Once completed, verify the installation:
   - Press `Win + R`, type `cmd`, and press Enter.
   - Run:
     ```cmd
     node -v
     npm -v
     ```
   - Both commands should print version numbers (e.g., `v20.18.0` and `10.8.2`).

---

### Step 2: Install Arduino IDE 2.x
1. Go to: **[https://www.arduino.cc/en/software](https://www.arduino.cc/en/software)**
2. Download **Arduino IDE 2.3.x (Windows Win 10 and newer 64-bit)**.
3. Run the installer and finish setup.

---

### Step 3: Install USB Drivers (CP2102 / CH340)
ESP32 boards communicate with your PC via a USB-to-UART chip.

1. Connect your ESP32 board to your PC using a **Micro-USB or USB-C Data Cable** (make sure it is a data cable, not a charging-only cable).
2. Right-click the Windows Start button ➔ Click **Device Manager**.
3. Expand **Ports (COM & LPT)**:
   - If you see `Silicon Labs CP210x USB to UART Bridge (COMx)` or `USB-SERIAL CH340 (COMx)`, your driver is installed and ready! Note down the COM port number (e.g., `COM3`, `COM4`).
   - If you see a yellow exclamation mark ⚠️ under *Other devices*:
     - For CP2102: [Download Silicon Labs CP210x VCP Driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)
     - For CH340: [Download CH341SER Driver](https://www.wch-ic.com/downloads/CH341SER_EXE.html)
     - Run the installer and plug the ESP32 back in.

---

### Step 4: Install ESP32 Board Core in Arduino IDE
1. Open **Arduino IDE**.
2. Click **File** ➔ **Preferences** (or press `Ctrl + Comma`).
3. In the field **Additional boards manager URLs**, paste:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   *(If you already have another URL in this box, separate them with a comma `,`).*
4. Click **OK**.
5. Click the **Boards Manager** icon on the left sidebar (icon with circuit board).
6. Search for `esp32`.
7. Locate **esp32 by Espressif Systems** and click **Install** (takes ~2 minutes).

---

### Step 5: Install Required Arduino WebSockets Library
1. In Arduino IDE, click the **Library Manager** icon on the left sidebar (icon with books, or press `Ctrl + Shift + I`).
2. In the search bar, type: `WebSockets`
3. Scroll and find **WebSockets by Markus Sattler**.
4. Click **Install**.
*(Note: No other external libraries are required! All 8 DSA structures and the DS18B20 OneWire bit-bang driver are written in pure C++ inside the project).*

---

## ⚡ Flashing Firmware onto the ESP32

---

### Step 1: Network Topology & WiFi Setup (Which Device Hosts the Hotspot?)

Before uploading code, your **Laptop** and the **ESP32** must be connected to the **exact same Local Area Network (LAN)** so the web browser can communicate with the ESP32 WebSocket server.

Choose one of the following methods:

#### 📱 Option A: Mobile Phone Hotspot (Strongly Recommended for College & Demos)
Your smartphone creates a portable WiFi network. Both your laptop and the ESP32 connect as clients to your phone's hotspot.

```text
               +----------------------------------+
               |   📱 Mobile Phone Hotspot        |
               |   (Acts as Local Router/Bridge)  |
               +-----------------+----------------+
                                 |
                 +---------------+---------------+
                 |                               |
                 ▼ (WiFi)                        ▼ (WiFi 2.4 GHz)
      +----------------------+        +----------------------+
      | 💻 Laptop / PC       |        | ⚡ ESP32 Board       |
      | IP: 192.168.43.50    |        | IP: 192.168.43.105   |
      | Next.js on :3001     |        | WebSocket on :81     |
      +----------+-----------+        +----------+-----------+
                 |                               |
                 +<====== Bidirectional ========>+
                        WebSocket (ws://...:81)
```

* **Why this is the best choice:**
  * **Bypasses College Firewalls:** College/hostel WiFi networks have *Access Point (Client) Isolation* enabled, which prevents two devices on the same WiFi from communicating with each other. A phone hotspot has zero isolation.
  * **No Captive Portal:** College WiFi requires browser login/passwords that an ESP32 cannot handle. Phone hotspots use standard WPA2-PSK passwords.
  * **Completely Portable:** Works anywhere — in a classroom, project lab, or during an external examiner evaluation.

* **Critical Phone Settings (Must be 2.4 GHz):**
  * **Android:** Go to *Settings ➔ Portable Hotspot / Tethering*. Under *Hotspot Settings*, change **AP Band** from 5.0 GHz to **`2.4 GHz band`**. (ESP32 hardware does not support 5 GHz WiFi).
  * **iPhone:** Go to *Settings ➔ Personal Hotspot*. Turn **ON** the switch labeled **`Maximize Compatibility`** (this forces the iPhone to broadcast on 2.4 GHz instead of 5 GHz).

---

#### 💻 Option B: Windows Laptop Mobile Hotspot (No Phone Required)
Your Windows laptop broadcasts its own WiFi network using its built-in WiFi card, and the ESP32 connects directly to your laptop.

```text
      +--------------------------------------------------------+
      | 💻 Windows Laptop                                      |
      |   1. Creates Windows Mobile Hotspot (192.168.137.1)    |
      |   2. Hosts Web Dashboard on http://localhost:3001      |
      +---------------------------+----------------------------+
                                  |
                                  ▼ (WiFi 2.4 GHz Hotspot)
                      +----------------------+
                      | ⚡ ESP32 Board       |
                      | IP: 192.168.137.xxx  |
                      | WebSocket on :81     |
                      +----------------------+
```

* **How to configure on Windows 10 / 11:**
  1. Press `Win + I` to open **Settings** ➔ Click **Network & internet** ➔ **Mobile hotspot**.
  2. Click **Edit**:
     - Network name: e.g., `MicroDetector`
     - Network password: e.g., `password123`
     - Network band: Select **`2.4 GHz`** or **`Any available`**.
  3. Toggle Mobile hotspot **ON**.
  4. Once your ESP32 connects, its IP address will appear right inside the Windows Mobile Hotspot settings page under **Connected devices**!

---

#### 🏠 Option C: Home WiFi Router
If you are working from home, both your laptop and the ESP32 can simply connect to your regular home WiFi router. Ensure you select the **2.4 GHz SSID** if your router broadcasts separate 2.4 GHz and 5 GHz bands.

---

### Step 2: Configure WiFi Credentials in Firmware
1. In Arduino IDE, open:
   `d:\kirti_project\MicroplasticDetectorESP32_WiFi\MicroplasticDetectorESP32_WiFi.ino`
2. Scroll to lines 36–37:
   ```cpp
   // ============================================================
   //  WiFi CONFIGURATION — CHANGE THESE!
   // ============================================================
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
3. Replace with your actual Hotspot or WiFi name and password:
   - Example for Phone Hotspot:
     ```cpp
     const char* WIFI_SSID     = "Akshat_Phone";
     const char* WIFI_PASSWORD = "password123";
     ```
   - Example for Laptop Hotspot:
     ```cpp
     const char* WIFI_SSID     = "MicroDetector";
     const char* WIFI_PASSWORD = "password123";
     ```

---

### Step 3: Arduino IDE Board & Port Configuration
1. In the top toolbar, open the **Tools** menu:
   - **Board** ➔ **esp32** ➔ Select **ESP32 Dev Module** (or *NodeMCU-32S* / *DOIT ESP32 DEVKIT V1*).
   - **Port** ➔ Select your ESP32's COM port (e.g. `COM3` or `COM5`).
   - **Upload Speed** ➔ `115200` (or `921600` for faster flash).

---

### Step 4: Upload Sketch (The Boot Button Trick)
1. Click the **Upload** arrow button (`->`) in the top left toolbar (or press `Ctrl + U`).
2. Arduino IDE will compile the code. When the console displays:
   ```text
   Connecting........_____....._____.....
   ```
3. 🚨 **Press and hold the physical `BOOT` (or `IO0`) button** on your ESP32 board for 2 seconds.
4. The moment the console says `Writing at 0x00010000... (xx%)`, release the button!
5. When complete, the console prints:
   ```text
   Leaving...
   Hard resetting via RTS pin...
   Done uploading.
   ```

---

### Step 5: Open Serial Monitor & Find ESP32 IP Address

You need the ESP32's assigned IP address to connect the web dashboard. You can find it in two ways:

#### Method A: Using Arduino IDE Serial Monitor (Standard)
1. Click the **Serial Monitor** icon in the top right corner of Arduino IDE (or press `Ctrl + Shift + M`).
2. Set the baud rate dropdown to **115200 baud** and line ending to **Newline**.
3. Press the physical **EN** (or **RST**) button on your ESP32 board once to restart it.
4. The Serial Monitor will print:
   ```text
   ==========================================
   |   MICROPLASTIC DETECTION SYSTEM        |
   |   DSA Project — ESP32 + WiFi Version   |
   ==========================================
   [WiFi] Connecting to: YourHotspotName ..........
   [WiFi] Connected successfully!
   [WiFi] ESP32 IP Address: 192.168.43.105
   [WS] WebSocket server started on port 81
   ```
5. 📝 **Note down the ESP32 IP Address** (e.g., `192.168.43.105`).

#### Method B: Checking Hotspot Connected Devices (Without Serial Monitor)
* **On Phone Hotspot:** Open *Settings ➔ Portable Hotspot ➔ Connected Devices*. You will see `espressif` or an unknown device listed along with its IP address (e.g., `192.168.43.105` on Android or `172.20.10.x` on iPhone).
* **On Windows Hotspot:** Open *Settings ➔ Network & Internet ➔ Mobile Hotspot*. Under *Devices connected*, the ESP32's IP (`192.168.137.xxx`) is displayed directly on the screen!

---

## 🌐 Installing & Running the Web Dashboard

---

### Step 1: Install Dashboard Dependencies (`npm install`)
*(Only needed the very first time you set up the project on your machine)*

1. Open PowerShell or Command Prompt.
2. Navigate to the dashboard directory:
   ```cmd
   cd d:\kirti_project\dashboard
   ```
3. Run:
   ```cmd
   npm install
   ```
4. This downloads and links all packages (Next.js 16, React 19, Lucide Icons, Recharts, Framer Motion).

---

### Step 2: Launching Real Hardware Mode (Port 3001)
Use this mode when connecting to your physical ESP32.

- **Option A (One-click script):**  
  Double-click `d:\kirti_project\dashboard\start_real.bat`.
- **Option B (Terminal command):**  
  ```cmd
  cd d:\kirti_project\dashboard
  npm run real
  ```
- Your browser will open or navigate to: **`http://localhost:3001`**

---

### Step 3: Launching Demo Simulation Mode (Port 3000)
Use this mode if you do not have hardware plugged in and want to test or practice with pure software simulation.

- **Option A (One-click script):**  
  Double-click `d:\kirti_project\dashboard\start_demo.bat`.
- **Option B (Terminal command):**  
  ```cmd
  cd d:\kirti_project\dashboard
  npm run demo
  ```
- Open browser at: **`http://localhost:3000`**

---

### Step 4: Stopping Dashboard Servers (`stop_servers.bat`)
When you are done testing or want to free up ports 3000/3001:
- Double-click `d:\kirti_project\dashboard\stop_servers.bat`.
- This safely stops all background Node.js processes.

---

## 🔗 Connecting the Webpage to the ESP32

---

### Step-by-Step Connection Process

1. Make sure your laptop and the ESP32 are connected to the **same WiFi network or hotspot**.
2. Open your web browser to **`http://localhost:3001`** (Real Hardware Mode).
3. Look at the **bottom of the left sidebar**:
   ```text
   +------------------------------------+
   | 📡 Hardware Disconnected           |
   |                                    |
   | [ 192.168.1.45       ] [ Connect ] |
   +------------------------------------+
   ```
4. Type the **ESP32 IP Address** that was printed in your Arduino Serial Monitor (e.g. `192.168.1.45`).
5. Click the cyan **Connect** button.
6. The UI will instantly display a spinning loader icon with **`Connecting...`**.
7. Within 1 to 2 seconds, the connection locks in and displays:
   ```text
   +------------------------------------+
   | 🟢 Hardware Online                 |
   |                                    |
   | [ 192.168.1.45       ] [Disconnect]|
   +------------------------------------+
   ```
8. **Real-Time Data Streams In:**  
   The photodiode voltage graph, temperature dial, turbidity readout, and all 8 DSA pages will now stream live data directly from the physical ESP32!

---

### Understanding the IP Address & Port `:81`

When you type an IP address like `192.168.1.45` into the input box:
- **`192.168.1.45` is the IP Address** (which device on your home network to speak with).
- **`:81` is the Port Number** (the exact channel where the ESP32 WebSocket server is listening).

> **Why you only type the IP:**  
> The dashboard automatically dials port `81` for you (`ws://192.168.1.45:81`). If a connection fails or times out, the error message reports the full target address (`192.168.1.45:81`) to let you know both the IP and the port that was attempted.

---

### Visual Connection Status Indicators

| State | Status Text | Icon | Action / Meaning |
| :--- | :--- | :--- | :--- |
| **Disconnected** | `Hardware Disconnected` | Red WiFi-Off icon | ESP32 not connected. Ready to enter IP. |
| **Connecting** | `Connecting...` | Yellow spinning loader | Dialing ESP32 WebSocket server. Buttons disabled. |
| **Connected** | `Hardware Online` | Green glowing WiFi icon | Live real-time bidirectional telemetry active! |
| **Error** | `⚠ Connection failed / not found` | Red error box | Timeout after 5s or unreachable IP. Error message displayed. |

---

## 🧪 Hardware Testing & System Verification

Once connected, run this quick check to verify the entire cyber-physical pipeline:

1. **Hardware Actuator Test (Overview Page)**:
   - On `http://localhost:3001`, locate the **Hardware Controls** card.
   - Click the **"Laser Active"** toggle switch ➔ Look at the physical red laser diode. It turns ON and OFF instantly.
   - Click the **"Relay Pump"** toggle switch ➔ Listen for the physical click on the relay module, and the peristaltic pump starts rotating!
2. **Optical Attenuation Sensor Test**:
   - Aim the laser beam into the BPW34 photodiode. Observe the Photodiode dial read ~3.2V.
   - Wave a slide or cloudy fluid in front of the laser beam. Watch the live voltage line chart on the dashboard dip to ~1.8V in real-time.
3. **Data Structure Traversal Pages**:
   - Navigate to **Sensor Log (`/sensor-log`)** ➔ Live Singly Linked List nodes.
   - Navigate to **Sliding Window (`/sliding-window`)** ➔ 10-slot Circular Buffer with DSP Moving Average.
   - Navigate to **Detection BST (`/bst`)** ➔ Hierarchical Binary Search Tree with In-Order, Pre-Order, and Post-Order traversal outputs.
   - Navigate to **Sorting (`/sorting`)** ➔ Benchmark Bubble, Selection, Insertion, Merge, and QuickSort on real sensor arrays.

---

## ❓ Troubleshooting & Frequently Asked Questions (FAQ)

### 1. The dashboard says `Could not reach ESP32 at ...:81 — check IP and ensure device is powered on`
- **Cause 1 (Different Networks):** Your laptop is on 5 GHz WiFi, while the ESP32 is connected to 2.4 GHz or a phone hotspot.  
  *Fix:* Make sure both your laptop and the ESP32 are connected to the exact same WiFi network name.
- **Cause 2 (Wrong IP):** The IP address in the router changed upon reconnect.  
  *Fix:* Open Arduino IDE Serial Monitor, press the **EN** button on the ESP32, and check the newly assigned IP address.
- **Cause 3 (AP Isolation / Guest Network):** Some college or office WiFi networks prevent devices on the same WiFi from communicating with each other.  
  *Fix:* Use your smartphone's **Mobile Hotspot** (configured for 2.4 GHz band). Connect both laptop and ESP32 to your hotspot.

---

### 2. Arduino IDE says `Connecting........_____....._____..... Failed to connect to ESP32`
- **Fix:** When `Connecting........` starts appearing in the bottom console, **press and hold the physical `BOOT` button** on your ESP32 board until the percentage counter begins uploading.

---

### 3. Serial Monitor outputs unreadable garbage characters
- **Fix:** Change the baud rate dropdown in the bottom-right corner of the Serial Monitor to **`115200 baud`**, then press the **EN** reset button on the ESP32.

---

### 4. DS18B20 Temperature sensor reads `-127.0°C`
- **Fix:** The 4.7kΩ pull-up resistor between the Data wire (GPIO 4) and 3.3V is missing or loose. Re-seat the resistor on the breadboard.

---

### 5. `Port 3000 or 3001 is already in use` error when running the dashboard
- **Fix:** Double-click `d:\kirti_project\dashboard\stop_servers.bat` to terminate any previous background Node.js instances, then re-launch `start_real.bat`.

---

### 6. Can I demonstrate this project without the physical hardware?
- **Yes!** Double-click `d:\kirti_project\dashboard\start_demo.bat` to launch **Demo Mode** on `http://localhost:3000`. The entire optical physics model and all 8 DSA algorithms will simulate in the browser with no ESP32 or sensors required.

---

*Authored by **Akshat Awasthi** | B.Tech Cyber Physical Systems (CPS) | MIT Manipal*
