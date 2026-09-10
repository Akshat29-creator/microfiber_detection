// ============================================================
//  MicroplasticDetectorESP32.ino
//  MAIN ARDUINO SKETCH — Menu-driven via Serial Monitor
//
//  DSA Concepts Demonstrated:
//    [MANDATORY] 1. Classes & Objects (7+ classes)
//    [MANDATORY] 2. Pointers (linked lists, BST, dynamic alloc)
//    [MANDATORY] 3. Linked Lists (Singly, Doubly, Circular)
//    [EXTRA]     4. Sorting (Bubble, Selection, Insertion, Merge, Quick)
//    [EXTRA]     5. Searching (Linear, Binary)
//    [EXTRA]     6. Stack (Calibration Undo/Redo)
//    [EXTRA]     7. Queue (Alert Processing)
//    [EXTRA]     8. BST (Timestamp Indexing)
//
//  Board: ESP32 (NodeMCU-32S / ESP32 Dev Module)
//  Baud Rate: 115200
//  Open Serial Monitor → Set "Newline" at bottom → Type number → Enter
//
//  MIT Manipal | B.Tech CPS | 3rd Semester
// ============================================================

#include "SensorReading.h"
#include "MicroplasticEvent.h"
#include "SensorLinkedList.h"
#include "EventDoublyList.h"
#include "CircularBuffer.h"
#include "AlertQueue.h"
#include "CalibrationStack.h"
#include "DetectionBST.h"
#include "SortingAlgorithms.h"
#include "SearchAlgorithms.h"

// ============================================================
//  GLOBAL OBJECTS (all DSA data structures)
// ============================================================
SensorLinkedList   sensorLog;             // Singly Linked List
EventDoublyList    eventHistory;          // Doubly Linked List
CircularBuffer     slidingWindow(10);     // Circular Linked List
AlertQueue         alertQueue;            // Queue
CalibrationStack   calibrationStack;      // Stack
DetectionBST       detectionTree;         // Binary Search Tree

float simulationTime = 0.0;
int   currentMenu = 0;   // 0 = main menu

// ============================================================
//  SENSOR PIN DEFINITIONS (ESP32)
// ============================================================
const int TURBIDITY_PIN   = 34;   // Analog input — turbidity sensor
const int PHOTODIODE_PIN  = 35;   // Analog input — BPW34 via LM358
const int TEMP_PIN        = 4;    // Digital — DS18B20 (OneWire)
const int RELAY_PIN       = 26;   // Digital output — pump relay
const int LASER_PIN       = 27;   // Digital output — laser diode

// ============================================================
//  SIMULATED SENSOR CLASSES
//  (These simulate hardware when real sensors aren't connected)
// ============================================================

class TurbiditySensor {
private:
    float currentVoltage;
    float clearThreshold;
    int totalReadings;
    int rejectedSamples;
public:
    TurbiditySensor(float threshold = 2.5)
        : currentVoltage(0), clearThreshold(threshold),
          totalReadings(0), rejectedSamples(0) {}

    float readSensor() {
        // Try reading real analog pin first
        int raw = analogRead(TURBIDITY_PIN);
        if (raw > 100) {
            // Real sensor connected — convert 12-bit ADC (0-4095) to 3.3V full scale
            currentVoltage = (raw / 4095.0) * 3.3;
        } else {
            // Simulated reading (clear: ~2.7-3.2V, muddy: ~1.0-2.2V)
            if (random(100) < 15)
                currentVoltage = 1.0 + random(120) / 100.0;
            else
                currentVoltage = 2.7 + random(50) / 100.0;
        }
        totalReadings++;
        return currentVoltage;
    }

    bool isClear() const { return currentVoltage >= clearThreshold; }

    bool validateSample() {
        readSensor();
        if (!isClear()) { rejectedSamples++; return false; }
        return true;
    }

    void displayStatus() const {
        Serial.print("  Turbidity: "); Serial.print(currentVoltage, 2); Serial.println("V");
        Serial.print("  Threshold: "); Serial.print(clearThreshold, 2); Serial.println("V");
        Serial.println(isClear() ? "  Status: CLEAR" : "  Status: MUDDY");
        Serial.print("  Rejected: "); Serial.println(rejectedSamples);
    }

