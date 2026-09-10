// ============================================================
//  SensorLinkedList.h
//  SINGLY LINKED LIST: Stores sensor readings in arrival order
//  DSA Concepts: Singly Linked List, Pointers, Dynamic Memory
// ============================================================
#ifndef SENSOR_LINKED_LIST_H
#define SENSOR_LINKED_LIST_H

#include "SensorReading.h"

// ---- Node structure for Singly Linked List ----
// Uses POINTER to next node (mandatory DSA concept)
struct SensorNode {
    SensorReading data;     // The sensor reading stored in this node
    SensorNode* next;       // POINTER to the next node in the list

    // Constructor using pointer initialization
    SensorNode(SensorReading reading) : data(reading), next(nullptr) {}
};

// ---- Class: SensorLinkedList (Singly Linked List) ----
// Models the live sensor data stream — new readings appended at tail
class SensorLinkedList {
private:
    SensorNode* head;       // POINTER to first node
    SensorNode* tail;       // POINTER to last node (for O(1) append)
    int size;               // Number of readings stored

public:
    // Constructor
    SensorLinkedList() : head(nullptr), tail(nullptr), size(0) {}

    // Destructor — frees all dynamically allocated nodes
    ~SensorLinkedList() {
        SensorNode* current = head;
        while (current != nullptr) {
            SensorNode* temp = current;
            current = current->next;   // Pointer traversal
            delete temp;               // Free memory
        }
        head = nullptr;
        tail = nullptr;
        size = 0;
    }

    // ---- Insert at End (Append) — O(1) ----
    // Simulates a new sensor reading arriving in real-time
    void append(SensorReading reading) {
        SensorNode* newNode = new SensorNode(reading);  // Dynamic allocation

        if (head == nullptr) {
            // List is empty — new node is both head and tail
            head = newNode;
            tail = newNode;
        } else {
            // Append at tail using pointer
            tail->next = newNode;
            tail = newNode;
        }
        size++;
    }

    // ---- Insert at Beginning — O(1) ----
    void insertAtBeginning(SensorReading reading) {
        SensorNode* newNode = new SensorNode(reading);
        newNode->next = head;   // Point new node to current head
        head = newNode;         // Update head pointer
        if (tail == nullptr) {
            tail = newNode;
        }
        size++;
    }

    // ---- Insert at Position — O(n) ----
    void insertAtPosition(SensorReading reading, int position) {
        if (position <= 0) {
            insertAtBeginning(reading);
            return;
        }
        if (position >= size) {
            append(reading);
            return;
        }

        SensorNode* newNode = new SensorNode(reading);
        SensorNode* current = head;

        // Traverse to the node just BEFORE the insertion point
        for (int i = 0; i < position - 1; i++) {
            current = current->next;    // Pointer traversal
        }

        newNode->next = current->next;  // Link new node to successor
        current->next = newNode;        // Link predecessor to new node
        size++;
    }

    // ---- Delete from Beginning — O(1) ----
    bool deleteFromBeginning() {
        if (head == nullptr) return false;

        SensorNode* temp = head;
        head = head->next;      // Move head pointer forward
        delete temp;            // Free old head
        size--;

        if (head == nullptr) tail = nullptr;
        return true;
    }

    // ---- Delete from End — O(n) ----
    bool deleteFromEnd() {
        if (head == nullptr) return false;

        if (head == tail) {
            // Only one node
            delete head;
            head = nullptr;
            tail = nullptr;
            size--;
            return true;
        }

        // Traverse to second-to-last node
        SensorNode* current = head;
        while (current->next != tail) {
            current = current->next;
        }

        delete tail;
        tail = current;
        tail->next = nullptr;
        size--;
        return true;
    }

    // ---- Delete by Timestamp — O(n) ----
    bool deleteByTimestamp(double timestamp) {
        if (head == nullptr) return false;

        // Special case: head node matches
        if (head->data.getTimestamp() == timestamp) {
            return deleteFromBeginning();
        }

        SensorNode* current = head;
        while (current->next != nullptr) {
            if (current->next->data.getTimestamp() == timestamp) {
                SensorNode* temp = current->next;
                current->next = temp->next;
                if (temp == tail) tail = current;
                delete temp;
                size--;
                return true;
            }
            current = current->next;
        }
        return false;
    }

    // ---- Traverse & Display All — O(n) ----
    void displayAll() const {
        if (head == nullptr) {
            cout << "  [Sensor Log is empty]" << endl;
            return;
        }

        cout << "\n  ====== SENSOR READING LOG (Singly Linked List) ======" << endl;
        cout << "  Total Readings: " << size << endl;
        cout << "  ---------------------------------------------------" << endl;

        SensorNode* current = head;     // Start at head
        int count = 1;
        while (current != nullptr) {
            cout << "  " << count << ". ";
            current->data.display();
            current = current->next;    // Move pointer to next node
            count++;
        }
        cout << "  ====================================================\n" << endl;
    }

    // ---- Get Size — O(1) ----
    int getSize() const { return size; }

    // ---- Check if Empty — O(1) ----
    bool isEmpty() const { return head == nullptr; }

    // ---- Get Head Pointer (for external traversal) ----
    SensorNode* getHead() const { return head; }

    // ---- Convert to Array (for sorting algorithms) ----
    SensorReading* toArray(int& outSize) const {
        outSize = size;
        if (size == 0) return nullptr;

        SensorReading* arr = new SensorReading[size];
        SensorNode* current = head;
        int i = 0;
        while (current != nullptr) {
            arr[i++] = current->data;
            current = current->next;
        }
        return arr;
    }

    // ---- Count readings by sensor type — O(n) ----
    int countByType(const string& type) const {
        int count = 0;
        SensorNode* current = head;
        while (current != nullptr) {
            if (current->data.getSensorType() == type)
                count++;
            current = current->next;
        }
        return count;
    }

    // ---- Count valid readings — O(n) ----
    int countValid() const {
        int count = 0;
        SensorNode* current = head;
        while (current != nullptr) {
            if (current->data.isValid())
                count++;
            current = current->next;
        }
        return count;
    }
};

#endif // SENSOR_LINKED_LIST_H
