// ============================================================
//  CalibrationStack.h
//  STACK (LIFO): Undo/Redo for sensor calibration changes
//  DSA Concepts: Stack, Linked List-based Stack, Pointers
// ============================================================
#ifndef CALIBRATION_STACK_H
#define CALIBRATION_STACK_H

#include <iostream>
#include <string>
#include <iomanip>

using namespace std;

// ---- CalibrationState: Snapshot of system calibration ----
struct CalibrationState {
    double baselineVoltage;     // Optical baseline (V)
    double turbidityThreshold;  // Max allowed turbidity voltage
    double tempCorrection;      // Temperature correction factor
    double timestamp;           // When this calibration was set
    string description;         // What changed

    CalibrationState()
        : baselineVoltage(3.0), turbidityThreshold(2.5),
          tempCorrection(1.0), timestamp(0), description("Default") {}

    CalibrationState(double bv, double tt, double tc, double ts, string desc)
        : baselineVoltage(bv), turbidityThreshold(tt),
          tempCorrection(tc), timestamp(ts), description(desc) {}

    void display() const {
        cout << fixed << setprecision(2);
        cout << "  [" << setw(7) << timestamp << "s] "
             << "Baseline=" << baselineVoltage << "V"
             << " | Turbidity Thresh=" << turbidityThreshold << "V"
             << " | Temp Factor=" << tempCorrection
             << " | " << description << endl;
    }
};

// ---- Stack Node ----
struct StackNode {
    CalibrationState data;
    StackNode* next;            // POINTER to node below in stack

    StackNode(CalibrationState state) : data(state), next(nullptr) {}
};

// ---- Class: CalibrationStack (LIFO Stack using Linked List) ----
// Push calibration changes onto the stack
// Pop to UNDO the last calibration (restore previous state)
class CalibrationStack {
private:
    StackNode* top;     // POINTER to top of stack
    int size;

public:
    // Constructor
    CalibrationStack() : top(nullptr), size(0) {}

    // Destructor
    ~CalibrationStack() {
        while (!isEmpty()) {
            pop();
        }
    }

    // ---- Push — O(1) ----
    // Save a calibration state (like Ctrl+Z history)
    void push(CalibrationState state) {
        StackNode* newNode = new StackNode(state);
        newNode->next = top;    // New node points to current top
        top = newNode;          // Update top pointer
        size++;
    }

    // ---- Pop — O(1) ----
    // Remove and return the most recent calibration (UNDO)
    CalibrationState pop() {
        if (top == nullptr) {
            cout << "  [Stack is empty — nothing to undo!]" << endl;
            return CalibrationState();
        }

        StackNode* temp = top;
        CalibrationState state = temp->data;
        top = top->next;        // Move top pointer down
        delete temp;            // Free memory
        size--;
        return state;
    }

    // ---- Peek — O(1) ----
    // View current (top) calibration without removing
    CalibrationState peek() const {
        if (top == nullptr) {
            return CalibrationState();
        }
        return top->data;
    }

    // ---- Undo Last Calibration ----
    // Pops the top and returns the NEW top (previous state)
    CalibrationState undo() {
        if (size < 2) {
            cout << "  [Cannot undo — no previous state available]" << endl;
            return (top != nullptr) ? top->data : CalibrationState();
        }

        CalibrationState removed = pop();
        cout << "  Undone: " << removed.description << endl;
        cout << "  Restored to: " << peek().description << endl;
        return peek();
    }

    // ---- Display Entire Stack (top to bottom) ----
    void display() const {
        if (top == nullptr) {
            cout << "  [Calibration Stack is empty]" << endl;
            return;
        }

        cout << "\n  ====== CALIBRATION STACK (LIFO) ======" << endl;
        cout << "  Stack Depth: " << size << endl;
        cout << "  (Top = most recent calibration)" << endl;
        cout << "  --------------------------------------" << endl;

        StackNode* current = top;
        int level = 1;
        while (current != nullptr) {
            cout << "  " << (level == 1 ? "TOP-> " : "      ") << level << ". ";
            current->data.display();
            current = current->next;
            level++;
        }
        cout << "  ======================================\n" << endl;
    }

    // ---- Getters ----
    int getSize() const { return size; }
    bool isEmpty() const { return top == nullptr; }
};

#endif // CALIBRATION_STACK_H
