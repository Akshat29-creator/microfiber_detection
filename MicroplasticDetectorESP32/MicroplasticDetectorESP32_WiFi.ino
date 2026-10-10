// ============================================================
//  MicroplasticDetectorESP32_WiFi.ino
//  MODIFIED: WiFi + WebSocket server for Dashboard connectivity
//
//  This version adds WebSocket support so the Next.js dashboard
//  can connect to the ESP32 over WiFi for real-time monitoring.
//  ALL original Serial Monitor functionality is preserved.
//
//  REQUIRES:
//    1. Arduino IDE Board: ESP32 Dev Module
//    2. Library: WebSockets by Markus Sattler
//       Install: Sketch → Include Library → Manage Libraries → "WebSockets"
//    3. Change YOUR_WIFI_SSID and YOUR_WIFI_PASSWORD below
//
//  DSA Concepts: Same as original (all 8 categories)
//  Board: ESP32 (NodeMCU-32S / ESP32 Dev Module)
//  Baud: 115200
// ============================================================

#include <WiFi.h>
#include <WebSocketsServer.h>
#include "SensorReading.h"
#include "MicroplasticEvent.h"
#include "SensorLinkedList.h"
#include "CircularBuffer.h"
#include "AlertQueue.h"
#include "SortingAlgorithms.h"

// ============================================================
//  WiFi CONFIGURATION — CHANGE THESE!
// ============================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// WebSocket server on port 81
WebSocketsServer webSocket = WebSocketsServer(81);
bool wsClientConnected = false;

// ============================================================
//  GLOBAL OBJECTS (all DSA data structures)
// ============================================================
SensorLinkedList   sensorLog;
CircularBuffer     slidingWindow(10);
AlertQueue         alertQueue;

float simulationTime = 0.0;
int   currentMenu = 0;

// ============================================================
//  SENSOR PIN DEFINITIONS (ESP32)
// ============================================================
const int TURBIDITY_PIN   = 34;
const int PHOTODIODE_PIN  = 35;
const int TEMP_PIN        = 4;
const int RELAY_PIN       = 26;
const int LASER_PIN       = 27;

// ============================================================
//  ONEWIRE BIT-BANG DRIVER FOR DS18B20 (Zero external libraries)
// ============================================================
bool ds18b20Reset(int pin) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(480);
    pinMode(pin, INPUT_PULLUP);
    delayMicroseconds(70);
    bool presence = (digitalRead(pin) == LOW);
    delayMicroseconds(410);
    return presence;
}

void ds18b20WriteBit(int pin, bool bit) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    if (bit) {
        delayMicroseconds(6);
        pinMode(pin, INPUT_PULLUP);
        delayMicroseconds(64);
    } else {
        delayMicroseconds(60);
        pinMode(pin, INPUT_PULLUP);
        delayMicroseconds(10);
    }
}

bool ds18b20ReadBit(int pin) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(3);
    pinMode(pin, INPUT_PULLUP);
    delayMicroseconds(10);
    bool bit = (digitalRead(pin) == HIGH);
    delayMicroseconds(55);
    return bit;
}

void ds18b20WriteByte(int pin, uint8_t byte) {
    for (int i = 0; i < 8; i++) {
        ds18b20WriteBit(pin, (byte >> i) & 1);
    }
}

uint8_t ds18b20ReadByte(int pin) {
    uint8_t byte = 0;
    for (int i = 0; i < 8; i++) {
        if (ds18b20ReadBit(pin)) byte |= (1 << i);
    }
    return byte;
}

float readPhysicalDS18B20(int pin) {
    if (!ds18b20Reset(pin)) return -999.0f; // Sensor not responding
    ds18b20WriteByte(pin, 0xCC); // Skip ROM
    ds18b20WriteByte(pin, 0x44); // Convert T
    delay(20);
    if (!ds18b20Reset(pin)) return -999.0f;
    ds18b20WriteByte(pin, 0xCC); // Skip ROM
    ds18b20WriteByte(pin, 0xBE); // Read Scratchpad
    uint8_t tempLSB = ds18b20ReadByte(pin);
    uint8_t tempMSB = ds18b20ReadByte(pin);
    int16_t rawTemp = (tempMSB << 8) | tempLSB;
    return (float)rawTemp / 16.0f;
}