    float getVoltage() const { return currentVoltage; }
    float getThreshold() const { return clearThreshold; }
    void setThreshold(float t) { clearThreshold = t; }
    int getRejectedCount() const { return rejectedSamples; }
};

class TemperatureSensor {
private:
    float currentTemp;
    float referenceTemp;
    float correctionFactor;
public:
    TemperatureSensor(float ref = 25.0)
        : currentTemp(25.0), referenceTemp(ref), correctionFactor(1.0) {}

    float readTemp() {
        currentTemp = 15.0 + random(200) / 10.0;
        correctionFactor = 1.0 - ((currentTemp - referenceTemp) * 0.001);
        return currentTemp;
    }

    float getCorrectionFactor() const { return correctionFactor; }
    float correctBaseline(float raw) const { return raw * correctionFactor; }
    float getTemperature() const { return currentTemp; }

    void displayStatus() const {
        Serial.print("  Temperature: "); Serial.print(currentTemp, 1); Serial.println(" C");
        Serial.print("  Correction:  "); Serial.println(correctionFactor, 4);
    }
};

class LaserChamber {
private:
    float baselineVoltage;
    float detectionThreshold;
    bool laserOn;
    int detectionCount;
public:
    LaserChamber(float baseline = 3.0, float threshold = 0.15)
        : baselineVoltage(baseline), detectionThreshold(threshold),
          laserOn(false), detectionCount(0) {}

    void laserActivate() {
        laserOn = true;
        digitalWrite(LASER_PIN, HIGH);
        Serial.println("  [Laser] 650nm ACTIVATED");
    }

    void laserDeactivate() {
        laserOn = false;
        digitalWrite(LASER_PIN, LOW);
        Serial.println("  [Laser] DEACTIVATED");
    }

    void calibrate(float corrected) {
        baselineVoltage = corrected;
        Serial.print("  [Laser] Baseline: "); Serial.print(baselineVoltage, 2); Serial.println("V");
    }

    SensorReading takeReading(float timestamp) {
        if (!laserOn) return SensorReading(timestamp, 0, "PHOTODIODE");

        float voltage;
        // Try real photodiode pin
        int raw = analogRead(PHOTODIODE_PIN);
        if (raw > 100) {
            voltage = (raw / 4095.0) * 3.3;
        } else {
            // Simulated
            if (random(100) < 20) {
                float drop = 0.15 + random(65) / 100.0;
                voltage = baselineVoltage - drop;
            } else {
                float noise = (random(10) - 5) / 100.0;
                voltage = baselineVoltage + noise;
            }
        }
        return SensorReading(timestamp, voltage, "PHOTODIODE");
    }

    MicroplasticEvent* analyzeReading(SensorReading reading, float waterTemp) {
        float drop = baselineVoltage - reading.getVoltage();
        if (drop >= detectionThreshold) {
            float duration = 1.0 + random(90) / 10.0;
            MicroplasticEvent* event = new MicroplasticEvent(
                reading.getTimestamp(), drop, baselineVoltage, duration, waterTemp
            );
            detectionCount++;
            return event;
        }
        return nullptr;
    }

    void displayStatus() const {
        Serial.println(laserOn ? "  Laser: ON" : "  Laser: OFF");
        Serial.print("  Baseline: "); Serial.print(baselineVoltage, 2); Serial.println("V");
        Serial.print("  Detected: "); Serial.print(detectionCount); Serial.println(" particles");
    }

    float getBaseline() const { return baselineVoltage; }
    void setBaseline(float b) { baselineVoltage = b; }
    int getDetectionCount() const { return detectionCount; }
};

class PumpController {
private:
    bool running;
    int startCount;
public:
    PumpController() : running(false), startCount(0) {}

    void start() {
        running = true;
        startCount++;
        digitalWrite(RELAY_PIN, HIGH);
        Serial.println("  [Pump] Relay CLOSED — RUNNING");
    }

