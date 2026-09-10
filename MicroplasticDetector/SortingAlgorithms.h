// ============================================================
//  SortingAlgorithms.h
//  Sorting algorithms applied on sensor reading arrays
//  DSA Concepts: Bubble Sort, Selection Sort, Merge Sort,
//                Quick Sort, Insertion Sort
// ============================================================
#ifndef SORTING_ALGORITHMS_H
#define SORTING_ALGORITHMS_H

#include "SensorReading.h"
#include <iostream>
#include <iomanip>

using namespace std;

// ---- Utility: Swap two SensorReadings ----
void swapReadings(SensorReading& a, SensorReading& b) {
    SensorReading temp = a;
    a = b;
    b = temp;
}

// ---- Utility: Print array of readings ----
void printReadingArray(SensorReading arr[], int n, const string& title) {
    cout << "\n  --- " << title << " ---" << endl;
    for (int i = 0; i < n; i++) {
        cout << "  " << (i + 1) << ". ";
        arr[i].display();
    }
    cout << endl;
}

// ============================================================
//  1. BUBBLE SORT — O(n²)
//  Compares adjacent elements and swaps if out of order
//  Good for: Small datasets, understanding basic sorting
// ============================================================
void bubbleSort(SensorReading arr[], int n) {
    cout << "\n  >> Running Bubble Sort on " << n << " readings..." << endl;

    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j].getVoltage() > arr[j + 1].getVoltage()) {
                swapReadings(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        // Optimization: if no swaps in a pass, array is sorted
        if (!swapped) break;
    }

    cout << "  >> Bubble Sort complete!" << endl;
}

// ============================================================
//  2. SELECTION SORT — O(n²)
//  Finds the minimum in unsorted portion and places it
//  Good for: When number of swaps should be minimized
// ============================================================
void selectionSort(SensorReading arr[], int n) {
    cout << "\n  >> Running Selection Sort on " << n << " readings..." << endl;

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j].getVoltage() < arr[minIdx].getVoltage()) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            swapReadings(arr[i], arr[minIdx]);
        }
    }

    cout << "  >> Selection Sort complete!" << endl;
}

// ============================================================
//  3. INSERTION SORT — O(n²)
//  Inserts each element into its correct position
//  Good for: Nearly sorted data (like sensor readings with small noise)
// ============================================================
void insertionSort(SensorReading arr[], int n) {
    cout << "\n  >> Running Insertion Sort on " << n << " readings..." << endl;

    for (int i = 1; i < n; i++) {
        SensorReading key = arr[i];
        int j = i - 1;

        // Shift elements greater than key to the right
        while (j >= 0 && arr[j].getVoltage() > key.getVoltage()) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }

    cout << "  >> Insertion Sort complete!" << endl;
}

// ============================================================
//  4. MERGE SORT — O(n log n)
//  Divide and conquer: splits, sorts halves, merges
//  Good for: Large datasets, guaranteed O(n log n)
// ============================================================

// Helper: Merge two sorted halves
void merge(SensorReading arr[], int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;

    // Create temporary arrays (dynamic allocation with pointers!)
    SensorReading* leftArr = new SensorReading[n1];
    SensorReading* rightArr = new SensorReading[n2];

    // Copy data to temp arrays
    for (int i = 0; i < n1; i++)
        leftArr[i] = arr[left + i];
    for (int j = 0; j < n2; j++)
        rightArr[j] = arr[mid + 1 + j];

    // Merge temp arrays back
    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        if (leftArr[i].getVoltage() <= rightArr[j].getVoltage()) {
            arr[k] = leftArr[i];
            i++;
        } else {
            arr[k] = rightArr[j];
            j++;
        }
        k++;
    }

    // Copy remaining elements
    while (i < n1) { arr[k] = leftArr[i]; i++; k++; }
    while (j < n2) { arr[k] = rightArr[j]; j++; k++; }

    // Free temporary arrays
    delete[] leftArr;
    delete[] rightArr;
}

// Recursive Merge Sort
void mergeSort(SensorReading arr[], int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;

        mergeSort(arr, left, mid);          // Sort left half
        mergeSort(arr, mid + 1, right);     // Sort right half
        merge(arr, left, mid, right);       // Merge sorted halves
    }
}

// Wrapper for merge sort
void mergeSortWrapper(SensorReading arr[], int n) {
    cout << "\n  >> Running Merge Sort on " << n << " readings..." << endl;
    mergeSort(arr, 0, n - 1);
    cout << "  >> Merge Sort complete!" << endl;
}

// ============================================================
//  5. QUICK SORT — O(n log n) average, O(n²) worst
//  Picks a pivot, partitions around it
//  Good for: Fast in practice, in-place sorting
// ============================================================

// Partition function using last element as pivot
int partition(SensorReading arr[], int low, int high) {
    double pivot = arr[high].getVoltage();
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

// Recursive Quick Sort
void quickSort(SensorReading arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);

        quickSort(arr, low, pi - 1);    // Sort left of pivot
        quickSort(arr, pi + 1, high);   // Sort right of pivot
    }
}

// Wrapper for quick sort
void quickSortWrapper(SensorReading arr[], int n) {
    cout << "\n  >> Running Quick Sort on " << n << " readings..." << endl;
    quickSort(arr, 0, n - 1);
    cout << "  >> Quick Sort complete!" << endl;
}

#endif // SORTING_ALGORITHMS_H
