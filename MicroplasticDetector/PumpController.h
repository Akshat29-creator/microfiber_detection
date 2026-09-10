// ============================================================
//  PumpController.h
//  CLASS: Controls the peristaltic pump via relay
//  DSA Concepts: Classes & Objects, Encapsulation
// ============================================================
#ifndef PUMP_CONTROLLER_H
#define PUMP_CONTROLLER_H

#include <iostream>
#include <string>

using namespace std;

// ---- Pump State Enum ----
enum PumpState {
    PUMP_OFF,
    PUMP_RUNNING,
    PUMP_ERROR,
    PUMP_EMERGENCY_STOP
};

// ---- Class: PumpController ----
// Simulates the 5V Peristaltic Pump + 1-Channel Relay Module
class PumpController {
private:
    PumpState state;            // Current pump state
    bool relayEngaged;          // Whether the relay is closed (pump powered)
    double flowRate;            // ml per second
    double totalVolumeProcessed;  // Total ml pumped
    int startCount;             // Number of times pump was started

public:
    // Constructor
    PumpController(double flow = 2.0)
        : state(PUMP_OFF), relayEngaged(false), flowRate(flow),
          totalVolumeProcessed(0), startCount(0) {}

    // ---- Start Pump ----
    // ESP32 sends 3.3V signal to close the relay
    bool start() {
        if (state == PUMP_ERROR) {
            cout << "  [Pump] ERROR: Cannot start — pump is in error state!" << endl;
            return false;
        }

        relayEngaged = true;
        state = PUMP_RUNNING;
        startCount++;
        cout << "  [Pump] Relay CLOSED. Pump RUNNING at " << flowRate << " ml/s" << endl;
        return true;
    }

    // ---- Stop Pump ----
    bool stop() {
        relayEngaged = false;
        state = PUMP_OFF;
        cout << "  [Pump] Relay OPENED. Pump STOPPED." << endl;
        return true;
    }

    // ---- Emergency Shutoff ----
    // Called when turbidity is too high
    void emergencyShutoff(const string& reason) {
        relayEngaged = false;
        state = PUMP_EMERGENCY_STOP;
        cout << "  [Pump] *** EMERGENCY SHUTOFF ***" << endl;
        cout << "  [Pump] Reason: " << reason << endl;
    }

    // ---- Simulate Pumping for Duration ----
    double pumpForDuration(double seconds) {
        if (state != PUMP_RUNNING) {
            cout << "  [Pump] Cannot pump — pump is not running!" << endl;
            return 0;
        }
        double volume = flowRate * seconds;
        totalVolumeProcessed += volume;
        return volume;
    }

    // ---- Reset Error State ----
    void reset() {
        state = PUMP_OFF;
        relayEngaged = false;
        cout << "  [Pump] Reset complete. Ready to start." << endl;
    }

    // ---- Get State as String ----
    string getStateString() const {
        switch (state) {
            case PUMP_OFF:              return "OFF";
            case PUMP_RUNNING:          return "RUNNING";
            case PUMP_ERROR:            return "ERROR";
            case PUMP_EMERGENCY_STOP:   return "EMERGENCY STOP";
            default:                    return "UNKNOWN";
        }
    }

    // ---- Display Status ----
    void displayStatus() const {
        cout << "  Pump Controller Status:" << endl;
        cout << "    State          : " << getStateString() << endl;
        cout << "    Relay          : " << (relayEngaged ? "CLOSED (ON)" : "OPEN (OFF)") << endl;
        cout << "    Flow Rate      : " << flowRate << " ml/s" << endl;
        cout << "    Total Processed: " << totalVolumeProcessed << " ml" << endl;
        cout << "    Start Count    : " << startCount << endl;
    }

    // ---- Getters ----
    bool isRunning() const { return state == PUMP_RUNNING; }
    PumpState getState() const { return state; }
};

#endif // PUMP_CONTROLLER_H
