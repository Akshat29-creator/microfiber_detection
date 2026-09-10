// ============================================================
//  SensorReading.h (Arduino/ESP32 Version)
//  CLASS: Stores a single sensor data point
//  DSA Concepts: Classes & Objects, Encapsulation
// ============================================================
#ifndef SENSOR_READING_H
#define SENSOR_READING_H

#include <Arduino.h>

// ---- Class: SensorReading ----
class SensorReading {
private:
    float timestamp;
    float voltage;
    String sensorType;
    bool valid;

public:
    SensorReading() : timestamp(0), voltage(0), sensorType("UNKNOWN"), valid(false) {}

    SensorReading(float ts, float v, String type)
        : timestamp(ts), voltage(v), sensorType(type), valid(true) {}

    SensorReading(const SensorReading& other)
        : timestamp(other.timestamp), voltage(other.voltage),
          sensorType(other.sensorType), valid(other.valid) {}

    SensorReading& operator=(const SensorReading& other) {
        if (this != &other) {
            timestamp = other.timestamp;
            voltage = other.voltage;
            sensorType = other.sensorType;
            valid = other.valid;
        }
        return *this;
    }

    float getTimestamp() const { return timestamp; }
    float getVoltage() const { return voltage; }
    String getSensorType() const { return sensorType; }
    bool isValid() const { return valid; }
    void setValid(bool v) { valid = v; }
    void setVoltage(float v) { voltage = v; }

    void display() const {
        Serial.print("  [");
        Serial.print(timestamp, 2);
        Serial.print("s] ");
        Serial.print(sensorType);
        Serial.print(" -> ");
        Serial.print(voltage, 2);
        Serial.print(" V");
        Serial.println(valid ? "  (Valid)" : "  (INVALID)");
    }
};

#endif
