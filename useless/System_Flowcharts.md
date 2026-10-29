# 🔄 System Flowcharts — Frontend, Backend & Combined

---

## 1. Backend Flowchart (ESP32 Firmware + Desktop C++)

This covers the entire backend pipeline: boot → sensor reads → DSA processing → output.

```mermaid
flowchart TD
    A["🔌 ESP32 Power ON"] --> B["Initialize GPIO Pins\nGPIO 34 Input, GPIO 35 Input\nGPIO 4 Input, GPIO 26 Output\nGPIO 27 Output"]
    B --> C["Connect to WiFi\nSSID + Password"]
    C --> D{"WiFi Connected?"}
    D -->|No| E["Retry Every 500ms\nPrint dots to Serial"]
    E --> D
    D -->|Yes| F["Print IP Address\nStart WebSocket Server\non Port 81"]

    F --> G["Phase 1: Calibration"]
    G --> G1["Read DS18B20 Temp\nGPIO 4 OneWire"]
    G1 --> G2{"DS18B20\nResponded?"}
    G2 -->|Yes| G3["Use Digital Temp\ne.g. 24.5°C"]
    G2 -->|No| G4{"LM35 Analog\nVoltage Valid?\n0.1V - 1.5V"}
    G4 -->|Yes| G5["Use Analog Temp\nV × 100 = °C"]
    G4 -->|No| G6["Default 25.0°C\nBaseline"]
    G3 --> G7["Calculate Correction\nFactor = 1.0 - tempDiff × 0.001"]
    G5 --> G7
    G6 --> G7
    G7 --> G8["Correct Baseline\nbaseline × correctionFactor"]
    G8 --> G9["Push to Calibration\nStack - LIFO"]

    G9 --> H["Phase 2: Activate Hardware"]
    H --> H1["Relay GPIO 26 → HIGH\nPump RUNNING"]
    H1 --> H2["Laser GPIO 27 → HIGH\nLaser ON"]

    H2 --> I["Phase 3: Sample Loop\nFor each water sample"]
    I --> J["Read Turbidity\nanalogRead GPIO 34\nraw / 4095 × 3.3V"]
    J --> K{"Turbidity\nVoltage ≥ 2.5V?"}

    K -->|"No - Muddy Water"| L["❌ REJECT Sample"]
    L --> L1["Create INVALID\nSensorReading"]
    L1 --> L2["Append to Singly\nLinked List"]
    L2 --> L3["enqueuePriority\nCRITICAL Alert\nJumps to Front"]
    L3 --> L4["Emergency Pump\nShutoff - GPIO 26 LOW"]
    L4 --> L5["Broadcast Alert\nvia WebSocket"]
    L5 --> L6["Reset Pump\nRestart Flow"]
    L6 --> I

    K -->|"Yes - Clear Water"| M["✅ Sample Approved"]
    M --> N["Read Photodiode\nanalogRead GPIO 35\nraw / 4095 × 3.3V"]
    N --> O["Create SensorReading\ntimestamp + voltage\n+ PHOTODIODE type"]

    O --> P["1️⃣ Singly Linked List\nsensorLog.append\nO of 1"]
    O --> Q["2️⃣ Circular Buffer\nslidingWindow.insert\nOverwrites oldest if full"]

    Q --> R["Compute ΔV\ndrop = baseline − voltage"]
    R --> S{"ΔV ≥ 0.15V?\nParticle Detected?"}

    S -->|"No - Clear Water"| T["Log: No particle\nUpdate Dashboard"]
    T --> I

    S -->|"Yes - Detection!"| U["Create MicroplasticEvent\nAuto-classify severity"]
    U --> U1{"dropPercent\n> 20%?"}
    U1 -->|Yes| U2["Severity = HIGH"]
    U1 -->|No| U3{"dropPercent\n> 10%?"}
    U3 -->|Yes| U4["Severity = MEDIUM"]
    U3 -->|No| U5["Severity = LOW"]

    U2 --> V["3️⃣ Doubly Linked List\neventHistory.append\nO of 1"]
    U4 --> V
    U5 --> V
    V --> W["4️⃣ Binary Search Tree\ndetectionTree.insert\nKey = timestamp\nO of log n"]
    W --> X["5️⃣ Alert Queue\nalertQueue.enqueue\nFIFO order"]
    X --> Y["Broadcast Detection\nJSON via WebSocket"]
    Y --> I

    I -->|"All Samples Done"| Z["Phase 6: Shutdown"]
    Z --> Z1["Pump STOP\nGPIO 26 → LOW"]
    Z1 --> Z2["Laser OFF\nGPIO 27 → LOW"]
    Z2 --> Z3["Display Final\nDashboard Summary"]

    style A fill:#1e293b,stroke:#3b82f6,color:#fff
    style F fill:#065f46,stroke:#10b981,color:#fff
    style L fill:#7f1d1d,stroke:#ef4444,color:#fff
    style M fill:#14532d,stroke:#22c55e,color:#fff
    style U fill:#7c2d12,stroke:#f97316,color:#fff
    style Z3 fill:#1e1b4b,stroke:#8b5cf6,color:#fff
```

