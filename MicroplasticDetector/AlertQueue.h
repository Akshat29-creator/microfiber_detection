// ============================================================
//  AlertQueue.h
//  QUEUE (FIFO): Processes system alerts in arrival order
//  DSA Concepts: Queue, Linked List-based Queue, Pointers
// ============================================================
#ifndef ALERT_QUEUE_H
#define ALERT_QUEUE_H

#include <iostream>
#include <string>
#include <iomanip>

using namespace std;

// ---- Alert structure ----
struct Alert {
    string type;        // "ERROR", "WARNING", "INFO", "CRITICAL"
    string message;     // Alert description
    double timestamp;   // When it was generated
    int priority;       // 1=CRITICAL, 2=ERROR, 3=WARNING, 4=INFO

    Alert() : type("INFO"), message(""), timestamp(0), priority(4) {}
    Alert(string t, string msg, double ts, int p)
        : type(t), message(msg), timestamp(ts), priority(p) {}

    void display() const {
        cout << fixed << setprecision(2);
        cout << "  [" << setw(7) << timestamp << "s] "
             << setw(8) << type << " : " << message << endl;
    }
};

// ---- Queue Node ----
struct QueueNode {
    Alert data;
    QueueNode* next;

    QueueNode(Alert alert) : data(alert), next(nullptr) {}
};

// ---- Class: AlertQueue (FIFO Queue using Linked List) ----
// Alerts are processed in the order they arrive (First-In-First-Out)
class AlertQueue {
private:
    QueueNode* front;       // POINTER to front of queue (dequeue from here)
    QueueNode* rear;        // POINTER to rear of queue (enqueue here)
    int size;

public:
    // Constructor
    AlertQueue() : front(nullptr), rear(nullptr), size(0) {}

    // Destructor
    ~AlertQueue() {
        while (!isEmpty()) {
            dequeue();
        }
    }

    // ---- Enqueue — O(1) ----
    // Add alert to the rear of the queue
    void enqueue(Alert alert) {
        QueueNode* newNode = new QueueNode(alert);

        if (rear == nullptr) {
            front = newNode;
            rear = newNode;
        } else {
            rear->next = newNode;
            rear = newNode;
        }
        size++;
    }

    // ---- Enqueue by Priority — O(n) ----
    // CRITICAL alerts jump ahead of WARNING/INFO alerts (Priority Queue behavior)
    void enqueuePriority(Alert alert) {
        QueueNode* newNode = new QueueNode(alert);

        // If empty or higher priority than front
        if (front == nullptr || alert.priority < front->data.priority) {
            newNode->next = front;
            front = newNode;
            if (rear == nullptr) rear = newNode;
            size++;
            return;
        }

        // Find correct position based on priority
        QueueNode* current = front;
        while (current->next != nullptr &&
               current->next->data.priority <= alert.priority) {
            current = current->next;
        }

        newNode->next = current->next;
        current->next = newNode;
        if (newNode->next == nullptr) rear = newNode;
        size++;
    }

    // ---- Dequeue — O(1) ----
    // Remove and return alert from the front
    Alert dequeue() {
        if (front == nullptr) {
            cout << "  [Alert Queue is empty!]" << endl;
            return Alert();
        }

        QueueNode* temp = front;
        Alert alert = temp->data;
        front = front->next;

        if (front == nullptr) rear = nullptr;

        delete temp;
        size--;
        return alert;
    }

    // ---- Peek — O(1) ----
    // View front alert without removing it
    Alert peek() const {
        if (front == nullptr) {
            return Alert();
        }
        return front->data;
    }

    // ---- Process All Alerts ----
    // Dequeues and displays each alert in order
    void processAll() {
        if (isEmpty()) {
            cout << "  [No alerts to process]" << endl;
            return;
        }

        cout << "\n  ====== PROCESSING ALERT QUEUE ======" << endl;
        cout << "  Alerts in queue: " << size << endl;
        cout << "  ------------------------------------" << endl;

        int count = 1;
        while (!isEmpty()) {
            cout << "  Processing Alert #" << count++ << ": ";
            Alert a = dequeue();
            a.display();
        }
        cout << "  ------------------------------------" << endl;
        cout << "  All alerts processed." << endl;
        cout << "  ====================================\n" << endl;
    }

    // ---- Display Queue without removing ----
    void display() const {
        if (front == nullptr) {
            cout << "  [Alert Queue is empty]" << endl;
            return;
        }

        cout << "\n  ====== ALERT QUEUE (FIFO) ======" << endl;
        cout << "  Pending Alerts: " << size << endl;
        cout << "  --------------------------------" << endl;

        QueueNode* current = front;
        int count = 1;
        while (current != nullptr) {
            cout << "  " << count++ << ". ";
            current->data.display();
            current = current->next;
        }
        cout << "  ================================\n" << endl;
    }

    // ---- Getters ----
    int getSize() const { return size; }
    bool isEmpty() const { return front == nullptr; }
};

#endif // ALERT_QUEUE_H
