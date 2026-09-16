// ============================================================
//  EventDoublyList.h (Arduino/ESP32 Version)
//  DOUBLY LINKED LIST: Detection event history
//  DSA Concepts: Doubly Linked List, Pointers
// ============================================================
#ifndef EVENT_DOUBLY_LIST_H
#define EVENT_DOUBLY_LIST_H

#include "MicroplasticEvent.h"

// ---- Node for Doubly Linked List ----
struct EventNode {
    MicroplasticEvent data;
    EventNode* next;
    EventNode* prev;        // EXTRA pointer for backward traversal
    EventNode(MicroplasticEvent event) : data(event), next(nullptr), prev(nullptr) {}
};

// ---- Class: EventDoublyList ----
class EventDoublyList {
private:
    EventNode* head;
    EventNode* tail;
    int size;

public:
    EventDoublyList() : head(nullptr), tail(nullptr), size(0) {}

    ~EventDoublyList() {
        EventNode* current = head;
        while (current != nullptr) {
            EventNode* temp = current;
            current = current->next;
            delete temp;
        }
    }

    // ---- Append — O(1) ----
    void append(MicroplasticEvent event) {
        EventNode* newNode = new EventNode(event);
        if (head == nullptr) {
            head = newNode;
            tail = newNode;
        } else {
            newNode->prev = tail;
            tail->next = newNode;
            tail = newNode;
        }
        size++;
    }

    // ---- Insert at Beginning — O(1) ----
    void insertAtBeginning(MicroplasticEvent event) {
        EventNode* newNode = new EventNode(event);
        if (head == nullptr) {
            head = newNode;
            tail = newNode;
        } else {
            newNode->next = head;
            head->prev = newNode;
            head = newNode;
        }
        size++;
    }

    // ---- Delete by Event ID — O(n) ----
    bool deleteByID(int eventID) {
        EventNode* current = head;
        while (current != nullptr) {
            if (current->data.getEventID() == eventID) {
                if (current->prev != nullptr)
                    current->prev->next = current->next;
                else
                    head = current->next;

                if (current->next != nullptr)
                    current->next->prev = current->prev;
                else
                    tail = current->prev;

                delete current;
                size--;
                return true;
            }
            current = current->next;
        }
        return false;
    }

    // ---- Forward Traversal (Head → Tail) ----
    void displayForward() const {
        if (head == nullptr) {
            Serial.println("  [No detection events]");
            return;
        }
        Serial.println("\n  ====== EVENTS (Doubly LL — Forward) ======");
        Serial.print("  Total: "); Serial.println(size);
        Serial.println("  ------------------------------------------");
        EventNode* current = head;
        while (current != nullptr) {
            current->data.display();
            current = current->next;
        }
        Serial.println("  ==========================================\n");
    }

    // ---- Reverse Traversal (Tail → Head) ----
    void displayReverse() const {
        if (tail == nullptr) {
            Serial.println("  [No detection events]");
            return;
        }
        Serial.println("\n  ====== EVENTS (Doubly LL — Reverse) ======");
        Serial.print("  Total: "); Serial.print(size);
        Serial.println(" (Most recent first)");
        Serial.println("  ------------------------------------------");
        EventNode* current = tail;
        while (current != nullptr) {
            current->data.display();
            current = current->prev;    // Backward!
        }
        Serial.println("  ==========================================\n");
    }

    // ---- Statistics ----
    void displayStatistics() const {
        int high = 0, med = 0, low = 0;
        float totalConf = 0;
        EventNode* current = head;
        while (current != nullptr) {
            if (current->data.getSeverity() == "HIGH") high++;
            else if (current->data.getSeverity() == "MEDIUM") med++;
            else low++;
            totalConf += current->data.confidence();
            current = current->next;
        }
        Serial.println("\n  ====== EVENT STATISTICS ======");
        Serial.print("  Total: "); Serial.println(size);
        Serial.print("  HIGH: "); Serial.println(high);
        Serial.print("  MEDIUM: "); Serial.println(med);
        Serial.print("  LOW: "); Serial.println(low);
        if (size > 0) {
            Serial.print("  Avg Confidence: ");
            Serial.print(totalConf / size, 1);
            Serial.println("%");
        }
        Serial.println("  ==============================\n");
    }

    int getSize() const { return size; }
    bool isEmpty() const { return head == nullptr; }
};

#endif