---

## 2. Frontend Flowchart (Next.js Web Dashboard)

This covers the dashboard initialization, mode selection, page routing, and user interactions.

```mermaid
flowchart TD
    A["🌐 User Opens Browser"] --> B{"Which Launch Script?"}
    B -->|"start_demo.bat\nPort 3000"| C["MODE = demo\nNo Hardware Needed"]
    B -->|"start_real.bat\nPort 3001"| D["MODE = real\nESP32 Required"]

    C --> E["WebSocketProvider\nInitializes with\nmode = demo"]
    D --> F["WebSocketProvider\nInitializes with\nmode = real"]

    E --> G["Create SimulationEngine\nTypeScript port of\nall 8 C++ DSA classes"]
    G --> G1["SensorLinkedList - TS"]
    G --> G2["EventDoublyList - TS"]
    G --> G3["CircularBuffer - TS"]
    G --> G4["CalibrationStack - TS"]
    G --> G5["AlertQueue - TS"]
    G --> G6["DetectionBST - TS"]
    G --> G7["TurbiditySensor - TS"]
    G --> G8["LaserChamber - TS"]

    F --> H["User Enters ESP32 IP\nin Sidebar Input"]
    H --> H1["Connect WebSocket\nws://IP:81"]
    H1 --> H2{"Connection\nSuccessful?"}
    H2 -->|No| H3["Show Error Badge\nHardware Disconnected\nRed Banner"]
    H3 --> H
    H2 -->|Yes| H4["✅ Connected\nGreen Badge\nStart Receiving JSON"]

    G1 --> I["React State Updated\nvia syncEngineState"]
    G2 --> I
    G3 --> I
    G4 --> I
    G5 --> I
    G6 --> I
    H4 --> I

    I --> J["Sidebar Navigation\nRender Layout"]
    J --> K{"User Navigates\nTo Page"}

    K --> K1["/ Main Dashboard"]
    K --> K2["/simulation"]
    K --> K3["/sensor-log"]
    K --> K4["/events"]
    K --> K5["/sliding-window"]
    K --> K6["/sorting"]
    K --> K7["/searching"]
    K --> K8["/calibration"]
    K --> K9["/alerts"]
    K --> K10["/bst"]
    K --> K11["/system"]

    K1 --> M1["Live Voltage AreaChart\nSensor Cards\nHardware Pipeline Bar\nDetection Counter\nDSA Status Grid"]

    K2 --> M2["Set Sample Count\nClick Run Simulation\nWatch Per-Sample Results\nProgress Bar"]
    M2 --> M2a{"Demo or Real?"}
    M2a -->|Demo| M2b["engine.runSimulation\nAll DSA in browser"]
    M2a -->|Real| M2c["Send START_FLOW\nvia WebSocket"]

    K3 --> M3["Table of All Readings\nAdd at Head / Tail\nDelete by Position\nCount by Sensor Type"]

    K4 --> M4["Forward Traversal\nReverse Traversal\nDelete by Event ID\nSeverity Statistics"]

    K5 --> M5["Ring Buffer Visual\nAdd New Reading\nMoving Average Display\nMin / Max Voltage"]

    K6 --> M6["Run 5 Sort Algorithms\nSide-by-Side Results\nExecution Time μs"]

    K7 --> M7["Linear Search by Threshold\nBinary Search by Voltage\nStep-by-Step Trace\nComparison Counter"]

    K8 --> M8["Push New Calibration\nPop / Undo Last\nView Stack History\nVisual Stack Display"]

    K9 --> M9["View Pending Alerts\nProcess One / All\nAdd Priority Alert\nQueue Visualization"]

    K10 --> M10["Inorder Traversal\nPreorder Traversal\nPostorder Traversal\nSearch by Timestamp\nRange Query"]

    K11 --> M11["GPIO Pin Status\nHeap Memory\nConnection Info\nHardware Diagnostics"]

    style A fill:#1e293b,stroke:#3b82f6,color:#fff
    style C fill:#065f46,stroke:#10b981,color:#fff
    style D fill:#7c2d12,stroke:#f97316,color:#fff
    style H3 fill:#7f1d1d,stroke:#ef4444,color:#fff
    style H4 fill:#14532d,stroke:#22c55e,color:#fff
    style K1 fill:#1e1b4b,stroke:#8b5cf6,color:#fff
```

