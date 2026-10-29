// ============================================================
//  AlertQueue.h (Arduino/ESP32 Version)
//  QUEUE (FIFO): Processes system alerts
//  DSA Concepts: Queue, Priority Queue, Pointers
// ============================================================
#ifndef ALERT_QUEUE_H
#define ALERT_QUEUE_H

#include <Arduino.h>

struct Alert {
    String type;
    String message;
    float timestamp;
    int priority;       // 1=CRITICAL, 2=ERROR, 3=WARNING, 4=INFO

    Alert() : type("INFO"), message(""), timestamp(0), priority(4) {}
    Alert(String t, String msg, float ts, int p) : type(t), message(msg), timestamp(ts), priority(p) {}

    void display() const {
        Serial.print("  [");
        Serial.print(timestamp, 2);
        Serial.print("s] ");
        Serial.print(type);
        Serial.print(": ");
        Serial.println(message);
    }
};

struct QueueNode {
    Alert data;
    QueueNode* next;
    QueueNode(Alert alert) : data(alert), next(nullptr) {}
};

// ---- Class: AlertQueue ----
class AlertQueue {
private:
    QueueNode* front;
    QueueNode* rear;
    int size;

public:
    AlertQueue() : front(nullptr), rear(nullptr), size(0) {}

    ~AlertQueue() { while (!isEmpty()) dequeue(); }

    // ---- Enqueue — O(1) ----
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

    // ---- Priority Enqueue — O(n) ----
    void enqueuePriority(Alert alert) {
        QueueNode* newNode = new QueueNode(alert);
        if (front == nullptr || alert.priority < front->data.priority) {
            newNode->next = front;
            front = newNode;
            if (rear == nullptr) rear = newNode;
            size++;
            return;
        }
        QueueNode* current = front;
        while (current->next != nullptr && current->next->data.priority <= alert.priority)
            current = current->next;
        newNode->next = current->next;
        current->next = newNode;
        if (newNode->next == nullptr) rear = newNode;
        size++;
    }

    // ---- Dequeue — O(1) ----
    Alert dequeue() {
        if (front == nullptr) return Alert();
        QueueNode* temp = front;
        Alert alert = temp->data;
        front = front->next;
        if (front == nullptr) rear = nullptr;
        delete temp;
        size--;
        return alert;
    }

    Alert peek() const {
        if (front == nullptr) return Alert();
        return front->data;
    }

    // ---- Process All ----
    void processAll() {
        if (isEmpty()) {
            Serial.println("  [No alerts to process]");
            return;
        }
        Serial.println("\n  ====== PROCESSING ALERTS ======");
        int count = 1;
        while (!isEmpty()) {
            Serial.print("  #"); Serial.print(count++); Serial.print(": ");
            Alert a = dequeue();
            a.display();
        }
        Serial.println("  All alerts processed.");
        Serial.println("  ==============================\n");
    }

    void display() const {
        if (front == nullptr) {
            Serial.println("  [Alert Queue empty]");
            return;
        }
        Serial.println("\n  ====== ALERT QUEUE (FIFO) ======");
        Serial.print("  Pending: "); Serial.println(size);
        QueueNode* current = front;
        int count = 1;
        while (current != nullptr) {
            Serial.print("  "); Serial.print(count++); Serial.print(". ");
            current->data.display();
            current = current->next;
        }
        Serial.println("  ================================\n");
    }

    int getSize() const { return size; }
    bool isEmpty() const { return front == nullptr; }
};

#endif