    void stop() {
        running = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("  [Pump] Relay OPENED — STOPPED");
    }

    void emergencyShutoff(const String& reason) {
        running = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("  [Pump] *** EMERGENCY SHUTOFF ***");
        Serial.print("  Reason: "); Serial.println(reason);
    }

    void reset() {
        running = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("  [Pump] Reset.");
    }

    bool isRunning() const { return running; }

    void displayStatus() const {
        Serial.println(running ? "  Pump: RUNNING" : "  Pump: OFF");
        Serial.print("  Start count: "); Serial.println(startCount);
    }
};

// ============================================================
//  GLOBAL SENSOR OBJECTS
// ============================================================
TurbiditySensor   turbiditySensor;
TemperatureSensor tempSensor;
LaserChamber      laserChamber;
PumpController    pumpController;

// ============================================================
//  HELPER: Read integer from Serial Monitor
// ============================================================
int readSerialInt() {
    while (!Serial.available()) {
        delay(10);     // Wait for user input
    }
    int val = Serial.parseInt();
    // Flush remaining characters
    while (Serial.available()) Serial.read();
    return val;
}

float readSerialFloat() {
    while (!Serial.available()) delay(10);
    float val = Serial.parseFloat();
    while (Serial.available()) Serial.read();
    return val;
}

// ============================================================
//  MENU DISPLAYS
// ============================================================
void displayMainMenu() {
    Serial.println();
    Serial.println("  ==========================================");
    Serial.println("   MICROPLASTIC DETECTOR — DSA PROJECT");
    Serial.println("   MIT Manipal | ESP32 | 3rd Semester");
    Serial.println("  ==========================================");
    Serial.println("   1. Run Full Detection Simulation");
    Serial.println("   2. Sensor Log (Singly Linked List)");
    Serial.println("   3. Event History (Doubly Linked List)");
    Serial.println("   4. Sliding Window (Circular LL)");
    Serial.println("   5. Sorting Algorithms");
    Serial.println("   6. Searching Algorithms");
    Serial.println("   7. Calibration Stack");
    Serial.println("   8. Alert Queue");
    Serial.println("   9. Detection BST");
    Serial.println("  10. System Status");
    Serial.println("  ==========================================");
    Serial.println("  Enter choice (1-10):");
}

// ============================================================
//  1. FULL SIMULATION
// ============================================================
void runFullSimulation() {
    Serial.println("\n  How many samples? (5-30):");
    int numReadings = readSerialInt();
    if (numReadings < 5) numReadings = 5;
    if (numReadings > 30) numReadings = 30;

    // Phase 1: Boot
    Serial.println("\n  --- Phase 1: Calibration ---");
    float waterTemp = tempSensor.readTemp();
    tempSensor.displayStatus();
    float corrected = tempSensor.correctBaseline(3.0);
    laserChamber.calibrate(corrected);
    calibrationStack.push(CalibrationState(corrected, turbiditySensor.getThreshold(),
                                            tempSensor.getCorrectionFactor(),
                                            simulationTime, "Initial"));

    // Phase 2: Pump
    Serial.println("\n  --- Phase 2: Pump Start ---");
    pumpController.start();
    laserChamber.laserActivate();

    // Phase 3-5: Process
    Serial.print("\n  --- Processing "); Serial.print(numReadings); Serial.println(" samples ---");
    int detectedCount = 0;

    for (int i = 0; i < numReadings; i++) {
        simulationTime += 0.5;

        // Turbidity check
        bool clear = turbiditySensor.validateSample();
        if (!clear) {
            SensorReading turbR(simulationTime, turbiditySensor.getVoltage(), "TURBIDITY");
            turbR.setValid(false);
            sensorLog.append(turbR);
            alertQueue.enqueuePriority(Alert("ERROR", "Turbidity too high", simulationTime, 2));
            pumpController.emergencyShutoff("High turbidity");
            pumpController.reset();
            pumpController.start();
            continue;
        }

        // Laser reading
        SensorReading reading = laserChamber.takeReading(simulationTime);
        reading.setValid(true);
        sensorLog.append(reading);
        slidingWindow.insert(reading);

        // Analyze
        MicroplasticEvent* event = laserChamber.analyzeReading(reading, waterTemp);
        if (event != nullptr) {
            detectedCount++;
            eventHistory.append(*event);
            detectionTree.insert(*event);
            alertQueue.enqueue(Alert("INFO", "Microplastic detected!", simulationTime, 4));

            Serial.print("  ["); Serial.print(i + 1); Serial.print("] ");
            Serial.print("** DETECTION ** Drop: ");
            Serial.print(event->getVoltageDrop(), 2);
            Serial.print("V | "); Serial.println(event->getSeverity());

            delete event;
        } else {
            Serial.print("  ["); Serial.print(i + 1); Serial.print("] ");
            Serial.print("Clear — "); Serial.print(reading.getVoltage(), 2); Serial.println("V");
        }

        delay(50);  // Small delay for readability
    }

    // Shutdown
    Serial.println("\n  --- Shutdown ---");
    pumpController.stop();
    laserChamber.laserDeactivate();

    Serial.println("\n  ====== RESULTS ======");
    Serial.print("  Samples:   "); Serial.println(numReadings);
    Serial.print("  Detected:  "); Serial.println(detectedCount);
    Serial.print("  Rejected:  "); Serial.println(turbiditySensor.getRejectedCount());
    Serial.println("  ====================\n");
}