// ============================================================
//  REAL SENSOR CLASSES (100% Physical Hardware ADC & GPIO)
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

    // 100% Real Analog Read from GPIO 34 (ESP32 12-bit ADC -> 0-3.3V)
    float readSensor() {
        int raw = analogRead(TURBIDITY_PIN);
        currentVoltage = (raw / 4095.0f) * 3.3f;
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
        Serial.print("  Turbidity Voltage: "); Serial.print(currentVoltage, 3); Serial.println(" V (GPIO 34)");
        Serial.print("  Clear Threshold:   "); Serial.print(clearThreshold, 2); Serial.println(" V");
        Serial.println(isClear() ? "  Failsafe Status:   CLEAR (Passed)" : "  Failsafe Status:   MUDDY (Rejected)");
        Serial.print("  Rejected Count:    "); Serial.println(rejectedSamples);
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
    bool hardwareDetected;
public:
    TemperatureSensor(float ref = 25.0)
        : currentTemp(25.0), referenceTemp(ref), correctionFactor(1.0), hardwareDetected(false) {}

    // Read real physical DS18B20 digital probe on GPIO 4
    float readTemp() {
        float phys = readPhysicalDS18B20(TEMP_PIN);
        if (phys > -55.0f && phys < 125.0f) {
            currentTemp = phys;
            hardwareDetected = true;
        } else {
            // Check if analog temperature sensor (e.g., LM35 10mV/C) is wired
            int raw = analogRead(TEMP_PIN);
            float v = (raw / 4095.0f) * 3.3f;
            if (v >= 0.10f && v <= 1.50f) {
                currentTemp = v * 100.0f; // LM35: 10mV per degree C
                hardwareDetected = true;
            } else {
                // If probe is currently unseated, use standard reference baseline (25.0 C)
                currentTemp = referenceTemp;
                hardwareDetected = false;
            }
        }
        correctionFactor = 1.0f - ((currentTemp - referenceTemp) * 0.001f);
        return currentTemp;
    }

    float getCorrectionFactor() const { return correctionFactor; }
    float correctBaseline(float raw) const { return raw * correctionFactor; }
    float getTemperature() const { return currentTemp; }
    bool isHardwareDetected() const { return hardwareDetected; }

    void displayStatus() const {
        Serial.print("  Water Temperature: "); Serial.print(currentTemp, 2); Serial.println(" °C (GPIO 4)");
        Serial.print("  Hardware Probe:    "); Serial.println(hardwareDetected ? "ONLINE (DS18B20)" : "DEFAULT 25.0°C BASELINE");
        Serial.print("  Thermal Factor:    "); Serial.println(correctionFactor, 4);
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
        Serial.println("  [Laser] 650nm Diode ACTIVATED (GPIO 27 HIGH)");
    }

    void laserDeactivate() {
        laserOn = false;
        digitalWrite(LASER_PIN, LOW);
        Serial.println("  [Laser] 650nm Diode DEACTIVATED (GPIO 27 LOW)");
    }

    void calibrate(float corrected) {
        baselineVoltage = corrected;
        Serial.print("  [Laser Chamber] Baseline Calibrated: "); Serial.print(baselineVoltage, 3); Serial.println(" V");
    }

    // 100% Real Analog Read from Photodiode amplifier on GPIO 35
    SensorReading takeReading(float timestamp) {
        if (!laserOn) return SensorReading(timestamp, 0.0f, "PHOTODIODE");
        int raw = analogRead(PHOTODIODE_PIN);
        float voltage = (raw / 4095.0f) * 3.3f;
        return SensorReading(timestamp, voltage, "PHOTODIODE");
    }

    MicroplasticEvent* analyzeReading(SensorReading reading, float waterTemp) {
        float drop = baselineVoltage - reading.getVoltage();
        if (drop >= detectionThreshold) {
            // Real optical transit duration: typically 2.0-5.0ms under peristaltic flow
            float durationMs = 3.2f;
            MicroplasticEvent* event = new MicroplasticEvent(
                reading.getTimestamp(), drop, baselineVoltage, durationMs, waterTemp
            );
            detectionCount++;
            return event;
        }
        return nullptr;
    }

    void displayStatus() const {
        Serial.println(laserOn ? "  Laser Diode:       ACTIVE (ON)" : "  Laser Diode:       INACTIVE (OFF)");
        Serial.print("  Photodiode Baseline: "); Serial.print(baselineVoltage, 3); Serial.println(" V (GPIO 35)");
        Serial.print("  Confirmed Particles: "); Serial.print(detectionCount); Serial.println(" microplastics");
    }

    bool isOn() const { return laserOn; }
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
        Serial.println("  [Pump] 5V Relay CLOSED — Peristaltic Pump RUNNING (GPIO 26 HIGH)");
    }

    void stop() {
        running = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("  [Pump] 5V Relay OPENED — Peristaltic Pump STOPPED (GPIO 26 LOW)");
    }

    void emergencyShutoff(const String& reason) {
        running = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("  [Pump] *** TURBIDITY FAILSAFE TRIGGERED — PUMP HALTED ***");
        Serial.print("  Reason: "); Serial.println(reason);
    }

    void reset() {
        running = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("  [Pump] Relay reset to initial state.");
    }

    bool isRunning() const { return running; }

    void displayStatus() const {
        Serial.println(running ? "  Peristaltic Pump:  RUNNING (Relay ON)" : "  Peristaltic Pump:  STOPPED (Relay OFF)");
        Serial.print("  Pump Cycles:       "); Serial.println(startCount);
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
//  WEBSOCKET: Broadcast JSON to all connected clients
// ============================================================
void wsBroadcast(String json) {
    webSocket.broadcastTXT(json);
}

// Send full system status as JSON (reads real-time physical sensors)
void wsSendStatus() {
    float realPhotodiode = (analogRead(PHOTODIODE_PIN) / 4095.0f) * 3.3f;
    float realTurbidity = turbiditySensor.readSensor();
    float realTemp = tempSensor.readTemp();

    String json = "{\"type\":\"status\"";
    json += ",\"pump\":\"" + String(pumpController.isRunning() ? "RUNNING" : "OFF") + "\"";
    json += ",\"laser\":\"" + String(laserChamber.isOn() ? "ON" : "OFF") + "\"";
    json += ",\"turbidityVoltage\":" + String(realTurbidity, 3);
    json += ",\"temperature\":" + String(realTemp, 1);
    json += ",\"photodiode\":" + String(realPhotodiode, 3);
    json += ",\"detections\":" + String(laserChamber.getDetectionCount());
    json += ",\"freeHeap\":" + String(ESP.getFreeHeap());
    json += ",\"simTime\":" + String(simulationTime, 1);
    json += ",\"sensorLogSize\":" + String(sensorLog.getSize());
    json += ",\"slidingWindowSize\":" + String(slidingWindow.getSize());
    json += ",\"slidingWindowCap\":" + String(slidingWindow.getCapacity());
    json += ",\"alertQueueSize\":" + String(alertQueue.getSize());
    json += "}";
    wsBroadcast(json);
}

// Send a sensor reading event
void wsSendSensorReading(SensorReading& r) {
    String json = "{\"type\":\"sensorReading\"";
    json += ",\"timestamp\":" + String(r.getTimestamp(), 2);
    json += ",\"voltage\":" + String(r.getVoltage(), 3);
    json += ",\"sensorType\":\"" + r.getSensorType() + "\"";
    json += ",\"valid\":" + String(r.isValid() ? "true" : "false");
    json += "}";
    wsBroadcast(json);
}

// Send a detection event
void wsSendDetection(MicroplasticEvent& e) {
    String json = "{\"type\":\"detection\"";
    json += ",\"id\":" + String(e.getEventID());
    json += ",\"timestamp\":" + String(e.getTimestamp(), 2);
    json += ",\"voltageDrop\":" + String(e.getVoltageDrop(), 3);
    json += ",\"baseline\":" + String(e.getBaselineVoltage(), 3);
    json += ",\"severity\":\"" + e.getSeverity() + "\"";
    json += ",\"confidence\":" + String(e.confidence(), 1);
    json += "}";
    wsBroadcast(json);
}

// Send an alert event
void wsSendAlert(Alert& a) {
    String json = "{\"type\":\"alert\"";
    json += ",\"alertType\":\"" + a.type + "\"";
    json += ",\"message\":\"" + a.message + "\"";
    json += ",\"timestamp\":" + String(a.timestamp, 2);
    json += ",\"priority\":" + String(a.priority);
    json += "}";
    wsBroadcast(json);
}

// Send sensor data (live 100% physical hardware readings)
void wsSendSensorData() {
    float realPhotodiode = (analogRead(PHOTODIODE_PIN) / 4095.0f) * 3.3f;
    float realTurbidity = turbiditySensor.readSensor();
    float realTemp = tempSensor.readTemp();
    String json = "{\"type\":\"sensor\"";
    json += ",\"photodiode\":" + String(realPhotodiode, 3);
    json += ",\"temperature\":" + String(realTemp, 1);
    json += ",\"turbidity\":" + String(realTurbidity, 3);
    json += ",\"ts\":" + String(millis() / 1000.0f, 2);
    json += "}";
    wsBroadcast(json);
}

// ============================================================
//  WEBSOCKET: Handle incoming commands from Dashboard
// ============================================================
void handleWebSocketCommand(const String& payload) {
    // Simple JSON parsing (no ArduinoJson dependency)
    Serial.print("  [WS] Received: "); Serial.println(payload);

    if (payload.indexOf("\"cmd\":\"status\"") >= 0) {
        wsSendStatus();
    }
    else if (payload.indexOf("\"cmd\":\"simulate\"") >= 0) {
        // Extract samples count
        int samplesIdx = payload.indexOf("\"samples\":");
        int numReadings = 15;
        if (samplesIdx >= 0) {
            numReadings = payload.substring(samplesIdx + 10).toInt();
        }
        if (numReadings < 5) numReadings = 5;
        if (numReadings > 30) numReadings = 30;

        // Run simulation with WS broadcasting
        wsBroadcast("{\"type\":\"simProgress\",\"phase\":\"CALIBRATING\",\"current\":0,\"total\":" + String(numReadings) + ",\"running\":true}");

        float waterTemp = tempSensor.readTemp();
        float corrected = tempSensor.correctBaseline(3.0);
        laserChamber.calibrate(corrected);

        pumpController.start();
        laserChamber.laserActivate();
        wsBroadcast("{\"type\":\"simProgress\",\"phase\":\"PROCESSING\",\"current\":0,\"total\":" + String(numReadings) + ",\"running\":true}");

        int detectedCount = 0;
        for (int i = 0; i < numReadings; i++) {
            simulationTime += 0.5;
            bool clear = turbiditySensor.validateSample();
            if (!clear) {
                SensorReading turbR(simulationTime, turbiditySensor.getVoltage(), "TURBIDITY");
                turbR.setValid(false);
                sensorLog.append(turbR);
                wsSendSensorReading(turbR);
                Alert a("ERROR", "Turbidity too high", simulationTime, 2);
                alertQueue.enqueuePriority(a);
                wsSendAlert(a);
                pumpController.emergencyShutoff("High turbidity");
                pumpController.reset();
                pumpController.start();
            } else {
                SensorReading reading = laserChamber.takeReading(simulationTime);
                reading.setValid(true);
                sensorLog.append(reading);
                slidingWindow.insert(reading);
                wsSendSensorReading(reading);

                MicroplasticEvent* event = laserChamber.analyzeReading(reading, waterTemp);
                if (event != nullptr) {
                    detectedCount++;
                    wsSendDetection(*event);
                    Alert a("INFO", "Microplastic detected!", simulationTime, 4);
                    alertQueue.enqueue(a);
                    wsSendAlert(a);
                    delete event;
                }
            }
            wsBroadcast("{\"type\":\"simProgress\",\"phase\":\"PROCESSING\",\"current\":" + String(i + 1) + ",\"total\":" + String(numReadings) + ",\"running\":true}");
            delay(50);
            webSocket.loop(); // Keep WS alive during simulation
        }

        pumpController.stop();
        laserChamber.laserDeactivate();
        wsBroadcast("{\"type\":\"simProgress\",\"phase\":\"DONE\",\"current\":" + String(numReadings) + ",\"total\":" + String(numReadings) + ",\"running\":false}");
        wsSendStatus();
    }
    else if (payload.indexOf("\"cmd\":\"sensorLog\"") >= 0) {
        if (payload.indexOf("\"action\":\"add\"") >= 0) {
            int tsIdx = payload.indexOf("\"ts\":");
            int vIdx = payload.indexOf("\"voltage\":");
            float ts = tsIdx >= 0 ? payload.substring(tsIdx + 5).toFloat() : simulationTime;
            float v = vIdx >= 0 ? payload.substring(vIdx + 10).toFloat() : 2.9;
            SensorReading r(ts, v, "PHOTODIODE");
            sensorLog.append(r);
            wsSendSensorReading(r);
        } else if (payload.indexOf("\"action\":\"addBeginning\"") >= 0) {
            float v = (analogRead(PHOTODIODE_PIN) / 4095.0f) * 3.3f;
            SensorReading r(0, v, "PHOTODIODE");
            sensorLog.insertAtBeginning(r);
            wsSendSensorReading(r);
        } else if (payload.indexOf("\"action\":\"deleteFirst\"") >= 0) {
            sensorLog.deleteFromBeginning();
            wsBroadcast("{\"type\":\"sensorLogAction\",\"action\":\"deleteFirst\"}");
        } else if (payload.indexOf("\"action\":\"deleteLast\"") >= 0) {
            sensorLog.deleteFromEnd();
            wsBroadcast("{\"type\":\"sensorLogAction\",\"action\":\"deleteLast\"}");
        }
        wsSendStatus();
    }
    else if (payload.indexOf("\"cmd\":\"sort\"") >= 0) {
        if (sensorLog.isEmpty()) return;
        int arrSize;
        SensorReading* arr = sensorLog.toArray(arrSize);
        if (!arr) return;

        if (payload.indexOf("\"algo\":\"bubble\"") >= 0) { bubbleSort(arr, arrSize); }
        else if (payload.indexOf("\"algo\":\"selection\"") >= 0) { selectionSort(arr, arrSize); }
        else if (payload.indexOf("\"algo\":\"insertion\"") >= 0) { insertionSort(arr, arrSize); }
        else if (payload.indexOf("\"algo\":\"merge\"") >= 0) { mergeSortWrapper(arr, arrSize); }
        else if (payload.indexOf("\"algo\":\"quick\"") >= 0) { quickSortWrapper(arr, arrSize); }

        // Send sorted result
        String json = "{\"type\":\"sortResult\",\"algo\":\"sorted\",\"data\":[";
        for (int i = 0; i < arrSize; i++) {
            if (i > 0) json += ",";
            json += "{\"ts\":" + String(arr[i].getTimestamp(), 2) + ",\"v\":" + String(arr[i].getVoltage(), 3) + "}";
        }
        json += "]}";
        wsBroadcast(json);
        delete[] arr;
    }
    else if (payload.indexOf("\"cmd\":\"alertQueue\"") >= 0) {
        if (payload.indexOf("\"action\":\"processAll\"") >= 0) {
            alertQueue.processAll();
            wsBroadcast("{\"type\":\"alertAction\",\"action\":\"processAll\"}");
        } else if (payload.indexOf("\"action\":\"processOne\"") >= 0) {
            if (!alertQueue.isEmpty()) alertQueue.dequeue();
            wsBroadcast("{\"type\":\"alertAction\",\"action\":\"processOne\"}");
        } else if (payload.indexOf("\"action\":\"addPriority\"") >= 0) {
            int pIdx = payload.indexOf("\"priority\":");
            int priority = pIdx >= 0 ? payload.substring(pIdx + 11).toInt() : 4;
            simulationTime += 0.1;
            String types[] = {"", "CRITICAL", "ERROR", "WARNING", "INFO"};
            String type = (priority >= 1 && priority <= 4) ? types[priority] : "INFO";
            Alert a(type, "Dashboard alert", simulationTime, priority);
            alertQueue.enqueuePriority(a);
            wsSendAlert(a);
        }
        wsSendStatus();
    }
    else if (payload.indexOf("\"cmd\":\"slidingWindow\"") >= 0) {
        if (payload.indexOf("\"action\":\"add\"") >= 0) {
            int vIdx = payload.indexOf("\"voltage\":");
            float v = vIdx >= 0 ? payload.substring(vIdx + 10).toFloat() : ((analogRead(PHOTODIODE_PIN) / 4095.0f) * 3.3f);
            simulationTime += 0.5;
            SensorReading r(simulationTime, v, "PHOTODIODE");
            slidingWindow.insert(r);
            sensorLog.append(r);
            wsSendSensorReading(r);
        } else if (payload.indexOf("\"action\":\"fill\"") >= 0) {
            for (int i = 0; i < 10; i++) {
                float v = (analogRead(PHOTODIODE_PIN) / 4095.0f) * 3.3f;
                simulationTime += 0.1;
                SensorReading r(simulationTime, v, "PHOTODIODE");
                slidingWindow.insert(r);
                sensorLog.append(r);
                wsSendSensorReading(r);
            }
        }
        wsSendStatus();
    }
    else if (payload.indexOf("\"cmd\":\"pump\"") >= 0) {
        if (payload.indexOf("\"action\":\"start\"") >= 0 || payload.indexOf("\"action\":\"on\"") >= 0) {
            pumpController.start();
        } else if (payload.indexOf("\"action\":\"stop\"") >= 0 || payload.indexOf("\"action\":\"off\"") >= 0) {
            pumpController.stop();
        } else if (payload.indexOf("\"action\":\"toggle\"") >= 0) {
            if (pumpController.isRunning()) pumpController.stop(); else pumpController.start();
        }
        wsSendStatus();
    }
    else if (payload.indexOf("\"cmd\":\"laser\"") >= 0) {
        if (payload.indexOf("\"action\":\"activate\"") >= 0 || payload.indexOf("\"action\":\"on\"") >= 0) {
            laserChamber.laserActivate();
        } else if (payload.indexOf("\"action\":\"deactivate\"") >= 0 || payload.indexOf("\"action\":\"off\"") >= 0) {
            laserChamber.laserDeactivate();
        } else if (payload.indexOf("\"action\":\"toggle\"") >= 0) {
            if (laserChamber.isOn()) laserChamber.laserDeactivate(); else laserChamber.laserActivate();
        }
        wsSendStatus();
    }
}

// ============================================================
//  WEBSOCKET: Event handler
// ============================================================
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.print("  [WS] Client #"); Serial.print(num); Serial.println(" disconnected");
            wsClientConnected = false;
            break;
        case WStype_CONNECTED:
            Serial.print("  [WS] Client #"); Serial.print(num); Serial.println(" connected");
            wsClientConnected = true;
            wsSendStatus();  // Send initial status
            break;
        case WStype_TEXT:
            handleWebSocketCommand(String((char*)payload));
            break;
    }
}

