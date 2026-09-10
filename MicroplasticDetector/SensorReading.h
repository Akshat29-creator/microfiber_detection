// ============================================================
//  SensorReading.h
//  CLASS: Stores a single sensor data point
//  DSA Concepts: Classes & Objects, Encapsulation
// ============================================================
#ifndef SENSOR_READING_H
#define SENSOR_READING_H

#include <iostream>
#include <string>
#include <iomanip>

using namespace std;

// ---- Class: SensorReading ----
// Represents one data point from any sensor (Turbidity, Photodiode, Temperature)
class SensorReading {
private:
    double timestamp;       // Time in seconds since session start
    double voltage;         // Analog voltage reading (0.0 - 5.0V)
    string sensorType;      // "TURBIDITY", "PHOTODIODE", "TEMPERATURE"
    bool valid;             // Whether reading passed failsafe checks

public:
    // Default constructor
    SensorReading() : timestamp(0), voltage(0), sensorType("UNKNOWN"), valid(false) {}

    // Parameterized constructor
    SensorReading(double ts, double v, string type)
        : timestamp(ts), voltage(v), sensorType(type), valid(true) {}

    // Copy constructor (demonstrates deep copy with pointers concept)
    SensorReading(const SensorReading& other)
        : timestamp(other.timestamp), voltage(other.voltage),
          sensorType(other.sensorType), valid(other.valid) {}

    // ---- Getters ----
    double getTimestamp() const { return timestamp; }
    double getVoltage() const { return voltage; }
    string getSensorType() const { return sensorType; }
    bool isValid() const { return valid; }

    // ---- Setters ----
    void setValid(bool v) { valid = v; }
    void setVoltage(double v) { voltage = v; }

    // ---- Display ----
    void display() const {
        cout << fixed << setprecision(2);
        cout << "  [" << setw(7) << timestamp << "s] "
             << setw(12) << sensorType
             << " -> " << setw(6) << voltage << " V"
             << (valid ? "  (Valid)" : "  (INVALID)") << endl;
    }

    // ---- Comparison operators (used by sorting algorithms) ----
    bool operator<(const SensorReading& other) const {
        return voltage < other.voltage;
    }
    bool operator>(const SensorReading& other) const {
        return voltage > other.voltage;
    }
    bool operator==(const SensorReading& other) const {
        return (timestamp == other.timestamp && voltage == other.voltage);
    }
};

#endif // SENSOR_READING_H
