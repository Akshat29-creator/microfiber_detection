// ============================================================
//  SensorLinkedList.h (Arduino/ESP32 Version)
//  SINGLY LINKED LIST: Stores sensor readings
//  DSA Concepts: Singly Linked List, Pointers, Dynamic Memory
// ============================================================
#ifndef SENSOR_LINKED_LIST_H
#define SENSOR_LINKED_LIST_H

#include "SensorReading.h"

// ---- Node for Singly Linked List ----
struct SensorNode {
    SensorReading data;
    SensorNode* next;       // POINTER to next node
    SensorNode(SensorReading reading) : data(reading), next(nullptr) {}
};

// ---- Class: SensorLinkedList (Singly Linked List) ----
class SensorLinkedList {
private:
    SensorNode* head;
    SensorNode* tail;
    int size;

public:
    SensorLinkedList() : head(nullptr), tail(nullptr), size(0) {}

    ~SensorLinkedList() {
        SensorNode* current = head;
        while (current != nullptr) {
            SensorNode* temp = current;
            current = current->next;
            delete temp;
        }
    }

    // ---- Append — O(1) ----
    void append(SensorReading reading) {
        SensorNode* newNode = new SensorNode(reading);
        if (head == nullptr) {
            head = newNode;
            tail = newNode;
        } else {
            tail->next = newNode;
            tail = newNode;
        }
        size++;
    }

    // ---- Insert at Beginning — O(1) ----
    void insertAtBeginning(SensorReading reading) {
        SensorNode* newNode = new SensorNode(reading);
        newNode->next = head;
        head = newNode;
        if (tail == nullptr) tail = newNode;
        size++;
    }

    // ---- Insert at Position — O(n) ----
    void insertAtPosition(SensorReading reading, int position) {
        if (position <= 0) { insertAtBeginning(reading); return; }
        if (position >= size) { append(reading); return; }

        SensorNode* newNode = new SensorNode(reading);
        SensorNode* current = head;
        for (int i = 0; i < position - 1; i++) current = current->next;
        newNode->next = current->next;
        current->next = newNode;
        size++;
    }

    // ---- Delete from Beginning — O(1) ----
    bool deleteFromBeginning() {
        if (head == nullptr) return false;
        SensorNode* temp = head;
        head = head->next;
        delete temp;
        size--;
        if (head == nullptr) tail = nullptr;
        return true;
    }

    // ---- Delete from End — O(n) ----
    bool deleteFromEnd() {
        if (head == nullptr) return false;
        if (head == tail) {
            delete head;
            head = nullptr; tail = nullptr;
            size--;
            return true;
        }
        SensorNode* current = head;
        while (current->next != tail) current = current->next;
        delete tail;
        tail = current;
        tail->next = nullptr;
        size--;
        return true;
    }

    // ---- Delete by Timestamp — O(n) ----
    bool deleteByTimestamp(float timestamp) {
        if (head == nullptr) return false;
        if (head->data.getTimestamp() == timestamp) return deleteFromBeginning();

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

    // ---- Display All — O(n) ----
    void displayAll() const {
        if (head == nullptr) {
            Serial.println("  [Sensor Log is empty]");
            return;
        }
        Serial.println("\n  ====== SENSOR LOG (Singly Linked List) ======");
        Serial.print("  Total Readings: "); Serial.println(size);
        Serial.println("  -------------------------------------------");

        SensorNode* current = head;
        int count = 1;
        while (current != nullptr) {
            Serial.print("  "); Serial.print(count); Serial.print(". ");
            current->data.display();
            current = current->next;
            count++;
        }
        Serial.println("  ============================================\n");
    }

    int getSize() const { return size; }
    bool isEmpty() const { return head == nullptr; }
    SensorNode* getHead() const { return head; }

    // ---- Convert to Array (for sorting) ----
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

    int countByType(const String& type) const {
        int count = 0;
        SensorNode* current = head;
        while (current != nullptr) {
            if (current->data.getSensorType() == type) count++;
            current = current->next;
        }
        return count;
    }

    int countValid() const {
        int count = 0;
        SensorNode* current = head;
        while (current != nullptr) {
            if (current->data.isValid()) count++;
            current = current->next;
        }
        return count;
    }
};

#endif