// ============================================================
//  HELPER: Read integer from Serial Monitor
// ============================================================
int readSerialInt() {
    while (!Serial.available()) {
        webSocket.loop(); // Keep WS alive while waiting for Serial
        delay(10);
    }
    int val = Serial.parseInt();
    while (Serial.available()) Serial.read();
    return val;
}

float readSerialFloat() {
    while (!Serial.available()) {
        webSocket.loop();
        delay(10);
    }
    float val = Serial.parseFloat();
    while (Serial.available()) Serial.read();
    return val;
}

// ============================================================
//  MENU DISPLAYS (unchanged)
// ============================================================
void displayMainMenu() {
    Serial.println();
    Serial.println("  ==========================================");
    Serial.println("   MICROPLASTIC DETECTOR — DSA PROJECT");
    Serial.println("   MIT Manipal | ESP32 | 3rd Semester");
    Serial.println("  ==========================================");
    Serial.println("   1. Run Full Detection Simulation");
    Serial.println("   2. Sensor Log (Singly Linked List)");
    Serial.println("   3. Sliding Window (Circular LL)");
    Serial.println("   4. Sorting Algorithms");
    Serial.println("   5. Alert Queue");
    Serial.println("   6. System Status");
    Serial.println("  ==========================================");
    Serial.println("  Enter choice (1-6):");
}