// ============================================================
//  2. SENSOR LOG MENU
// ============================================================
void sensorLogMenu() {
    Serial.println("\n  === SENSOR LOG (Singly LL) ===");
    Serial.println("  1. Display all");
    Serial.println("  2. Add reading");
    Serial.println("  3. Delete first");
    Serial.println("  4. Delete last");
    Serial.println("  5. Size & stats");
    Serial.println("  0. Back");
    Serial.println("  Choice:");

    int ch = readSerialInt();
    switch (ch) {
        case 1: sensorLog.displayAll(); break;
        case 2: {
            Serial.println("  Timestamp (s):"); float ts = readSerialFloat();
            Serial.println("  Voltage (V):"); float v = readSerialFloat();
            sensorLog.append(SensorReading(ts, v, "PHOTODIODE"));
            Serial.println("  Added!");
            break;
        }
        case 3:
            Serial.println(sensorLog.deleteFromBeginning() ? "  Deleted first." : "  Empty!");
            break;
        case 4:
            Serial.println(sensorLog.deleteFromEnd() ? "  Deleted last." : "  Empty!");
            break;
        case 5:
            Serial.print("  Total: "); Serial.println(sensorLog.getSize());
            Serial.print("  Valid: "); Serial.println(sensorLog.countValid());
            Serial.print("  Photodiode: "); Serial.println(sensorLog.countByType("PHOTODIODE"));
            Serial.print("  Turbidity: "); Serial.println(sensorLog.countByType("TURBIDITY"));
            break;
        default: break;
    }
}

// ============================================================
//  3. EVENT HISTORY MENU
// ============================================================
void eventHistoryMenu() {
    Serial.println("\n  === EVENTS (Doubly LL) ===");
    Serial.println("  1. Forward traversal");
    Serial.println("  2. Reverse traversal");
    Serial.println("  3. Delete by ID");
    Serial.println("  4. Statistics");
    Serial.println("  0. Back");
    Serial.println("  Choice:");

    int ch = readSerialInt();
    switch (ch) {
        case 1: eventHistory.displayForward(); break;
        case 2: eventHistory.displayReverse(); break;
        case 3: {
            Serial.println("  Event ID to delete:");
            int id = readSerialInt();
            Serial.println(eventHistory.deleteByID(id) ? "  Deleted." : "  Not found!");
            break;
        }
        case 4: eventHistory.displayStatistics(); break;
        default: break;
    }
}

