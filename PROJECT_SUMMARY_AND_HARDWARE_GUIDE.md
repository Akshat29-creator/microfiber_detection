# 🌊 Microplastic Detection & Environmental Analysis System

### Complete Project Overview, Hardware Bill of Materials (BOM) & Operational Workflow

---

## 1. 📌 Project Overview (In Short)

The **Microplastic Detection & Environmental Analysis System** is a low-cost, portable **Cyber-Physical IoT instrument** designed to detect and quantify microplastic particulate contamination in water in real time.

Instead of expensive, time-consuming spectroscopic laboratory methods (such as FTIR or Raman microscopy), this system uses **Optical Attenuation & Light Scattering** inside an isolated dark flow cell, combined with **turbidity failsafes** and **temperature compensation**.

### Core Highlights:

- **Optical Detection:** A 650nm red laser beam shines through the water onto a high-speed BPW34 photodiode. Floating microplastics scatter light, creating brief, sharp voltage dips.
- **Dual-Stage Failsafe Logic:** An inline mechanical mesh filter (40–100 μm) removes large sand/debris, and an analog turbidity sensor automatically cuts off the pump if water is too muddy (eliminating mud-induced false positives).
- **Embedded Edge Computing:** Powered by an ESP32 microcontroller running C++ Data Structures & Algorithms (Linked Lists, BST, Circular Buffers, Stacks, Priority Queues) directly on the chip.
- **IoT Digital Twin Dashboard:** A Next.js 16 web application communicates bidirectionally via WebSockets (Port 81) to display live graphs, alerts, and particle counts in real time.

---

## 2. 🛠️ Hardware Parts & Bill of Materials (BOM) with Pricing

All components are standard, non-proprietary, and readily available from electronic distributors (Robu.in, Quartzcomponents, local markets).

|      S.No      | Component / Hardware Part             | Specification / Model                          | Functional Role in System                                                             |        Qty        | Estimated Price (₹ INR) | Estimated Price ($ USD) |
| :-------------: | :------------------------------------ | :--------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------: | :----------------------: | :---------------------: |
|   **1**   | **ESP32 DevKit Board**          | ESP-WROOM-32 / NodeMCU-32S                     | Master microcontroller: 240MHz dual-core, 12-bit ADC, DSA execution, WebSocket server |         1         |     **₹380**     |          $4.55          |
|   **2**   | **5V Power Adapter & Cable**    | 5V 2.0A–2.4A DC USB Adapter                   | Supplies stable, regulated power to ESP32, laser, relay, and sensors                  |         1         |     **₹280**     |          $3.35          |
|   **3**   | **Peristaltic Metering Pump**   | 5V / 12V Mini DC Pump (30–60 ml/min)          | Controllable positive-displacement fluid drive; fluid never contacts motor gears      |         1         |     **₹360**     |          $4.30          |
|   **4**   | **1-Channel 5V Relay Module**   | Optocoupled 5V Coil + Flyback Diode            | Galvanic isolation switch to control pump power from ESP32 GPIO 26                    |         1         |      **₹65**      |          $0.78          |
|   **5**   | **Medical Silicone Tubing**     | 2mm ID × 4mm OD, 1.5m Flexible                | Non-reactive fluid delivery line from sample beaker to dark chamber                   |        1 pk        |      **₹90**      |          $1.08          |
|   **6**   | **Inline Pre-Filter Mesh**      | 40–100 μm Fuel/Fluid Mesh Filter             | Stage 1 mechanical separation: filters sand, grit, and algae; lets microplastics pass |         1         |      **₹50**      |          $0.60          |
|   **7**   | **650nm Red Laser Diode**       | 5V 5mW, Brass Casing, Dot Focus                | Emits continuous collimated beam across fluid path in dark chamber                    |         1         |      **₹35**      |          $0.42          |
|   **8**   | **BPW34 PIN Photodiode**        | Silicon PIN, 7.5mm² Area, Fast Response       | Senses radiant light; registers microsecond voltage dips when particles pass          |         1         |      **₹65**      |          $0.78          |
|   **9**   | **LM358 Operational Amplifier** | Dual Low-Power Op-Amp DIP-8                    | Amplifies and conditions tiny photodiode signals to 0–3.3V analog for ESP32 ADC      |         1         |      **₹20**      |          $0.24          |
|  **10**  | **Analog Turbidity Sensor Kit** | Gravity-compatible Probe + Board               | Measures bulk water cloudiness; trips emergency pump shutoff if water is muddy        |         1         |     **₹520**     |          $6.23          |
|  **11**  | **DS18B20 Temperature Probe**   | Waterproof Stainless Probe (1m cable)          | 1-Wire digital thermometer; adjusts baseline optical refraction by temperature        |         1         |     **₹140**     |          $1.68          |
|  **12**  | **Resistors & Passives Kit**    | 4.7kΩ, 10kΩ, 20kΩ, 100kΩ, Capacitors       | 1-Wire pull-up (4.7kΩ), op-amp gain feedback (100kΩ), noise decoupling              |       1 set       |      **₹30**      |          $0.36          |
|  **13**  | **Zero PCB Perfboard & Wires**  | Dotted Prototyping Board + Dupont Jumper Wires | Solder substrate for op-amp circuit, pin headers, and interconnects                   |       1 set       |      **₹75**      |          $0.90          |
|  **14**  | **PVC Dark Chamber Enclosure**  | 3/4" Black PVC Conduit + 2 End Caps            | Light-sealed optical chamber blocking ambient sunlight & room lighting                |         1         |      **₹70**      |          $0.84          |
|  **15**  | **Sample & Waste Beakers**      | 2 × 250ml Clear Glass/Plastic Beakers         | Holding reservoirs for raw intake water and analyzed discharge fluid                  |         2         |     **₹120**     |          $1.44          |
|  **16**  | **Chassis / Enclosure Plates**  | Acrylic / MDF Mounting Plate & Standoffs       | Two-tier mounting structure isolating fluidics (bottom) from electronics (top)        |         1         |     **₹210**     |          $2.52          |
| **TOTAL** | **Complete Prototype Kit**      | **Full Cyber-Physical System**           | **Optics + Fluidics + Sensors + Microcontroller + Housing**                     | **16 Items** |    **₹2,445**    |    **~$29.30**    |