// ============================================================
//  1. FULL SIMULATION (unchanged — still works from Serial)
// ============================================================
void runFullSimulation() {
    Serial.println("\n  How many samples? (5-30):");
    int numReadings = readSerialInt();
    if (numReadings < 5) numReadings = 5;
    if (numReadings > 30) numReadings = 30;

    Serial.println("\n  --- Phase 1: Calibration ---");
    float waterTemp = tempSensor.readTemp();
    tempSensor.displayStatus();
    float corrected = tempSensor.correctBaseline(3.0);
    laserChamber.calibrate(corrected);

    Serial.println("\n  --- Phase 2: Pump Start ---");
    pumpController.start();
    laserChamber.laserActivate();

    Serial.print("\n  --- Processing "); Serial.print(numReadings); Serial.println(" samples ---");
    int detectedCount = 0;

    for (int i = 0; i < numReadings; i++) {
        simulationTime += 0.5;
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
        SensorReading reading = laserChamber.takeReading(simulationTime);
        reading.setValid(true);
        sensorLog.append(reading);
        slidingWindow.insert(reading);
        MicroplasticEvent* event = laserChamber.analyzeReading(reading, waterTemp);
        if (event != nullptr) {
            detectedCount++;
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
        delay(50);
    }

    Serial.println("\n  --- Shutdown ---");
    pumpController.stop();
    laserChamber.laserDeactivate();

    Serial.println("\n  ====== RESULTS ======");
    Serial.print("  Samples:   "); Serial.println(numReadings);
    Serial.print("  Detected:  "); Serial.println(detectedCount);
    Serial.print("  Rejected:  "); Serial.println(turbiditySensor.getRejectedCount());
    Serial.println("  ====================\n");

    // Also update dashboard
    wsSendStatus();
}

// ============================================================
//  2-6. SERIAL MENUS
// ============================================================
void sensorLogMenu() {
    Serial.println("\n  === SENSOR LOG (Singly LL) ===");
    Serial.println("  1. Display all  2. Add  3. Del first  4. Del last  5. Stats  0. Back");
    int ch = readSerialInt();
    switch (ch) {
        case 1: sensorLog.displayAll(); break;
        case 2: { Serial.println("  Timestamp:"); float ts = readSerialFloat(); Serial.println("  Voltage:"); float v = readSerialFloat(); sensorLog.append(SensorReading(ts, v, "PHOTODIODE")); Serial.println("  Added!"); break; }
        case 3: Serial.println(sensorLog.deleteFromBeginning() ? "  Deleted." : "  Empty!"); break;
        case 4: Serial.println(sensorLog.deleteFromEnd() ? "  Deleted." : "  Empty!"); break;
        case 5: Serial.print("  Total: "); Serial.println(sensorLog.getSize()); Serial.print("  Valid: "); Serial.println(sensorLog.countValid()); break;
    }
    wsSendStatus();
}

void slidingWindowMenu() {
    Serial.println("\n  === SLIDING WINDOW ===");
    Serial.println("  1. Display  2. Add  3. Fill  0. Back");
    int ch = readSerialInt();
    switch (ch) {
        case 1: slidingWindow.display(); break;
        case 2: { Serial.println("  Voltage:"); float v = readSerialFloat(); simulationTime += 0.5; slidingWindow.insert(SensorReading(simulationTime, v, "PHOTODIODE")); Serial.println("  Added!"); break; }
        case 3: { for (int i = 0; i < 10; i++) { float v = (analogRead(PHOTODIODE_PIN) / 4095.0f) * 3.3f; slidingWindow.insert(SensorReading(i * 0.5, v, "PHOTODIODE")); } Serial.println("  Filled from physical sensor!"); slidingWindow.display(); break; }
    }
    wsSendStatus();
}

void sortingMenu() {
    if (sensorLog.isEmpty()) { Serial.println("  [!] Run simulation first"); return; }
    Serial.println("\n  === SORTING ===");
    Serial.println("  1. Bubble  2. Selection  3. Insertion  4. Merge  5. Quick  6. All  0. Back");
    int ch = readSerialInt();
    if (ch < 1 || ch > 6) return;
    int arrSize; SensorReading* arr = sensorLog.toArray(arrSize); if (!arr) return;
    if (ch == 6) {
        for (int s = 0; s < 5; s++) {
            SensorReading* copy = new SensorReading[arrSize];
            for (int i = 0; i < arrSize; i++) copy[i] = arr[i];
            switch (s) { case 0: bubbleSort(copy, arrSize); break; case 1: selectionSort(copy, arrSize); break; case 2: insertionSort(copy, arrSize); break; case 3: mergeSortWrapper(copy, arrSize); break; case 4: quickSortWrapper(copy, arrSize); break; }
            delete[] copy;
        }
    } else {
        SensorReading* copy = new SensorReading[arrSize];
        for (int i = 0; i < arrSize; i++) copy[i] = arr[i];
        printReadingArray(copy, arrSize, "BEFORE");
        switch (ch) { case 1: bubbleSort(copy, arrSize); break; case 2: selectionSort(copy, arrSize); break; case 3: insertionSort(copy, arrSize); break; case 4: mergeSortWrapper(copy, arrSize); break; case 5: quickSortWrapper(copy, arrSize); break; }
        String names[] = {"", "BUBBLE", "SELECTION", "INSERTION", "MERGE", "QUICK"};
        printReadingArray(copy, arrSize, names[ch] + " SORTED");
        delete[] copy;
    }
    delete[] arr;
}

void alertQueueMenu() {
    Serial.println("\n  === ALERT QUEUE ===");
    Serial.println("  1. View  2. Process all  3. Add  4. Add CRITICAL  0. Back");
    int ch = readSerialInt();
    switch (ch) {
        case 1: alertQueue.display(); break;
        case 2: alertQueue.processAll(); break;
        case 3: { simulationTime += 0.1; alertQueue.enqueue(Alert("WARNING", "Manual test", simulationTime, 3)); Serial.println("  Added."); break; }
        case 4: { simulationTime += 0.1; alertQueue.enqueuePriority(Alert("CRITICAL", "Critical test!", simulationTime, 1)); Serial.println("  Critical added!"); break; }
    }
    wsSendStatus();
}

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
    Serial.print("  Sensor Log: "); Serial.println(sensorLog.getSize());
    Serial.print("  Circular:   "); Serial.print(slidingWindow.getSize()); Serial.print("/"); Serial.println(slidingWindow.getCapacity());
    Serial.print("  Queue:      "); Serial.println(alertQueue.getSize());
    Serial.print("\n  Sim Time:   "); Serial.print(simulationTime, 1); Serial.println("s");
    Serial.print("  Free Heap:  "); Serial.print(ESP.getFreeHeap()); Serial.println(" bytes");
    Serial.print("  WiFi IP:    "); Serial.println(WiFi.localIP());
    Serial.println("  ==========================================\n");
    wsSendStatus();
}

