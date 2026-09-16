// ============================================================
//  SearchAlgorithms.h (Arduino/ESP32 Version)
//  Linear Search & Binary Search
//  DSA Concepts: Linear Search, Binary Search
// ============================================================
#ifndef SEARCH_ALGORITHMS_H
#define SEARCH_ALGORITHMS_H

#include "SensorReading.h"

// ---- 1. LINEAR SEARCH — O(n) ----
int linearSearchByVoltage(SensorReading arr[], int n, float targetVoltage, bool findBelow) {
    Serial.print("  >> Linear Search: ");
    Serial.print(findBelow ? "below " : "above ");
    Serial.print(targetVoltage, 2); Serial.println("V...");

    for (int i = 0; i < n; i++) {
        if (findBelow && arr[i].getVoltage() < targetVoltage) {
            Serial.print("  >> Found at index "); Serial.print(i); Serial.println(":");
            arr[i].display();
            return i;
        }
        if (!findBelow && arr[i].getVoltage() > targetVoltage) {
            Serial.print("  >> Found at index "); Serial.print(i); Serial.println(":");
            arr[i].display();
            return i;
        }
    }
    Serial.println("  >> No match found.");
    return -1;
}

int linearSearchAllBreach(SensorReading arr[], int n, float threshold) {
    Serial.print("  >> Finding ALL below "); Serial.print(threshold, 2); Serial.println("V...");
    int count = 0;
    for (int i = 0; i < n; i++) {
        if (arr[i].getVoltage() < threshold) {
            Serial.print("  >> ["); Serial.print(count + 1); Serial.print("] idx ");
            Serial.print(i); Serial.print(": ");
            arr[i].display();
            count++;
        }
    }
    if (count == 0) Serial.println("  >> No readings below threshold.");
    else { Serial.print("  >> Total: "); Serial.println(count); }
    return count;
}

// ---- 2. BINARY SEARCH — O(log n) (requires sorted array) ----
int binarySearchByVoltage(SensorReading arr[], int n, float targetVoltage) {
    Serial.print("  >> Binary Search for ~"); Serial.print(targetVoltage, 2); Serial.println("V...");

    int low = 0, high = n - 1;
    int closestIdx = -1;
    float closestDiff = 999.0;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        float midV = arr[mid].getVoltage();
        float diff = abs(midV - targetVoltage);

        if (diff < closestDiff) {
            closestDiff = diff;
            closestIdx = mid;
        }

        if (abs(midV - targetVoltage) < 0.01) {
            Serial.print("  >> Exact match at index "); Serial.print(mid); Serial.println(":");
            arr[mid].display();
            return mid;
        } else if (midV < targetVoltage) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    if (closestIdx != -1) {
        Serial.print("  >> Closest at index "); Serial.print(closestIdx);
        Serial.print(" (diff: "); Serial.print(closestDiff, 3); Serial.println("V):");
        arr[closestIdx].display();
    }
    return closestIdx;
}

int findMinVoltage(SensorReading arr[], int n) {
    if (n == 0) return -1;
    int minIdx = 0;
    for (int i = 1; i < n; i++)
        if (arr[i].getVoltage() < arr[minIdx].getVoltage()) minIdx = i;
    Serial.println("  >> Minimum voltage:");
    arr[minIdx].display();
    return minIdx;
}

int findMaxVoltage(SensorReading arr[], int n) {
    if (n == 0) return -1;
    int maxIdx = 0;
    for (int i = 1; i < n; i++)
        if (arr[i].getVoltage() > arr[maxIdx].getVoltage()) maxIdx = i;
    Serial.println("  >> Maximum voltage:");
    arr[maxIdx].display();
    return maxIdx;
}

#endif