// ============================================================
//  4. SLIDING WINDOW MENU
// ============================================================
void slidingWindowMenu() {
    Serial.println("\n  === SLIDING WINDOW (Circular LL) ===");
    Serial.println("  1. Display window");
    Serial.println("  2. Add reading");
    Serial.println("  3. Fill sample data");
    Serial.println("  0. Back");
    Serial.println("  Choice:");

    int ch = readSerialInt();
    switch (ch) {
        case 1: slidingWindow.display(); break;
        case 2: {
            Serial.println("  Voltage (V):");
            float v = readSerialFloat();
            simulationTime += 0.5;
            slidingWindow.insert(SensorReading(simulationTime, v, "PHOTODIODE"));
            Serial.println("  Added!");
            break;
        }
        case 3: {
            for (int i = 0; i < 15; i++) {
                float v = 2.8 + random(40) / 100.0;
                slidingWindow.insert(SensorReading(i * 0.5, v, "PHOTODIODE"));
            }
            Serial.println("  Filled with 15 readings.");
            slidingWindow.display();
            break;
        }
        default: break;
    }
}

// ============================================================
//  5. SORTING MENU
// ============================================================
void sortingMenu() {
    if (sensorLog.isEmpty()) {
        Serial.println("  [!] Run simulation first (Option 1)");
        return;
    }

    Serial.println("\n  === SORTING ===");
    Serial.println("  1. Bubble Sort");
    Serial.println("  2. Selection Sort");
    Serial.println("  3. Insertion Sort");
    Serial.println("  4. Merge Sort");
    Serial.println("  5. Quick Sort");
    Serial.println("  6. Run ALL");
    Serial.println("  0. Back");
    Serial.println("  Choice:");

    int ch = readSerialInt();
    if (ch < 1 || ch > 6) return;

    int arrSize;
    SensorReading* arr = sensorLog.toArray(arrSize);
    if (arr == nullptr) return;

    if (ch == 6) {
        // Run all 5
        String names[] = {"BUBBLE", "SELECTION", "INSERTION", "MERGE", "QUICK"};
        for (int s = 0; s < 5; s++) {
            SensorReading* copy = new SensorReading[arrSize];
            for (int i = 0; i < arrSize; i++) copy[i] = arr[i];

            switch (s) {
                case 0: bubbleSort(copy, arrSize); break;
                case 1: selectionSort(copy, arrSize); break;
                case 2: insertionSort(copy, arrSize); break;
                case 3: mergeSortWrapper(copy, arrSize); break;
                case 4: quickSortWrapper(copy, arrSize); break;
            }
            printReadingArray(copy, arrSize, names[s] + " SORTED");
            delete[] copy;
        }
    } else {
        SensorReading* copy = new SensorReading[arrSize];
        for (int i = 0; i < arrSize; i++) copy[i] = arr[i];

        printReadingArray(copy, arrSize, "BEFORE SORTING");

        switch (ch) {
            case 1: bubbleSort(copy, arrSize); break;
            case 2: selectionSort(copy, arrSize); break;
            case 3: insertionSort(copy, arrSize); break;
            case 4: mergeSortWrapper(copy, arrSize); break;
            case 5: quickSortWrapper(copy, arrSize); break;
        }
        String names[] = {"", "BUBBLE", "SELECTION", "INSERTION", "MERGE", "QUICK"};
        printReadingArray(copy, arrSize, names[ch] + " SORTED");
        delete[] copy;
    }
    delete[] arr;
}

// ============================================================
//  6. SEARCHING MENU
// ============================================================
void searchingMenu() {
    if (sensorLog.isEmpty()) {
        Serial.println("  [!] Run simulation first (Option 1)");
        return;
    }

    Serial.println("\n  === SEARCHING ===");
    Serial.println("  1. Linear — below threshold");
    Serial.println("  2. Linear — ALL below threshold");
    Serial.println("  3. Binary — by voltage (sorts first)");
    Serial.println("  4. Find Min voltage");
    Serial.println("  5. Find Max voltage");
    Serial.println("  0. Back");
    Serial.println("  Choice:");

    int ch = readSerialInt();
    if (ch < 1 || ch > 5) return;

    int arrSize;
    SensorReading* arr = sensorLog.toArray(arrSize);
    if (arr == nullptr) return;

    switch (ch) {
        case 1: {
            Serial.println("  Threshold voltage:");
            float t = readSerialFloat();
            linearSearchByVoltage(arr, arrSize, t, true);
            break;
        }
        case 2: {
            Serial.println("  Threshold voltage:");
            float t = readSerialFloat();
            linearSearchAllBreach(arr, arrSize, t);
            break;
        }
        case 3: {
            Serial.println("  Target voltage:");
            float v = readSerialFloat();
            mergeSortWrapper(arr, arrSize);
            binarySearchByVoltage(arr, arrSize, v);
            break;
        }
        case 4: findMinVoltage(arr, arrSize); break;
        case 5: findMaxVoltage(arr, arrSize); break;
    }
    delete[] arr;
}

