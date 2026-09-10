// ============================================================
//  LaserChamber.h
//  CLASS: Simulates the PVC Dark Chamber optical detection
//  DSA Concepts: Classes & Objects, Encapsulation, Pointers
// ============================================================
#ifndef LASER_CHAMBER_H
#define LASER_CHAMBER_H

#include <iostream>
#include <iomanip>
#include <cstdlib>
#include <cmath>
#include "SensorReading.h"
#include "MicroplasticEvent.h"

using namespace std;

// ---- Class: LaserChamber ----
// Simulates the 650nm laser + BPW34 photodiode dark chamber
// Detects microplastics by identifying V-shaped voltage dips
class LaserChamber {
private:
    double baselineVoltage;     // Steady-state photodiode voltage (V)
    double detectionThreshold;  // Min voltage drop to count as detection (V)
    bool laserOn;               // Whether laser is currently active
    int detectionCount;         // Total particles detected

public:
    // Constructor
    LaserChamber(double baseline = 3.0, double threshold = 0.15)
        : baselineVoltage(baseline), detectionThreshold(threshold),
          laserOn(false), detectionCount(0) {}

    // ---- Turn Laser On/Off ----
    void laserActivate() {
        laserOn = true;
        cout << "  [Laser Chamber] 650nm laser ACTIVATED." << endl;
    }

    void laserDeactivate() {
        laserOn = false;
        cout << "  [Laser Chamber] Laser DEACTIVATED." << endl;
    }

    // ---- Calibrate Baseline ----
    void calibrate(double correctedBaseline) {
        baselineVoltage = correctedBaseline;
        cout << fixed << setprecision(2);
        cout << "  [Laser Chamber] Baseline calibrated to " << baselineVoltage << "V" << endl;
    }

    // ---- Simulate Single Reading ----
    // Returns a SensorReading from the photodiode
    // Randomly simulates clear water vs particle detection
    SensorReading takeReading(double timestamp) {
        if (!laserOn) {
            cout << "  [Laser Chamber] ERROR: Laser is OFF!" << endl;
            return SensorReading(timestamp, 0, "PHOTODIODE");
        }

        double voltage;
        int r = rand() % 100;

        if (r < 20) {
            // 20% chance: Microplastic particle in beam path!
            // Voltage drops by 0.15V to 0.8V
            double drop = 0.15 + (rand() % 65) / 100.0;
            voltage = baselineVoltage - drop;
        } else {
            // 80% chance: Clear water, minor noise only
            double noise = (rand() % 10 - 5) / 100.0;   // ±0.05V noise
            voltage = baselineVoltage + noise;
        }

        return SensorReading(timestamp, voltage, "PHOTODIODE");
    }

    // ---- Detect Microplastic from Reading ----
    // Returns a MicroplasticEvent pointer if detection, nullptr otherwise
    // Demonstrates POINTER usage — returns dynamically allocated object
    MicroplasticEvent* analyzeReading(SensorReading reading, double waterTemp) {
        double drop = baselineVoltage - reading.getVoltage();

        if (drop >= detectionThreshold) {
            // V-shaped dip detected — this is a microplastic!
            double duration = 1.0 + (rand() % 90) / 10.0;  // 1-10ms simulated

            // Create event using dynamic allocation (POINTER!)
            MicroplasticEvent* event = new MicroplasticEvent(
                reading.getTimestamp(),
                drop,
                baselineVoltage,
                duration,
                waterTemp
            );

            detectionCount++;
            return event;   // Return POINTER to caller
        }

        return nullptr;     // No detection — null pointer
    }

    // ---- Display Status ----
    void displayStatus() const {
        cout << fixed << setprecision(2);
        cout << "  Laser Chamber Status:" << endl;
        cout << "    Laser         : " << (laserOn ? "ON (650nm)" : "OFF") << endl;
        cout << "    Baseline      : " << baselineVoltage << " V" << endl;
        cout << "    Det. Threshold: " << detectionThreshold << " V" << endl;
        cout << "    Total Detected: " << detectionCount << " particles" << endl;
    }

    // ---- Getters / Setters ----
    double getBaseline() const { return baselineVoltage; }
    void setBaseline(double b) { baselineVoltage = b; }
    double getThreshold() const { return detectionThreshold; }
    void setThreshold(double t) { detectionThreshold = t; }
    int getDetectionCount() const { return detectionCount; }
    bool isLaserOn() const { return laserOn; }
};

#endif // LASER_CHAMBER_H