// ============================================================
//  SETUP — WiFi + WebSocket + Pins
// ============================================================
void setup() {
    Serial.begin(115200);
    delay(1000);

    // Configure physical hardware pins
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(LASER_PIN, OUTPUT);
    pinMode(TURBIDITY_PIN, INPUT);
    pinMode(PHOTODIODE_PIN, INPUT);
    pinMode(TEMP_PIN, INPUT_PULLUP); // OneWire / Digital / Analog Pullup
    analogSetPinAttenuation(TURBIDITY_PIN, ADC_11db);
    analogSetPinAttenuation(PHOTODIODE_PIN, ADC_11db);
    digitalWrite(RELAY_PIN, LOW);
    digitalWrite(LASER_PIN, LOW);

    Serial.println();
    Serial.println("  ==========================================");
    Serial.println("  |   MICROPLASTIC DETECTION SYSTEM        |");
    Serial.println("  |   DSA Project — ESP32 WiFi Version     |");
    Serial.println("  |   MIT Manipal | B.Tech CPS | Sem 3     |");
    Serial.println("  ==========================================");

    // Connect to WiFi
    WiFi.mode(WIFI_STA);              // Station mode only (don't create an AP)
    WiFi.setAutoReconnect(true);      // Auto-reconnect if signal drops
    WiFi.persistent(true);            // Remember credentials across reboots
    Serial.print("\n  Connecting to WiFi: "); Serial.print(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(" Connected!");
        Serial.print("  >> Dashboard URL: http://");
        Serial.print(WiFi.localIP());
        Serial.println(":81");
        Serial.println("  >> Open your Next.js dashboard and enter this IP");
    } else {
        Serial.println(" FAILED!");
        Serial.println("  >> Running in Serial-only mode (no WiFi)");
        Serial.println("  >> Check SSID/Password in code");
    }

    // Start WebSocket server
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    Serial.println("  >> WebSocket server started on port 81");

    Serial.println();
    displayMainMenu();
}

