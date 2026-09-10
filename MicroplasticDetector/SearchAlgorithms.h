// ============================================================
//  SearchAlgorithms.h
//  Searching algorithms on sensor reading arrays
//  DSA Concepts: Linear Search, Binary Search
// ============================================================
#ifndef SEARCH_ALGORITHMS_H
#define SEARCH_ALGORITHMS_H

#include "SensorReading.h"
#include <iostream>
#include <iomanip>
#include <cmath>

using namespace std;

// ============================================================
//  1. LINEAR SEARCH — O(n)
//  Sequentially checks each element
//  Works on unsorted data
// ============================================================

// Search by voltage threshold — find first reading above/below a voltage
int linearSearchByVoltage(SensorReading arr[], int n, double targetVoltage, bool findBelow) {
    cout << "\n  >> Linear Search: Looking for readings "
         << (findBelow ? "below " : "above ") << targetVoltage << "V..." << endl;

    for (int i = 0; i < n; i++) {
        if (findBelow && arr[i].getVoltage() < targetVoltage) {
            cout << "  >> Found at index " << i << ":" << endl;
            arr[i].display();
            return i;
        }
        if (!findBelow && arr[i].getVoltage() > targetVoltage) {
            cout << "  >> Found at index " << i << ":" << endl;
            arr[i].display();
            return i;
        }
    }

    cout << "  >> No matching reading found." << endl;
    return -1;
}

// Search by timestamp
int linearSearchByTimestamp(SensorReading arr[], int n, double timestamp) {
    cout << "\n  >> Linear Search: Looking for timestamp " << timestamp << "s..." << endl;

    for (int i = 0; i < n; i++) {
        if (fabs(arr[i].getTimestamp() - timestamp) < 0.01) {
            cout << "  >> Found at index " << i << ":" << endl;
            arr[i].display();
            return i;
        }
    }

    cout << "  >> No reading at timestamp " << timestamp << "s" << endl;
    return -1;
}

// Find ALL readings that breach a threshold
int linearSearchAllBreach(SensorReading arr[], int n, double threshold) {
    cout << "\n  >> Linear Search: Finding ALL readings below " << threshold << "V..." << endl;
    int count = 0;

    for (int i = 0; i < n; i++) {
        if (arr[i].getVoltage() < threshold) {
            cout << "  >> [" << (count + 1) << "] Index " << i << ": ";
            arr[i].display();
            count++;
        }
    }

    if (count == 0)
        cout << "  >> No readings below threshold." << endl;
    else
        cout << "  >> Total matches: " << count << endl;

    return count;
}

// ============================================================
//  2. BINARY SEARCH — O(log n)
//  Requires SORTED array
//  Divides search space in half each step
// ============================================================

// Binary search for exact voltage (on sorted array)
int binarySearchByVoltage(SensorReading arr[], int n, double targetVoltage) {
    cout << "\n  >> Binary Search: Looking for voltage ~" << targetVoltage << "V..." << endl;

    int low = 0, high = n - 1;
    int closestIdx = -1;
    double closestDiff = 999.0;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        double midVoltage = arr[mid].getVoltage();
        double diff = fabs(midVoltage - targetVoltage);

        // Track closest match
        if (diff < closestDiff) {
            closestDiff = diff;
            closestIdx = mid;
        }

        if (fabs(midVoltage - targetVoltage) < 0.01) {
            cout << "  >> Exact match at index " << mid << ":" << endl;
            arr[mid].display();
            return mid;
        } else if (midVoltage < targetVoltage) {
            low = mid + 1;      // Search right half
        } else {
            high = mid - 1;     // Search left half
        }
    }

    if (closestIdx != -1) {
        cout << "  >> Closest match at index " << closestIdx
             << " (diff: " << closestDiff << "V):" << endl;
        arr[closestIdx].display();
    } else {
        cout << "  >> No match found." << endl;
    }

    return closestIdx;
}

// Binary search for timestamp (on array sorted by timestamp)
int binarySearchByTimestamp(SensorReading arr[], int n, double targetTimestamp) {
    cout << "\n  >> Binary Search: Looking for timestamp ~" << targetTimestamp << "s..." << endl;

    int low = 0, high = n - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        double midTime = arr[mid].getTimestamp();

        if (fabs(midTime - targetTimestamp) < 0.01) {
            cout << "  >> Found at index " << mid << ":" << endl;
            arr[mid].display();
            return mid;
        } else if (midTime < targetTimestamp) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    cout << "  >> No reading found at timestamp " << targetTimestamp << "s" << endl;
    return -1;
}

// ============================================================
//  3. FIND MIN / MAX — O(n)
// ============================================================
int findMinVoltage(SensorReading arr[], int n) {
    if (n == 0) return -1;

    int minIdx = 0;
    for (int i = 1; i < n; i++) {
        if (arr[i].getVoltage() < arr[minIdx].getVoltage())
            minIdx = i;
    }

    cout << "\n  >> Minimum voltage reading:" << endl;
    arr[minIdx].display();
    return minIdx;
}

int findMaxVoltage(SensorReading arr[], int n) {
    if (n == 0) return -1;

    int maxIdx = 0;
    for (int i = 1; i < n; i++) {
        if (arr[i].getVoltage() > arr[maxIdx].getVoltage())
            maxIdx = i;
    }

    cout << "\n  >> Maximum voltage reading:" << endl;
    arr[maxIdx].display();
    return maxIdx;
}

#endif // SEARCH_ALGORITHMS_H