// ============================================================
//  7. CALIBRATION STACK MENU
// ============================================================
void calibrationMenu() {
    Serial.println("\n  === CALIBRATION STACK ===");
    Serial.println("  1. View stack");
    Serial.println("  2. Push new calibration");
    Serial.println("  3. Undo last");
    Serial.println("  4. View current (top)");
    Serial.println("  0. Back");
    Serial.println("  Choice:");

    int ch = readSerialInt();
    switch (ch) {
        case 1: calibrationStack.display(); break;
        case 2: {
            Serial.println("  Baseline (V):"); float bv = readSerialFloat();
            Serial.println("  Turb. threshold (V):"); float tt = readSerialFloat();
            simulationTime += 1.0;
            calibrationStack.push(CalibrationState(bv, tt, 1.0, simulationTime, "Manual"));
            laserChamber.setBaseline(bv);
            turbiditySensor.setThreshold(tt);
            Serial.println("  Pushed!");
            break;
        }
        case 3: {
            CalibrationState restored = calibrationStack.undo();
            laserChamber.setBaseline(restored.baselineVoltage);
            turbiditySensor.setThreshold(restored.turbidityThreshold);
            break;
        }
        case 4: {
            CalibrationState top = calibrationStack.peek();
            Serial.println("  Current:");
            top.display();
            break;
        }
        default: break;
    }
}

// ============================================================
//  8. ALERT QUEUE MENU
// ============================================================
void alertQueueMenu() {
    Serial.println("\n  === ALERT QUEUE ===");
    Serial.println("  1. View alerts");
    Serial.println("  2. Process all");
    Serial.println("  3. Add alert");
    Serial.println("  4. Add CRITICAL alert");
    Serial.println("  0. Back");
    Serial.println("  Choice:");

    int ch = readSerialInt();
    switch (ch) {
        case 1: alertQueue.display(); break;
        case 2: alertQueue.processAll(); break;
        case 3: {
            simulationTime += 0.1;
            alertQueue.enqueue(Alert("WARNING", "Manual test alert", simulationTime, 3));
            Serial.println("  Alert added.");
            break;
        }
        case 4: {
            simulationTime += 0.1;
            alertQueue.enqueuePriority(Alert("CRITICAL", "Critical test alert!", simulationTime, 1));
            Serial.println("  Critical alert added (jumped to front).");
            break;
        }
        default: break;
    }
}

// ============================================================
//  9. BST MENU
// ============================================================
void bstMenu() {
    Serial.println("\n  === DETECTION BST ===");
    Serial.println("  1. Inorder (chronological)");
    Serial.println("  2. Preorder");
    Serial.println("  3. Postorder");
    Serial.println("  4. Search by timestamp");
    Serial.println("  5. Range search");
    Serial.println("  6. Tree info");
    Serial.println("  0. Back");
    Serial.println("  Choice:");

    int ch = readSerialInt();
    switch (ch) {
        case 1: detectionTree.displayInorder(); break;
        case 2: detectionTree.displayPreorder(); break;
        case 3: detectionTree.displayPostorder(); break;
        case 4: {
            Serial.println("  Timestamp (s):");
            float ts = readSerialFloat();
            detectionTree.search(ts);
            break;
        }
        case 5: {
            Serial.println("  Start time (s):"); float s = readSerialFloat();
            Serial.println("  End time (s):"); float e = readSerialFloat();
            detectionTree.rangeSearch(s, e);
            break;
        }
        case 6:
            Serial.print("  Events: "); Serial.println(detectionTree.getSize());
            Serial.print("  Height: "); Serial.println(detectionTree.getHeight());
            break;
        default: break;
    }
}