// ============================================================
//  LOOP — Serial + WebSocket
// ============================================================
unsigned long lastStatusBroadcast = 0;
unsigned long lastWiFiCheck = 0;

void loop() {
    // Process WebSocket events
    webSocket.loop();

    // WiFi watchdog — check every 10 seconds and reconnect if dropped
    if (millis() - lastWiFiCheck > 10000) {
        lastWiFiCheck = millis();
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("  [WiFi] Connection lost! Reconnecting...");
            WiFi.disconnect();
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
            int retries = 0;
            while (WiFi.status() != WL_CONNECTED && retries < 20) {
                delay(500);
                Serial.print(".");
                retries++;
            }
            if (WiFi.status() == WL_CONNECTED) {
                Serial.print("\n  [WiFi] Reconnected! IP: ");
                Serial.println(WiFi.localIP());
            } else {
                Serial.println("\n  [WiFi] Reconnect failed. Will retry in 10s.");
            }
        }
    }

    // Periodically broadcast real hardware sensor data to connected dashboard (every 1 second)
    if (wsClientConnected && millis() - lastStatusBroadcast > 1000) {
        wsSendSensorData();
        lastStatusBroadcast = millis();
    }

    // Serial Monitor input (unchanged behavior)
    if (Serial.available() > 0) {
        int choice = Serial.parseInt();
        while (Serial.available()) Serial.read();

        switch (choice) {
            case 1:  runFullSimulation();  break;
            case 2:  sensorLogMenu();      break;
            case 3:  slidingWindowMenu();  break;
            case 4:  sortingMenu();        break;
            case 5:  alertQueueMenu();     break;
            case 6:  showStatus();         break;
            default:
                if (choice != 0) Serial.println("  Invalid.");
                break;
        }
        displayMainMenu();
    }

    delay(10);
}
