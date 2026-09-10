// ============================================================
//  CalibrationStack.h (Arduino/ESP32 Version)
//  STACK (LIFO): Undo/Redo for calibration
//  DSA Concepts: Stack, Linked List-based Stack, Pointers
// ============================================================
#ifndef CALIBRATION_STACK_H
#define CALIBRATION_STACK_H

#include <Arduino.h>

struct CalibrationState {
    float baselineVoltage;
    float turbidityThreshold;
    float tempCorrection;
    float timestamp;
    String description;

    CalibrationState()
        : baselineVoltage(3.0), turbidityThreshold(2.5),
          tempCorrection(1.0), timestamp(0), description("Default") {}

    CalibrationState(float bv, float tt, float tc, float ts, String desc)
        : baselineVoltage(bv), turbidityThreshold(tt),
          tempCorrection(tc), timestamp(ts), description(desc) {}

    void display() const {
        Serial.print("  [");
        Serial.print(timestamp, 2);
        Serial.print("s] Baseline=");
        Serial.print(baselineVoltage, 2);
        Serial.print("V | TurbThresh=");
        Serial.print(turbidityThreshold, 2);
        Serial.print("V | TempFactor=");
        Serial.print(tempCorrection, 2);
        Serial.print(" | ");
        Serial.println(description);
    }
};

struct StackNode {
    CalibrationState data;
    StackNode* next;
    StackNode(CalibrationState state) : data(state), next(nullptr) {}
};

// ---- Class: CalibrationStack ----
class CalibrationStack {
private:
    StackNode* top;
    int size;

public:
    CalibrationStack() : top(nullptr), size(0) {}
    ~CalibrationStack() { while (!isEmpty()) pop(); }

    // ---- Push — O(1) ----
    void push(CalibrationState state) {
        StackNode* newNode = new StackNode(state);
        newNode->next = top;
        top = newNode;
        size++;
    }

    // ---- Pop — O(1) ----
    CalibrationState pop() {
        if (top == nullptr) {
            Serial.println("  [Stack empty - nothing to undo!]");
            return CalibrationState();
        }
        StackNode* temp = top;
        CalibrationState state = temp->data;
        top = top->next;
        delete temp;
        size--;
        return state;
    }

    CalibrationState peek() const {
        if (top == nullptr) return CalibrationState();
        return top->data;
    }

    CalibrationState undo() {
        if (size < 2) {
            Serial.println("  [Cannot undo - no previous state]");
            return (top != nullptr) ? top->data : CalibrationState();
        }
        CalibrationState removed = pop();
        Serial.print("  Undone: "); Serial.println(removed.description);
        Serial.print("  Restored: "); Serial.println(peek().description);
        return peek();
    }

    void display() const {
        if (top == nullptr) {
            Serial.println("  [Calibration Stack empty]");
            return;
        }
        Serial.println("\n  ====== CALIBRATION STACK (LIFO) ======");
        Serial.print("  Depth: "); Serial.println(size);
        StackNode* current = top;
        int level = 1;
        while (current != nullptr) {
            Serial.print(level == 1 ? "  TOP-> " : "        ");
            Serial.print(level); Serial.print(". ");
            current->data.display();
            current = current->next;
            level++;
        }
        Serial.println("  ======================================\n");
    }

    int getSize() const { return size; }
    bool isEmpty() const { return top == nullptr; }
};

#endif
