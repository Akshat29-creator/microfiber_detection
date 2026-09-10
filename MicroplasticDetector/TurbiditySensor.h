// ============================================================
//  TurbiditySensor.h
//  CLASS: Simulates the turbidity failsafe logic
//  DSA Concepts: Classes & Objects, Encapsulation
// ============================================================
#ifndef TURBIDITY_SENSOR_H
#define TURBIDITY_SENSOR_H

#include <iostream>
#include <iomanip>
#include <cstdlib>

using namespace std;

// ---- Class: TurbiditySensor ----
// Simulates the Analog Turbidity Sensor Module
// High voltage = clear water, Low voltage = muddy water
class TurbiditySensor {
private:
    double currentVoltage;      // Current reading (0-5V)
    double clearThreshold;      // Minimum voltage to consider water "clear"
    int totalReadings;          // Count of readings taken
    int rejectedSamples;        // Count of rejected (muddy) samples

public:
    // Constructor
    TurbiditySensor(double threshold = 2.5)
        : currentVoltage(0), clearThreshold(threshold),
          totalReadings(0), rejectedSamples(0) {}

    // ---- Read Sensor (Simulated) ----
    // Generates a simulated voltage reading
    // In real ESP32, this would read from the ADC pin
    double readSensor() {
        // Simulate: mostly clear water with occasional muddy readings
        int r = rand() % 100;
        if (r < 15) {
            // 15% chance of muddy water
            currentVoltage = 1.0 + (rand() % 200) / 100.0;   // 1.0 - 3.0V (muddy)
        } else {
            // 85% chance of clear water
            currentVoltage = 3.5 + (rand() % 150) / 100.0;   // 3.5 - 5.0V (clear)
        }
        totalReadings++;
        return currentVoltage;
    }

    // ---- Read with custom voltage (for manual testing) ----
    double readSensor(double voltage) {
        currentVoltage = voltage;
        totalReadings++;
        return currentVoltage;
    }

    // ---- Check if water is clear enough ----
    // This is the FAILSAFE LOGIC from the project documentation
    bool isClear() const {
        return currentVoltage >= clearThreshold;
    }

    // ---- Validate Sample ----
    // Returns true if water passes turbidity check
    bool validateSample() {
        readSensor();
        if (!isClear()) {
            rejectedSamples++;
            return false;
        }
        return true;
    }

    // ---- Display Status ----
    void displayStatus() const {
        cout << fixed << setprecision(2);
        cout << "  Turbidity Sensor Status:" << endl;
        cout << "    Current Voltage : " << currentVoltage << " V" << endl;
        cout << "    Clear Threshold : " << clearThreshold << " V" << endl;
        cout << "    Water Status    : " << (isClear() ? "CLEAR (OK)" : "MUDDY (REJECTED)") << endl;
        cout << "    Total Readings  : " << totalReadings << endl;
        cout << "    Rejected Samples: " << rejectedSamples << endl;
    }

    // ---- Getters / Setters ----
    double getVoltage() const { return currentVoltage; }
    double getThreshold() const { return clearThreshold; }
    void setThreshold(double t) { clearThreshold = t; }
    int getRejectedCount() const { return rejectedSamples; }
};

#endif // TURBIDITY_SENSOR_H
