// ============================================================
//  EventDoublyList.h
//  DOUBLY LINKED LIST: Stores microplastic detection events
//  DSA Concepts: Doubly Linked List, Pointers, Dynamic Memory
// ============================================================
#ifndef EVENT_DOUBLY_LIST_H
#define EVENT_DOUBLY_LIST_H

#include "MicroplasticEvent.h"

// ---- Node for Doubly Linked List ----
// Has BOTH next and prev pointers (key difference from singly LL)
struct EventNode {
    MicroplasticEvent data;     // The detection event
    EventNode* next;            // POINTER to next event
    EventNode* prev;            // POINTER to previous event (doubly linked!)

    EventNode(MicroplasticEvent event)
        : data(event), next(nullptr), prev(nullptr) {}
};

// ---- Class: EventDoublyList (Doubly Linked List) ----
// Stores confirmed microplastic detections
// Supports forward AND backward traversal (reviewing event history)
class EventDoublyList {
private:
    EventNode* head;    // POINTER to first event
    EventNode* tail;    // POINTER to last event
    int size;

public:
    // Constructor
    EventDoublyList() : head(nullptr), tail(nullptr), size(0) {}

    // Destructor
    ~EventDoublyList() {
        EventNode* current = head;
        while (current != nullptr) {
            EventNode* temp = current;
            current = current->next;
            delete temp;
        }
        head = nullptr;
        tail = nullptr;
        size = 0;
    }

    // ---- Insert at End — O(1) ----
    // New detection events are appended chronologically
    void append(MicroplasticEvent event) {
        EventNode* newNode = new EventNode(event);

        if (head == nullptr) {
            head = newNode;
            tail = newNode;
        } else {
            newNode->prev = tail;       // Link back to current tail
            tail->next = newNode;       // Link current tail forward
            tail = newNode;             // Update tail pointer
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
            head->prev = newNode;       // Doubly linked: update prev
            head = newNode;
        }
        size++;
    }

    // ---- Delete by Event ID — O(n) ----
    // Used when marking a detection as false-positive and removing it
    bool deleteByID(int eventID) {
        EventNode* current = head;

        while (current != nullptr) {
            if (current->data.getEventID() == eventID) {
                // Relink neighbors using prev/next pointers
                if (current->prev != nullptr)
                    current->prev->next = current->next;
                else
                    head = current->next;   // Deleting head

                if (current->next != nullptr)
                    current->next->prev = current->prev;
                else
                    tail = current->prev;   // Deleting tail

                delete current;
                size--;
                return true;
            }
            current = current->next;
        }
        return false;   // Event not found
    }

    // ---- Forward Traversal (Head → Tail) — O(n) ----
    // Displays events in chronological order
    void displayForward() const {
        if (head == nullptr) {
            cout << "  [No detection events recorded]" << endl;
            return;
        }

        cout << "\n  ====== DETECTION EVENTS (Doubly Linked List — Forward) ======" << endl;
        cout << "  Total Events: " << size << endl;
        cout << "  ------------------------------------------------------------" << endl;

        EventNode* current = head;
        while (current != nullptr) {
            current->data.display();
            current = current->next;    // Forward traversal
        }
        cout << "  ============================================================\n" << endl;
    }

    // ---- Reverse Traversal (Tail → Head) — O(n) ----
    // Displays most recent events first (reverse chronological)
    void displayReverse() const {
        if (tail == nullptr) {
            cout << "  [No detection events recorded]" << endl;
            return;
        }

        cout << "\n  ====== DETECTION EVENTS (Doubly Linked List — Reverse) ======" << endl;
        cout << "  Total Events: " << size << " (Most recent first)" << endl;
        cout << "  -------------------------------------------------------------" << endl;

        EventNode* current = tail;      // Start at TAIL
        while (current != nullptr) {
            current->data.display();
            current = current->prev;    // Backward traversal using prev pointer
        }
        cout << "  =============================================================\n" << endl;
    }

    // ---- Count by Severity — O(n) ----
    int countBySeverity(const string& severity) const {
        int count = 0;
        EventNode* current = head;
        while (current != nullptr) {
            if (current->data.getSeverity() == severity)
                count++;
            current = current->next;
        }
        return count;
    }

    // ---- Get Statistics ----
    void displayStatistics() const {
        cout << "\n  ====== EVENT STATISTICS ======" << endl;
        cout << "  Total Detections : " << size << endl;
        cout << "  HIGH Severity    : " << countBySeverity("HIGH") << endl;
        cout << "  MEDIUM Severity  : " << countBySeverity("MEDIUM") << endl;
        cout << "  LOW Severity     : " << countBySeverity("LOW") << endl;

        if (size > 0) {
            // Calculate average confidence
            double totalConf = 0;
            EventNode* current = head;
            while (current != nullptr) {
                totalConf += current->data.confidence();
                current = current->next;
            }
            cout << fixed << setprecision(2);
            cout << "  Avg Confidence   : " << (totalConf / size) << "%" << endl;
        }
        cout << "  ==============================\n" << endl;
    }

    // ---- Getters ----
    int getSize() const { return size; }
    bool isEmpty() const { return head == nullptr; }
    EventNode* getHead() const { return head; }
    EventNode* getTail() const { return tail; }
};

#endif // EVENT_DOUBLY_LIST_H
