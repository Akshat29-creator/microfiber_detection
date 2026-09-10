// ============================================================
//  Dashboard.h
//  CLASS: Simulates the Blynk IoT Digital Twin Dashboard
//  DSA Concepts: Classes & Objects, Encapsulation
// ============================================================
#ifndef DASHBOARD_H
#define DASHBOARD_H

#include <iostream>
#include <iomanip>
#include <string>

using namespace std;

// ---- Class: Dashboard ----
// Simulates the real-time Blynk dashboard that displays sensor data
// In the real project, this sends data over Wi-Fi to the cloud
class Dashboard {
private:
    int totalDetections;
    double lastVoltage;
    double lastTemperature;
    double lastTurbidity;
    string systemStatus;
    bool connected;

public:
    // Constructor
    Dashboard()
        : totalDetections(0), lastVoltage(0), lastTemperature(0),
          lastTurbidity(0), systemStatus("IDLE"), connected(false) {}

    // ---- Connect to Dashboard ----
    void connect() {
        connected = true;
        systemStatus = "CONNECTED";
        cout << "\n";
        cout << "  +==============================================+" << endl;
        cout << "  |   BLYNK IoT DIGITAL TWIN — CONNECTED         |" << endl;
        cout << "  |   Microplastic Optical Flow Tracker          |" << endl;
        cout << "  +==============================================+" << endl;
        cout << endl;
    }

    // ---- Update Detection Count ----
    void updateDetection(int count) {
        totalDetections = count;
    }

    // ---- Update Sensor Values ----
    void updateSensors(double voltage, double temp, double turbidity) {
        lastVoltage = voltage;
        lastTemperature = temp;
        lastTurbidity = turbidity;
    }

    // ---- Set System Status ----
    void setStatus(const string& status) {
        systemStatus = status;
    }

    // ---- Display Full Dashboard ----
    void displayDashboard() const {
        cout << fixed << setprecision(2);
        cout << "\n  +======================================================+" << endl;
        cout << "  |          MICROPLASTIC TRACKER — LIVE DASHBOARD       |" << endl;
        cout << "  +======================================================+" << endl;
        cout << "  |                                                      |" << endl;
        cout << "  |  System Status  : " << setw(15) << systemStatus << "                    |" << endl;
        cout << "  |  Connection     : " << setw(15) << (connected ? "ONLINE" : "OFFLINE") << "                    |" << endl;
        cout << "  |                                                      |" << endl;
        cout << "  +----------- SENSOR READINGS --------------------------+" << endl;
        cout << "  |                                                      |" << endl;
        cout << "  |  Photodiode     : " << setw(8) << lastVoltage << " V                         |" << endl;
        cout << "  |  Temperature    : " << setw(8) << lastTemperature << " C                         |" << endl;
        cout << "  |  Turbidity      : " << setw(8) << lastTurbidity << " V                         |" << endl;
        cout << "  |                                                      |" << endl;
        cout << "  +----------- DETECTION COUNTER ------------------------+" << endl;
        cout << "  |                                                      |" << endl;
        cout << "  |  Microplastics Detected : " << setw(6) << totalDetections << "                         |" << endl;
        cout << "  |                                                      |" << endl;
        cout << "  +======================================================+\n" << endl;
    }

    // ---- Log Alert ----
    void logAlert(const string& alertType, const string& message) {
        cout << "  [DASHBOARD ALERT] " << alertType << ": " << message << endl;
    }

    // ---- Display Mini Graph (ASCII art voltage visualization) ----
    void displayVoltageGraph(double voltages[], int n, double baseline) const {
        cout << "\n  ====== VOLTAGE GRAPH (ASCII) ======" << endl;
        cout << "  Baseline: " << baseline << "V" << endl;
        cout << "  -----------------------------------" << endl;

        for (int i = 0; i < n && i < 40; i++) {
            cout << "  " << setw(4) << i << " | ";

            int barLen = (int)((voltages[i] / 5.0) * 40);
            for (int j = 0; j < barLen; j++) {
                if (voltages[i] < baseline - 0.15)
                    cout << "!";        // Detection marker
                else
                    cout << "#";        // Normal reading
            }

            cout << " " << voltages[i] << "V";
            if (voltages[i] < baseline - 0.15)
                cout << " <-- DETECTION!";
            cout << endl;
        }
        cout << "  ===================================\n" << endl;
    }

    // ---- Getters ----
    int getDetectionCount() const { return totalDetections; }
    bool isConnected() const { return connected; }
};

#endif // DASHBOARD_H
