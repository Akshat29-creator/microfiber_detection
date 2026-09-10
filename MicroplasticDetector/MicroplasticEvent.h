// ============================================================
//  MicroplasticEvent.h
//  CLASS: Represents a confirmed microplastic detection
//  DSA Concepts: Classes & Objects, Encapsulation
// ============================================================
#ifndef MICROPLASTIC_EVENT_H
#define MICROPLASTIC_EVENT_H

#include <iostream>
#include <iomanip>
#include <string>

using namespace std;

// ---- Class: MicroplasticEvent ----
// Created when the laser chamber detects a V-shaped voltage dip
class MicroplasticEvent {
private:
    int eventID;                // Unique event identifier
    double timestamp;           // When the detection occurred (seconds)
    double voltageDrop;         // Magnitude of the voltage dip (V)
    double baselineVoltage;     // What the steady-state voltage was (V)
    double duration;            // How long the dip lasted (milliseconds)
    double waterTemperature;    // Water temp at time of detection (°C)
    string severity;            // "LOW", "MEDIUM", "HIGH"

    static int nextID;          // Static counter for auto-incrementing IDs

public:
    // Default constructor
    MicroplasticEvent()
        : eventID(0), timestamp(0), voltageDrop(0), baselineVoltage(3.0),
          duration(0), waterTemperature(25.0), severity("LOW") {}

    // Parameterized constructor
    MicroplasticEvent(double ts, double drop, double baseline, double dur, double temp)
        : timestamp(ts), voltageDrop(drop), baselineVoltage(baseline),
          duration(dur), waterTemperature(temp) {
        eventID = nextID++;
        // Auto-classify severity based on voltage drop percentage
        double dropPercent = (voltageDrop / baselineVoltage) * 100.0;
        if (dropPercent > 20.0)
            severity = "HIGH";
        else if (dropPercent > 10.0)
            severity = "MEDIUM";
        else
            severity = "LOW";
    }

    // ---- Getters ----
    int getEventID() const { return eventID; }
    double getTimestamp() const { return timestamp; }
    double getVoltageDrop() const { return voltageDrop; }
    double getBaselineVoltage() const { return baselineVoltage; }
    double getDuration() const { return duration; }
    double getWaterTemperature() const { return waterTemperature; }
    string getSeverity() const { return severity; }

    // ---- Confidence Score ----
    // Higher voltage drop + shorter duration = more likely a real particle
    double confidence() const {
        double dropRatio = voltageDrop / baselineVoltage;
        double durationFactor = (duration < 5.0) ? 1.0 : (5.0 / duration);
        return (dropRatio * 70.0 + durationFactor * 30.0); // Score out of ~100
    }

    // ---- Display ----
    void display() const {
        cout << fixed << setprecision(2);
        cout << "  Event #" << setw(3) << eventID
             << " | Time: " << setw(7) << timestamp << "s"
             << " | Drop: " << setw(5) << voltageDrop << "V"
             << " | Baseline: " << setw(5) << baselineVoltage << "V"
             << " | Duration: " << setw(5) << duration << "ms"
             << " | Severity: " << setw(6) << severity
             << " | Confidence: " << setw(5) << confidence() << "%"
             << endl;
    }

    // ---- Comparison operators (for sorting) ----
    bool operator<(const MicroplasticEvent& other) const {
        return timestamp < other.timestamp;
    }
    bool operator>(const MicroplasticEvent& other) const {
        return timestamp > other.timestamp;
    }
};

// Initialize static ID counter
int MicroplasticEvent::nextID = 1;

#endif // MICROPLASTIC_EVENT_H