// ============================================================
//  10. SYSTEM STATUS
// ============================================================
void showStatus() {
    Serial.println("\n  ==========================================");
    Serial.println("   COMPLETE SYSTEM STATUS");
    Serial.println("  ==========================================");

    Serial.println("\n  -- Hardware --");
    pumpController.displayStatus();
    turbiditySensor.displayStatus();
    tempSensor.displayStatus();
    laserChamber.displayStatus();

    Serial.println("\n  -- Data Structures --");
    Serial.print("  Sensor Log (Singly LL)  : "); Serial.print(sensorLog.getSize()); Serial.println(" readings");
    Serial.print("  Events (Doubly LL)      : "); Serial.print(eventHistory.getSize()); Serial.println(" events");
    Serial.print("  Sliding Window (Circ LL): "); Serial.print(slidingWindow.getSize());
    Serial.print("/"); Serial.println(slidingWindow.getCapacity());
    Serial.print("  Alert Queue             : "); Serial.print(alertQueue.getSize()); Serial.println(" pending");
    Serial.print("  Calibration Stack       : "); Serial.print(calibrationStack.getSize()); Serial.println(" entries");
    Serial.print("  Detection BST           : "); Serial.print(detectionTree.getSize());
    Serial.print(" events (h="); Serial.print(detectionTree.getHeight()); Serial.println(")");

    Serial.print("\n  Simulation Time: "); Serial.print(simulationTime, 1); Serial.println("s");
    Serial.print("  Free Heap: "); Serial.print(ESP.getFreeHeap()); Serial.println(" bytes");
    Serial.println("  ==========================================\n");
}

// ============================================================
//  SETUP — Runs once on boot
// ============================================================
void setup() {
    Serial.begin(115200);
    delay(1000);

    // Configure pins
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(LASER_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, LOW);
    digitalWrite(LASER_PIN, LOW);

    // Seed random with floating analog pin 36 (SENSOR_VP)
    randomSeed(analogRead(36));

    Serial.println();
    Serial.println("  ==========================================");
    Serial.println("  |                                        |");
    Serial.println("  |   MICROPLASTIC DETECTION SYSTEM        |");
    Serial.println("  |   DSA Project — ESP32 Version          |");
    Serial.println("  |                                        |");
    Serial.println("  |   MIT Manipal | B.Tech CPS | Sem 3     |");
    Serial.println("  |                                        |");
    Serial.println("  |   Classes, Pointers, Linked Lists,     |");
    Serial.println("  |   Sorting, Searching, Stack, Queue,    |");
    Serial.println("  |   Binary Search Tree                   |");
    Serial.println("  |                                        |");
    Serial.println("  ==========================================");
    Serial.println();
    Serial.println("  >> Open Serial Monitor at 115200 baud");
    Serial.println("  >> Set line ending to 'Newline'");
    Serial.println();

    displayMainMenu();
}

// ============================================================
//  LOOP — Runs repeatedly, waits for Serial input
// ============================================================
void loop() {
    if (Serial.available() > 0) {
        int choice = Serial.parseInt();
        // Flush
        while (Serial.available()) Serial.read();

        switch (choice) {
            case 1:  runFullSimulation();  break;
            case 2:  sensorLogMenu();      break;
            case 3:  eventHistoryMenu();   break;
            case 4:  slidingWindowMenu();  break;
            case 5:  sortingMenu();        break;
            case 6:  searchingMenu();      break;
            case 7:  calibrationMenu();    break;
            case 8:  alertQueueMenu();     break;
            case 9:  bstMenu();            break;
            case 10: showStatus();         break;
            default:
                if (choice != 0)
                    Serial.println("  Invalid choice.");
                break;
        }

        displayMainMenu();
    }

    delay(10);  // Small delay to prevent watchdog reset
}
