// ============================================================
//  SortingAlgorithms.h (Arduino/ESP32 Version)
//  5 Sorting Algorithms on sensor reading arrays
//  DSA Concepts: Bubble, Selection, Insertion, Merge, Quick Sort
// ============================================================
#ifndef SORTING_ALGORITHMS_H
#define SORTING_ALGORITHMS_H

#include "SensorReading.h"

void swapReadings(SensorReading& a, SensorReading& b) {
    SensorReading temp = a; a = b; b = temp;
}

void printReadingArray(SensorReading arr[], int n, const String& title) {
    Serial.print("\n  --- "); Serial.print(title); Serial.println(" ---");
    for (int i = 0; i < n; i++) {
        Serial.print("  "); Serial.print(i + 1); Serial.print(". ");
        arr[i].display();
    }
}

// ---- 1. BUBBLE SORT — O(n^2) ----
void bubbleSort(SensorReading arr[], int n) {
    Serial.print("  >> Bubble Sort on "); Serial.print(n); Serial.println(" readings...");
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j].getVoltage() > arr[j + 1].getVoltage()) {
                swapReadings(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
    Serial.println("  >> Bubble Sort done!");
}

// ---- 2. SELECTION SORT — O(n^2) ----
void selectionSort(SensorReading arr[], int n) {
    Serial.print("  >> Selection Sort on "); Serial.print(n); Serial.println(" readings...");
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++)
            if (arr[j].getVoltage() < arr[minIdx].getVoltage()) minIdx = j;
        if (minIdx != i) swapReadings(arr[i], arr[minIdx]);
    }
    Serial.println("  >> Selection Sort done!");
}

// ---- 3. INSERTION SORT — O(n^2) ----
void insertionSort(SensorReading arr[], int n) {
    Serial.print("  >> Insertion Sort on "); Serial.print(n); Serial.println(" readings...");
    for (int i = 1; i < n; i++) {
        SensorReading key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j].getVoltage() > key.getVoltage()) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
    Serial.println("  >> Insertion Sort done!");
}

// ---- 4. MERGE SORT — O(n log n) ----
void merge(SensorReading arr[], int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;
    SensorReading* leftArr = new SensorReading[n1];
    SensorReading* rightArr = new SensorReading[n2];

    for (int i = 0; i < n1; i++) leftArr[i] = arr[left + i];
    for (int j = 0; j < n2; j++) rightArr[j] = arr[mid + 1 + j];

    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        if (leftArr[i].getVoltage() <= rightArr[j].getVoltage())
            arr[k++] = leftArr[i++];
        else
            arr[k++] = rightArr[j++];
    }
    while (i < n1) arr[k++] = leftArr[i++];
    while (j < n2) arr[k++] = rightArr[j++];

    delete[] leftArr;
    delete[] rightArr;
}

void mergeSort(SensorReading arr[], int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

void mergeSortWrapper(SensorReading arr[], int n) {
    Serial.print("  >> Merge Sort on "); Serial.print(n); Serial.println(" readings...");
    mergeSort(arr, 0, n - 1);
    Serial.println("  >> Merge Sort done!");
}

// ---- 5. QUICK SORT — O(n log n) avg ----
int partition(SensorReading arr[], int low, int high) {
    float pivot = arr[high].getVoltage();
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j].getVoltage() <= pivot) {
            i++;
            swapReadings(arr[i], arr[j]);
        }
    }
    swapReadings(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(SensorReading arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

void quickSortWrapper(SensorReading arr[], int n) {
    Serial.print("  >> Quick Sort on "); Serial.print(n); Serial.println(" readings...");
    quickSort(arr, 0, n - 1);
    Serial.println("  >> Quick Sort done!");
}

#endif