---

## 3. ⚙️ How It Works (Working Principle)

The detection relies on **Optical Attenuation & Light Scattering**, supported by a dual-stage failsafe:

1. **Optical Baseline:** The 650nm laser diode shines continuously across a clear glass/tubing section inside a light-tight black PVC chamber directly onto the BPW34 photodiode. When clear water flows, the photodiode receives steady light, outputting a high voltage baseline (~3.0V – 3.3V).
2. **Particle Passage (Detection):** When a microplastic particle flows through the laser beam, it momentarily scatters and blocks the light. For fractions of a millisecond, the photodiode receives less light, causing a sharp, V-shaped voltage dip (~1.5V – 2.4V).
3. **Particle Size Estimation:** The depth of the voltage drop ($\Delta V = V_{\text{baseline}} - V_{\text{dip}}$) is proportional to particle cross-sectional area, allowing classification into `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` severity categories.
4. **Turbidity Anti-False-Positive Failsafe:** If muddy water entered the laser cell, dirt particles would cause endless false detections. The turbidity sensor measures bulk cloudiness first. If turbidity drops below safe limits (< 2.50V), the ESP32 instantly shuts down the pump and halts detection.
5. **Temperature Compensation:** Refraction of water changes slightly with temperature. The DS18B20 temperature probe measures sample temperature to calibrate baseline voltage thresholds mathematically.

---

## 4. 🔄 End-to-End System Workflow

```text
 [ Sample Water Beaker ]
           │
           │ (1. Temperature Monitored by DS18B20)
           ▼
 [ Peristaltic Pump (Relay GPIO 26) ]
           │
           ▼
 [ Stage 1: Inline Mesh Filter (40-100 µm) ]  ──► Traps sand, mud chunks, algae
           │
           ▼
 [ Stage 2: Turbidity Sensor (GPIO 34) ]
      │
      ├── If Turbidity < 2.5V (Muddy) ──► [ Emergency Pump Cutoff + Alert ]
      │
      └── If Turbidity ≥ 2.5V (Clear) ──► Continues forward
           │
           ▼
 [ Stage 3: PVC Dark Sensing Chamber ]
      ├── 650nm Laser Diode (GPIO 27)
      └── BPW34 Photodiode + LM358 Op-Amp (GPIO 35)
           │
           ▼ (Voltage dip detection & size classification)
 [ ESP32 Microcontroller Core ]
      │  - FreeRTOS Real-Time Sampling
      │  - In-Memory C++ DSA Structures (Linked Lists, BST, Circular Buffer, Queue)
      │  - Built-in WebSocket Server (Port 81)
      │
      ▼ (Wi-Fi 2.4 GHz WebSocket Stream)
 [ Next.js 16 Web Telemetry Dashboard ] (http://localhost:3001)
      │  - Real-time particle counter & voltage waveform
      │  - Live turbidity, temperature, and pump status
      │  - Interactive DSA visualizations (BST search, sorting benchmarks)
      │
      ▼
 [ Waste Water Beaker ]
```

### Step-by-Step Execution Sequence:

1. **Boot & Calibration:** ESP32 powers on, starts Wi-Fi, initiates WebSocket server on port 81, and reads the DS18B20 probe to establish the temperature-compensated baseline.
2. **Flow Activation:** Operator clicks "Start Flow" on the Web Dashboard. The dashboard sends a WebSocket command to the ESP32, which triggers Relay (GPIO 26) to start the Peristaltic Pump.
3. **Pre-Filtration:** Water passes through the 40–100 μm mesh filter, preventing physical blockages and coarse sand from reaching sensors.
4. **Failsafe Validation:** Water enters the Turbidity sensor. If clear, the sample is approved; if muddy, the pump trips immediately.
5. **Optical Sensing:** Inside the dark chamber, the photodiode detects light interruptions from microplastics. Signal is amplified by LM358 and sampled via ESP32 ADC1.
6. **DSA In-Memory Storage:** The detection is logged into C++ Singly/Doubly Linked Lists, stored in a timestamp-indexed Binary Search Tree (BST), and pushed to the FIFO/Priority alert queue.
7. **Digital Twin Sync:** The event packet is transmitted via WebSocket to the Next.js web dashboard in real time, updating live charts, logs, and particle counts, while waste water drains safely into the waste beaker.