---

## 3. Combined Full-System Flowchart (Hardware → Backend → Frontend)

This shows the complete end-to-end flow from physical water to the user's browser screen.

```mermaid
flowchart TD
    subgraph HW ["🔧 Physical Hardware Layer"]
        direction TB
        W["Water Sample\nBeaker"] --> P["Peristaltic Pump\nRelay GPIO 26"]
        P --> F["Inline Mesh Filter\n40-100 μm"]
        F --> TS["Turbidity Sensor\nGPIO 34 ADC"]
        F --> DC["Dark PVC Chamber"]
        DC --> LD["650nm Laser\nGPIO 27"]
        DC --> PD["BPW34 Photodiode\n+ LM358 Op-Amp\nGPIO 35 ADC"]
        W --> TMP["DS18B20 Temp\nGPIO 4 OneWire"]
    end

    subgraph ESP ["⚡ ESP32 Microcontroller"]
        direction TB
        ADC1["analogRead GPIO 34\nTurbidity Voltage"]
        ADC2["analogRead GPIO 35\nPhotodiode Voltage"]
        DIG["readDS18B20 GPIO 4\nTemperature °C"]
        
        ADC1 --> TG{"Turbidity\n≥ 2.5V?"}
        TG -->|"No - Muddy"| REJ["❌ Reject\nPump Emergency Stop\nPriority Alert"]
        TG -->|"Yes - Clear"| PASS["✅ Approved"]
        
        DIG --> CAL["Temperature\nCorrection Factor"]
        CAL --> BL["Corrected Baseline\nVoltage"]

        PASS --> DET{"Photodiode\nΔV ≥ 0.15V?"}
        DET -->|"No"| CLR["Clear Water\nNo Particle"]
        DET -->|"Yes"| PART["🔴 Microplastic\nDetected!"]
    end

    subgraph DSA ["📊 DSA Engine - 8 Data Structures"]
        direction TB
        SLL["1. Singly Linked List\nALL raw readings\nappend O of 1"]
        CLL["2. Circular Linked List\nLast 10 readings\nMoving Average"]
        DLL["3. Doubly Linked List\nDetection events\nForward + Reverse"]
        BST["4. Binary Search Tree\nTimestamp index\nRange Query O of log n"]
        STK["5. Stack LIFO\nCalibration history\nUndo / Redo"]
        QUE["6. Queue + Priority\nSystem alerts\nCRITICAL jumps front"]
        SRT["7. Five Sorting Algos\nBubble, Selection\nInsertion, Merge, Quick"]
        SRH["8. Two Search Algos\nLinear O of n\nBinary O of log n"]
    end

    subgraph WS ["📡 WebSocket Bridge - Port 81"]
        direction TB
        JSON["JSON Telemetry Packet\npump, laser, voltage\ntemp, turbidity\ndetections, heap\nDSA sizes"]
        CMD["Incoming Commands\nSTART_FLOW\nSTOP_FLOW\nCALIBRATE\nSIMULATE"]
    end

    subgraph FE ["🌐 Next.js 16 Dashboard"]
        direction TB
        
        subgraph MODES ["Dual Mode"]
            DEMO["Demo Mode :3000\nSimulationEngine.ts\nAll DSA in Browser"]
            REAL["Real Mode :3001\nWebSocket Client\nESP32 Live Data"]
        end

        CTX["WebSocketContext.tsx\nCentral State Manager"]

        subgraph PAGES ["Dashboard Pages"]
            PG1["/ Main Dashboard\nLive AreaChart\nSensor Cards"]
            PG2["/simulation\nRun Detection\nSample by Sample"]
            PG3["/sensor-log\nSingly LL Ops"]
            PG4["/events\nDoubly LL Traverse"]
            PG5["/sliding-window\nRing Buffer Visual"]
            PG6["/sorting\n5 Algo Benchmark"]
            PG7["/searching\nLinear vs Binary"]
            PG8["/calibration\nStack Undo/Redo"]
            PG9["/alerts\nQueue Processing"]
            PG10["/bst\nTree Traversals"]
            PG11["/system\nHW Diagnostics"]
        end

        UI["User Browser Screen\nDark Mode UI\nRecharts Graphs\nInteractive Controls"]
    end

    %% Hardware → ESP32
    TS --> ADC1
    PD --> ADC2
    TMP --> DIG

    %% ESP32 → DSA
    CLR --> SLL
    CLR --> CLL
    PART --> SLL
    PART --> CLL
    PART --> DLL
    PART --> BST
    PART --> QUE
    REJ --> SLL
    REJ --> QUE
    CAL --> STK

    %% DSA → WebSocket
    SLL --> JSON
    DLL --> JSON
    BST --> JSON
    QUE --> JSON

    %% WebSocket → Frontend
    JSON --> REAL
    CMD --> ESP

    %% Frontend Internal
    DEMO --> CTX
    REAL --> CTX
    CTX --> PAGES
    PAGES --> UI

    %% User → Frontend → Backend
    UI -->|"User clicks\nStart Flow"| CMD

    %% Sorting/Searching on demand
    SLL -->|"toArray"| SRT
    SLL -->|"toArray"| SRH

    style HW fill:#0c4a6e,stroke:#38bdf8,color:#fff
    style ESP fill:#1e293b,stroke:#f59e0b,color:#fff
    style DSA fill:#14532d,stroke:#4ade80,color:#fff
    style WS fill:#4c1d95,stroke:#a78bfa,color:#fff
    style FE fill:#1e1b4b,stroke:#818cf8,color:#fff
    style REJ fill:#7f1d1d,stroke:#ef4444,color:#fff
    style PART fill:#7c2d12,stroke:#f97316,color:#fff
    style CLR fill:#065f46,stroke:#10b981,color:#fff
```

---

## Quick Reference: What Connects Where

| From | To | Connection | Data Transferred |
|:---|:---|:---|:---|
| Turbidity Sensor | ESP32 GPIO 34 | Analog wire | 0–3.3V ADC voltage |
| Photodiode + LM358 | ESP32 GPIO 35 | Analog wire | 0–3.3V amplified signal |
| DS18B20 Probe | ESP32 GPIO 4 | 1-Wire digital | Temperature in °C |
| ESP32 GPIO 26 | Relay Module | Digital HIGH/LOW | Pump ON/OFF control |
| ESP32 GPIO 27 | Laser Diode | Digital HIGH/LOW | Laser ON/OFF control |
| ESP32 | Dashboard (Real) | WiFi WebSocket :81 | JSON telemetry packets |
| Dashboard (Real) | ESP32 | WiFi WebSocket :81 | Command strings |
| SimulationEngine.ts | Dashboard (Demo) | In-memory JS | Direct function calls |
| Sensor readings | DSA structures | C++/TS pointers | SensorReading objects |
| Detection events | BST + DLL + Queue | C++/TS pointers | MicroplasticEvent objects |
