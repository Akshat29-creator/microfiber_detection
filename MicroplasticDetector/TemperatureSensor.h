// ============================================================
//  TemperatureSensor.h
//  CLASS: DS18B20 temperature sensor simulation
//  DSA Concepts: Classes & Objects, Encapsulation
// ============================================================
#ifndef TEMPERATURE_SENSOR_H
#define TEMPERATURE_SENSOR_H

#include <iostream>
#include <iomanip>
#include <cstdlib>
#include <cmath>

using namespace std;

// ---- Class: TemperatureSensor ----
// Simulates the DS18B20 waterproof temperature probe
// Provides temperature-based correction factor for optical baseline
class TemperatureSensor {
private:
    double currentTemp;         // Current water temperature (°C)
    double referenceTemp;       // Reference temperature for calibration (25°C)
    double correctionFactor;    // Applied to photodiode baseline
    int totalReadings;

public:
    // Constructor
    TemperatureSensor(double refTemp = 25.0)
        : currentTemp(25.0), referenceTemp(refTemp),
          correctionFactor(1.0), totalReadings(0) {}

    // ---- Read Temperature (Simulated) ----
    double readTemp() {
        // Simulate temperature between 15°C and 35°C
        currentTemp = 15.0 + (rand() % 200) / 10.0;
        totalReadings++;
        calculateCorrection();
        return currentTemp;
    }

    // ---- Read with specific temperature ----
    double readTemp(double temp) {
        currentTemp = temp;
        totalReadings++;
        calculateCorrection();
        return currentTemp;
    }

    // ---- Calculate Temperature Correction Factor ----
    // Water's refractive index changes ~0.01 per 10°C
    // This adjusts the baseline so detection stays accurate
    void calculateCorrection() {
        double tempDiff = currentTemp - referenceTemp;
        // Correction: slight adjustment for temperature deviation
        correctionFactor = 1.0 - (tempDiff * 0.001);
    }

    // ---- Get Correction Factor ----
    double getCorrectionFactor() const { return correctionFactor; }

    // ---- Apply Correction to Baseline ----
    double correctBaseline(double rawBaseline) const {
        return rawBaseline * correctionFactor;
    }

    // ---- Display Status ----
    void displayStatus() const {
        cout << fixed << setprecision(2);
        cout << "  Temperature Sensor Status:" << endl;
        cout << "    Current Temp     : " << currentTemp << " C" << endl;
        cout << "    Reference Temp   : " << referenceTemp << " C" << endl;
        cout << "    Correction Factor: " << correctionFactor << endl;
        cout << "    Total Readings   : " << totalReadings << endl;
    }

    // ---- Getters ----
    double getTemperature() const { return currentTemp; }
};

#endif // TEMPERATURE_SENSOR_H
