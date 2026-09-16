// ============================================================
//  CircularBuffer.h (Arduino/ESP32 Version)
//  CIRCULAR LINKED LIST: Sliding window for baseline
//  DSA Concepts: Circular Linked List, Pointers
// ============================================================
#ifndef CIRCULAR_BUFFER_H
#define CIRCULAR_BUFFER_H

#include "SensorReading.h"

struct CircularNode {
    SensorReading data;
    CircularNode* next;     // Wraps around in a circle!
    CircularNode(SensorReading reading) : data(reading), next(nullptr) {}
};

// ---- Class: CircularBuffer ----
// Ring buffer — when full, overwrites the oldest reading
class CircularBuffer {
private:
    CircularNode* tail;
    int capacity;
    int currentSize;

public:
    CircularBuffer(int cap = 10) : tail(nullptr), capacity(cap), currentSize(0) {}

    ~CircularBuffer() {
        if (tail == nullptr) return;
        CircularNode* current = tail->next;
        tail->next = nullptr;
        while (current != nullptr) {
            CircularNode* temp = current;
            current = current->next;
            delete temp;
        }
    }

    // ---- Insert (overwrites oldest when full) ----
    void insert(SensorReading reading) {
        if (currentSize == 0) {
            CircularNode* newNode = new CircularNode(reading);
            newNode->next = newNode;    // Points to itself — circle!
            tail = newNode;
            currentSize++;
        } else if (currentSize < capacity) {
            CircularNode* newNode = new CircularNode(reading);
            newNode->next = tail->next;
            tail->next = newNode;
            tail = newNode;
            currentSize++;
        } else {
            // FULL — overwrite oldest (head = tail->next)
            CircularNode* oldHead = tail->next;
            oldHead->data = reading;
            tail = oldHead;     // Advance the ring
        }
    }

    // ---- Moving Average — O(n) ----
    float getMovingAverage() const {
        if (currentSize == 0) return 0.0;
        float sum = 0.0;
        CircularNode* current = tail->next;
        for (int i = 0; i < currentSize; i++) {
            sum += current->data.getVoltage();
            current = current->next;
        }
        return sum / currentSize;
    }

    float getMinVoltage() const {
        if (currentSize == 0) return 0.0;
        float minV = 999.0;
        CircularNode* current = tail->next;
        for (int i = 0; i < currentSize; i++) {
            if (current->data.getVoltage() < minV)
                minV = current->data.getVoltage();
            current = current->next;
        }
        return minV;
    }

    float getMaxVoltage() const {
        if (currentSize == 0) return 0.0;
        float maxV = -999.0;
        CircularNode* current = tail->next;
        for (int i = 0; i < currentSize; i++) {
            if (current->data.getVoltage() > maxV)
                maxV = current->data.getVoltage();
            current = current->next;
        }
        return maxV;
    }

    void display() const {
        if (currentSize == 0) {
            Serial.println("  [Circular Buffer empty]");
            return;
        }
        Serial.println("\n  ====== CIRCULAR BUFFER (Sliding Window) ======");
        Serial.print("  Capacity: "); Serial.print(capacity);
        Serial.print(" | Used: "); Serial.println(currentSize);
        Serial.println("  ----------------------------------------------");

        CircularNode* current = tail->next;
        for (int i = 0; i < currentSize; i++) {
            Serial.print("  [Slot "); Serial.print(i + 1); Serial.print("] ");
            current->data.display();
            current = current->next;
        }
        Serial.print("  Moving Avg: "); Serial.print(getMovingAverage(), 2); Serial.println(" V");
        Serial.print("  Min: "); Serial.print(getMinVoltage(), 2);
        Serial.print(" V | Max: "); Serial.print(getMaxVoltage(), 2); Serial.println(" V");
        Serial.println("  ==============================================\n");
    }

    int getSize() const { return currentSize; }
    int getCapacity() const { return capacity; }
    bool isFull() const { return currentSize == capacity; }
    bool isEmpty() const { return currentSize == 0; }
};

#endif
