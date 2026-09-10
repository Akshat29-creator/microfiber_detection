// ============================================================
//  CircularBuffer.h
//  CIRCULAR LINKED LIST: Sliding window for baseline calculation
//  DSA Concepts: Circular Linked List, Pointers, Sliding Window
// ============================================================
#ifndef CIRCULAR_BUFFER_H
#define CIRCULAR_BUFFER_H

#include "SensorReading.h"

// ---- Node for Circular Linked List ----
struct CircularNode {
    SensorReading data;
    CircularNode* next;     // POINTER to next node (wraps around!)

    CircularNode(SensorReading reading) : data(reading), next(nullptr) {}
};

// ---- Class: CircularBuffer (Circular Linked List) ----
// Maintains the LAST N sensor readings in a ring buffer
// Used for computing the moving average baseline voltage
// When buffer is full, the oldest reading is overwritten
class CircularBuffer {
private:
    CircularNode* tail;     // POINTER to the most recently inserted node
    int capacity;           // Maximum number of readings to keep
    int currentSize;        // Current number of readings in the buffer

public:
    // Constructor — creates an empty circular buffer of given capacity
    CircularBuffer(int cap = 10) : tail(nullptr), capacity(cap), currentSize(0) {}

    // Destructor — must break the circle before deleting
    ~CircularBuffer() {
        if (tail == nullptr) return;

        // Break the circular link
        CircularNode* current = tail->next;     // Start from head
        tail->next = nullptr;                   // Break the circle

        while (current != nullptr) {
            CircularNode* temp = current;
            current = current->next;
            delete temp;
        }
        tail = nullptr;
        currentSize = 0;
    }

    // ---- Insert Reading ----
    // If buffer is not full: adds a new node to the circle
    // If buffer IS full: overwrites the oldest reading (sliding window!)
    void insert(SensorReading reading) {
        if (currentSize == 0) {
            // First node — points to itself (circular!)
            CircularNode* newNode = new CircularNode(reading);
            newNode->next = newNode;    // Self-loop: the circle
            tail = newNode;
            currentSize++;
        }
        else if (currentSize < capacity) {
            // Buffer not full — insert after tail
            CircularNode* newNode = new CircularNode(reading);
            newNode->next = tail->next;     // New node points to head
            tail->next = newNode;           // Old tail points to new node
            tail = newNode;                 // Update tail
            currentSize++;
        }
        else {
            // Buffer FULL — overwrite the oldest (head) and advance
            // The head is tail->next in a circular list
            CircularNode* oldHead = tail->next;
            oldHead->data = reading;        // Overwrite oldest data
            tail = oldHead;                 // Old head becomes new tail
            // The circle naturally advances — no new allocation needed!
        }
    }

    // ---- Calculate Moving Average — O(n) ----
    // Traverses the entire circle to compute average voltage
    // This IS the baseline voltage for temperature-compensated detection
    double getMovingAverage() const {
        if (currentSize == 0) return 0.0;

        double sum = 0.0;
        CircularNode* current = tail->next;     // Start at head

        // Traverse the circle once
        for (int i = 0; i < currentSize; i++) {
            sum += current->data.getVoltage();
            current = current->next;
        }

        return sum / currentSize;
    }

    // ---- Get Min Voltage in Window ----
    double getMinVoltage() const {
        if (currentSize == 0) return 0.0;

        double minV = 999.0;
        CircularNode* current = tail->next;

        for (int i = 0; i < currentSize; i++) {
            if (current->data.getVoltage() < minV)
                minV = current->data.getVoltage();
            current = current->next;
        }
        return minV;
    }

    // ---- Get Max Voltage in Window ----
    double getMaxVoltage() const {
        if (currentSize == 0) return 0.0;

        double maxV = -999.0;
        CircularNode* current = tail->next;

        for (int i = 0; i < currentSize; i++) {
            if (current->data.getVoltage() > maxV)
                maxV = current->data.getVoltage();
            current = current->next;
        }
        return maxV;
    }

    // ---- Display All Readings in the Window ----
    void display() const {
        if (currentSize == 0) {
            cout << "  [Circular Buffer is empty]" << endl;
            return;
        }

        cout << "\n  ====== CIRCULAR BUFFER (Sliding Window) ======" << endl;
        cout << "  Capacity: " << capacity << " | Current: " << currentSize << endl;
        cout << "  -----------------------------------------------" << endl;

        CircularNode* current = tail->next;     // Start at head of circle
        for (int i = 0; i < currentSize; i++) {
            cout << "  [Slot " << (i + 1) << "] ";
            current->data.display();
            current = current->next;
        }

        cout << fixed << setprecision(2);
        cout << "  -----------------------------------------------" << endl;
        cout << "  Moving Average : " << getMovingAverage() << " V" << endl;
        cout << "  Min Voltage    : " << getMinVoltage() << " V" << endl;
        cout << "  Max Voltage    : " << getMaxVoltage() << " V" << endl;
        cout << "  ================================================\n" << endl;
    }

    // ---- Getters ----
    int getSize() const { return currentSize; }
    int getCapacity() const { return capacity; }
    bool isFull() const { return currentSize == capacity; }
    bool isEmpty() const { return currentSize == 0; }
};

#endif // CIRCULAR_BUFFER_H
