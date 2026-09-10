// ============================================================
//  main.cpp
//  ENTRY POINT: Menu-driven Microplastic Detection System
//  
//  DSA Concepts Demonstrated:
//    [MANDATORY] 1. Classes & Objects (7+ classes)
//    [MANDATORY] 2. Pointers (throughout linked lists, BST, dynamic alloc)
//    [MANDATORY] 3. Linked Lists (Singly, Doubly, Circular)
//    [EXTRA]     4. Sorting (Bubble, Selection, Insertion, Merge, Quick)
//    [EXTRA]     5. Searching (Linear, Binary)
//    [EXTRA]     6. Stack (Calibration Undo/Redo)
//    [EXTRA]     7. Queue (Alert Processing, Priority Queue)
//    [EXTRA]     8. Binary Search Tree (Timestamp Indexing)
//
//  Project: Low-Cost Optical Attenuation System for
//           Real-Time Microplastic Detection
//  College: MIT Manipal | B.Tech CPS | 3rd Semester
// ============================================================

#include <iostream>
#include <iomanip>
#include <cstdlib>
#include <ctime>
#ifdef _WIN32
#include <windows.h>
#endif

// ---- Include all project headers ----
#include "SensorReading.h"
#include "MicroplasticEvent.h"
#include "SensorLinkedList.h"
#include "EventDoublyList.h"
#include "CircularBuffer.h"
#include "AlertQueue.h"
#include "CalibrationStack.h"
#include "DetectionBST.h"
#include "SortingAlgorithms.h"
#include "SearchAlgorithms.h"
#include "TurbiditySensor.h"
#include "TemperatureSensor.h"
#include "LaserChamber.h"
#include "PumpController.h"
#include "Dashboard.h"

using namespace std;

// ---- Global System Objects ----
SensorLinkedList     sensorLog;          // Singly linked list
EventDoublyList      eventHistory;       // Doubly linked list
CircularBuffer       slidingWindow(10);  // Circular linked list (window = 10)
AlertQueue           alertQueue;         // Queue
CalibrationStack     calibrationStack;   // Stack
DetectionBST         detectionTree;      // Binary Search Tree
TurbiditySensor      turbiditySensor;    // Class
TemperatureSensor    tempSensor;         // Class
LaserChamber         laserChamber;       // Class
PumpController       pumpController;     // Class
Dashboard            dashboard;          // Class

double simulationTime = 0.0;            // Simulated timestamp counter

// ============================================================
//  MENU DISPLAY FUNCTIONS
// ============================================================

void displayMainMenu() {
    cout << "\n  +======================================================+" << endl;
    cout << "  |     MICROPLASTIC DETECTION SYSTEM — MAIN MENU        |" << endl;
    cout << "  |     DSA Project | MIT Manipal | 3rd Semester         |" << endl;
    cout << "  +======================================================+" << endl;
    cout << "  |                                                      |" << endl;
    cout << "  |   1.  Run Full Detection Simulation                  |" << endl;
    cout << "  |   2.  Sensor Log (Singly Linked List)                |" << endl;
    cout << "  |   3.  Event History (Doubly Linked List)             |" << endl;
    cout << "  |   4.  Sliding Window (Circular Linked List)          |" << endl;
    cout << "  |   5.  Sorting Algorithms                             |" << endl;
    cout << "  |   6.  Searching Algorithms                           |" << endl;
    cout << "  |   7.  Calibration Stack (Undo/Redo)                  |" << endl;
    cout << "  |   8.  Alert Queue                                    |" << endl;
    cout << "  |   9.  Detection BST (Tree Operations)                |" << endl;
    cout << "  |  10.  System Dashboard                               |" << endl;
    cout << "  |  11.  View All System Status                         |" << endl;
    cout << "  |   0.  Exit                                           |" << endl;
    cout << "  |                                                      |" << endl;
    cout << "  +======================================================+" << endl;
    cout << "\n  Enter choice: ";
}

// ============================================================
//  1. FULL DETECTION SIMULATION
//  Runs the complete pipeline: Boot → Calibrate → Pump →
//  Filter → Turbidity Check → Optical Detection → Dashboard
// ============================================================
void runFullSimulation() {
    int numReadings;
    cout << "\n  ====== FULL DETECTION SIMULATION ======" << endl;
    cout << "  How many water samples to process? (5-50): ";
    cin >> numReadings;
    if (numReadings < 5) numReadings = 5;
    if (numReadings > 50) numReadings = 50;

    // --- Phase 1: System Boot & Baseline Calibration ---
    cout << "\n  --- Phase 1: System Boot & Calibration ---" << endl;
    dashboard.connect();

    double waterTemp = tempSensor.readTemp();
    tempSensor.displayStatus();

    double rawBaseline = 3.0;
    double correctedBaseline = tempSensor.correctBaseline(rawBaseline);
    laserChamber.calibrate(correctedBaseline);

    // Save initial calibration to stack
    calibrationStack.push(CalibrationState(
        correctedBaseline, turbiditySensor.getThreshold(),
        tempSensor.getCorrectionFactor(), simulationTime,
        "Initial calibration"
    ));

    // --- Phase 2: Activate Pump ---
    cout << "\n  --- Phase 2: Pump Activation ---" << endl;
    pumpController.start();
    laserChamber.laserActivate();

    // --- Phase 3-5: Process Samples ---
    cout << "\n  --- Phase 3-5: Processing " << numReadings << " Samples ---" << endl;
    int detectedCount = 0;

    for (int i = 0; i < numReadings; i++) {
        simulationTime += 0.5;  // 0.5 second intervals

        // Step 1: Turbidity failsafe check
        bool waterClear = turbiditySensor.validateSample();

        if (!waterClear) {
            // Muddy water — REJECT sample
            SensorReading turbReading(simulationTime, turbiditySensor.getVoltage(), "TURBIDITY");
            turbReading.setValid(false);
            sensorLog.append(turbReading);

            // Generate alert and add to queue
            Alert turbAlert("ERROR", "Turbidity too high — sample rejected",
                           simulationTime, 2);
            alertQueue.enqueuePriority(turbAlert);

            pumpController.emergencyShutoff("High turbidity detected");
            dashboard.logAlert("TURBIDITY", "Sample #" + to_string(i + 1) + " rejected");

            // Restart pump after rejection
            pumpController.reset();
            pumpController.start();
            continue;
        }

        // Step 2: Water is clear — take laser reading
        SensorReading reading = laserChamber.takeReading(simulationTime);
        reading.setValid(true);

        // Add to singly linked list (sensor log)
        sensorLog.append(reading);

        // Add to circular buffer (sliding window)
        slidingWindow.insert(reading);

        // Step 3: Analyze for microplastic detection
        MicroplasticEvent* event = laserChamber.analyzeReading(reading, waterTemp);

        if (event != nullptr) {
            // Microplastic detected!
            detectedCount++;

            // Add to doubly linked list (event history)
            eventHistory.append(*event);

            // Add to BST (timestamp index)
            detectionTree.insert(*event);

            // Generate alert
            Alert detAlert("INFO", "Microplastic detected! Drop: " +
                          to_string(event->getVoltageDrop()).substr(0, 4) + "V",
                          simulationTime, 4);
            alertQueue.enqueue(detAlert);

            cout << "  [Sample " << setw(2) << (i + 1) << "] ";
            cout << "** DETECTION ** Voltage drop: " << fixed << setprecision(2)
                 << event->getVoltageDrop() << "V | Severity: "
                 << event->getSeverity() << endl;

            delete event;   // Free dynamically allocated memory (pointer cleanup!)
        } else {
            cout << "  [Sample " << setw(2) << (i + 1) << "] ";
            cout << "Clear — no particle. Voltage: " << fixed << setprecision(2)
                 << reading.getVoltage() << "V" << endl;
        }

        // Update dashboard
        dashboard.updateSensors(reading.getVoltage(), waterTemp, turbiditySensor.getVoltage());
        dashboard.updateDetection(detectedCount);
    }

    // --- Phase 6: Shutdown ---
    cout << "\n  --- Phase 6: Shutdown ---" << endl;
    pumpController.stop();
    laserChamber.laserDeactivate();

    dashboard.setStatus("SCAN COMPLETE");
    dashboard.displayDashboard();

    cout << "\n  ====== SIMULATION COMPLETE ======" << endl;
    cout << "  Total Samples   : " << numReadings << endl;
    cout << "  Detections      : " << detectedCount << endl;
    cout << "  Rejected (Muddy): " << turbiditySensor.getRejectedCount() << endl;
    cout << "  ==================================\n" << endl;
}

// ============================================================
//  2. SENSOR LOG MENU (Singly Linked List)
// ============================================================
void sensorLogMenu() {
    int choice;
    do {
        cout << "\n  === SENSOR LOG (Singly Linked List) ===" << endl;
        cout << "  1. Display all readings" << endl;
        cout << "  2. Add a manual reading" << endl;
        cout << "  3. Add at beginning" << endl;
        cout << "  4. Add at position" << endl;
        cout << "  5. Delete from beginning" << endl;
        cout << "  6. Delete from end" << endl;
        cout << "  7. Delete by timestamp" << endl;
        cout << "  8. Count by sensor type" << endl;
        cout << "  9. Show size & valid count" << endl;
        cout << "  0. Back to main menu" << endl;
        cout << "  Choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                sensorLog.displayAll();
                break;

            case 2: {
                double ts, v;
                string type;
                cout << "  Enter timestamp (seconds): ";
                cin >> ts;
                cout << "  Enter voltage (0-5V): ";
                cin >> v;
                cout << "  Enter type (PHOTODIODE/TURBIDITY/TEMPERATURE): ";
                cin >> type;
                sensorLog.append(SensorReading(ts, v, type));
                cout << "  Reading added to end of log." << endl;
                break;
            }

            case 3: {
                double ts, v;
                cout << "  Enter timestamp: "; cin >> ts;
                cout << "  Enter voltage: "; cin >> v;
                sensorLog.insertAtBeginning(SensorReading(ts, v, "PHOTODIODE"));
                cout << "  Reading added at beginning." << endl;
                break;
            }

            case 4: {
                double ts, v;
                int pos;
                cout << "  Enter timestamp: "; cin >> ts;
                cout << "  Enter voltage: "; cin >> v;
                cout << "  Enter position (0-indexed): "; cin >> pos;
                sensorLog.insertAtPosition(SensorReading(ts, v, "PHOTODIODE"), pos);
                cout << "  Reading inserted at position " << pos << "." << endl;
                break;
            }

            case 5:
                if (sensorLog.deleteFromBeginning())
                    cout << "  First reading deleted." << endl;
                else
                    cout << "  Log is empty!" << endl;
                break;

            case 6:
                if (sensorLog.deleteFromEnd())
                    cout << "  Last reading deleted." << endl;
                else
                    cout << "  Log is empty!" << endl;
                break;

            case 7: {
                double ts;
                cout << "  Enter timestamp to delete: "; cin >> ts;
                if (sensorLog.deleteByTimestamp(ts))
                    cout << "  Reading deleted." << endl;
                else
                    cout << "  Timestamp not found!" << endl;
                break;
            }

            case 8: {
                cout << "  PHOTODIODE  : " << sensorLog.countByType("PHOTODIODE") << endl;
                cout << "  TURBIDITY   : " << sensorLog.countByType("TURBIDITY") << endl;
                cout << "  TEMPERATURE : " << sensorLog.countByType("TEMPERATURE") << endl;
                break;
            }

            case 9:
                cout << "  Total readings: " << sensorLog.getSize() << endl;
                cout << "  Valid readings: " << sensorLog.countValid() << endl;
                break;
        }
    } while (choice != 0);
}

// ============================================================
//  3. EVENT HISTORY MENU (Doubly Linked List)
// ============================================================
void eventHistoryMenu() {
    int choice;
    do {
        cout << "\n  === EVENT HISTORY (Doubly Linked List) ===" << endl;
        cout << "  1. Display forward (chronological)" << endl;
        cout << "  2. Display reverse (most recent first)" << endl;
        cout << "  3. Add manual event" << endl;
        cout << "  4. Delete event by ID" << endl;
        cout << "  5. Show statistics" << endl;
        cout << "  6. Show size" << endl;
        cout << "  0. Back to main menu" << endl;
        cout << "  Choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                eventHistory.displayForward();
                break;

            case 2:
                eventHistory.displayReverse();
                break;

            case 3: {
                double ts, drop, base, dur, temp;
                cout << "  Enter timestamp (s): "; cin >> ts;
                cout << "  Enter voltage drop (V): "; cin >> drop;
                cout << "  Enter baseline voltage (V): "; cin >> base;
                cout << "  Enter duration (ms): "; cin >> dur;
                cout << "  Enter water temperature (C): "; cin >> temp;
                MicroplasticEvent e(ts, drop, base, dur, temp);
                eventHistory.append(e);
                detectionTree.insert(e);
                cout << "  Event added." << endl;
                break;
            }

            case 4: {
                int id;
                cout << "  Enter Event ID to delete: "; cin >> id;
                if (eventHistory.deleteByID(id))
                    cout << "  Event #" << id << " deleted (marked as false positive)." << endl;
                else
                    cout << "  Event ID not found!" << endl;
                break;
            }

            case 5:
                eventHistory.displayStatistics();
                break;

            case 6:
                cout << "  Total events: " << eventHistory.getSize() << endl;
                break;
        }
    } while (choice != 0);
}

// ============================================================
//  4. SLIDING WINDOW MENU (Circular Linked List)
// ============================================================
void slidingWindowMenu() {
    int choice;
    do {
        cout << "\n  === SLIDING WINDOW (Circular Linked List) ===" << endl;
        cout << "  1. Display current window" << endl;
        cout << "  2. Add a reading to window" << endl;
        cout << "  3. Show moving average" << endl;
        cout << "  4. Show min/max voltage" << endl;
        cout << "  5. Fill with sample data" << endl;
        cout << "  0. Back to main menu" << endl;
        cout << "  Choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                slidingWindow.display();
                break;

            case 2: {
                double ts, v;
                cout << "  Enter timestamp: "; cin >> ts;
                cout << "  Enter voltage: "; cin >> v;
                slidingWindow.insert(SensorReading(ts, v, "PHOTODIODE"));
                cout << "  Reading added to circular buffer." << endl;
                if (slidingWindow.isFull())
                    cout << "  (Buffer is full — oldest reading was overwritten)" << endl;
                break;
            }

            case 3:
                cout << fixed << setprecision(2);
                cout << "  Moving Average: " << slidingWindow.getMovingAverage() << " V" << endl;
                break;

            case 4:
                cout << fixed << setprecision(2);
                cout << "  Min Voltage: " << slidingWindow.getMinVoltage() << " V" << endl;
                cout << "  Max Voltage: " << slidingWindow.getMaxVoltage() << " V" << endl;
                break;

            case 5: {
                cout << "  Filling window with 15 sample readings..." << endl;
                for (int i = 0; i < 15; i++) {
                    double ts = i * 0.5;
                    double v = 2.8 + (rand() % 40) / 100.0;  // 2.80 - 3.20V
                    slidingWindow.insert(SensorReading(ts, v, "PHOTODIODE"));
                }
                cout << "  Done! (Window shows last " << slidingWindow.getCapacity()
                     << " readings)" << endl;
                slidingWindow.display();
                break;
            }
        }
    } while (choice != 0);
}

// ============================================================
//  5. SORTING MENU
// ============================================================
void sortingMenu() {
    if (sensorLog.isEmpty()) {
        cout << "\n  [!] Sensor log is empty. Run a simulation first (Option 1)." << endl;
        return;
    }

    int choice;
    do {
        cout << "\n  === SORTING ALGORITHMS ===" << endl;
        cout << "  1. Bubble Sort (by voltage)" << endl;
        cout << "  2. Selection Sort (by voltage)" << endl;
        cout << "  3. Insertion Sort (by voltage)" << endl;
        cout << "  4. Merge Sort (by voltage)" << endl;
        cout << "  5. Quick Sort (by voltage)" << endl;
        cout << "  6. Run ALL and compare" << endl;
        cout << "  0. Back to main menu" << endl;
        cout << "  Choice: ";
        cin >> choice;

        if (choice >= 1 && choice <= 6) {
            int arrSize;
            SensorReading* arr = sensorLog.toArray(arrSize);

            if (arr == nullptr) {
                cout << "  [!] No data to sort." << endl;
                continue;
            }

            cout << "\n  Before sorting:" << endl;
            printReadingArray(arr, arrSize, "UNSORTED");

            switch (choice) {
                case 1: {
                    SensorReading* copy = new SensorReading[arrSize];
                    for (int i = 0; i < arrSize; i++) copy[i] = arr[i];
                    bubbleSort(copy, arrSize);
                    printReadingArray(copy, arrSize, "BUBBLE SORTED");
                    delete[] copy;
                    break;
                }
                case 2: {
                    SensorReading* copy = new SensorReading[arrSize];
                    for (int i = 0; i < arrSize; i++) copy[i] = arr[i];
                    selectionSort(copy, arrSize);
                    printReadingArray(copy, arrSize, "SELECTION SORTED");
                    delete[] copy;
                    break;
                }
                case 3: {
                    SensorReading* copy = new SensorReading[arrSize];
                    for (int i = 0; i < arrSize; i++) copy[i] = arr[i];
                    insertionSort(copy, arrSize);
                    printReadingArray(copy, arrSize, "INSERTION SORTED");
                    delete[] copy;
                    break;
                }
                case 4: {
                    SensorReading* copy = new SensorReading[arrSize];
                    for (int i = 0; i < arrSize; i++) copy[i] = arr[i];
                    mergeSortWrapper(copy, arrSize);
                    printReadingArray(copy, arrSize, "MERGE SORTED");
                    delete[] copy;
                    break;
                }
                case 5: {
                    SensorReading* copy = new SensorReading[arrSize];
                    for (int i = 0; i < arrSize; i++) copy[i] = arr[i];
                    quickSortWrapper(copy, arrSize);
                    printReadingArray(copy, arrSize, "QUICK SORTED");
                    delete[] copy;
                    break;
                }
                case 6: {
                    // Run all 5 sorts on separate copies
                    string names[] = {"BUBBLE", "SELECTION", "INSERTION", "MERGE", "QUICK"};
                    for (int s = 0; s < 5; s++) {
                        SensorReading* copy = new SensorReading[arrSize];
                        for (int i = 0; i < arrSize; i++) copy[i] = arr[i];

                        switch (s) {
                            case 0: bubbleSort(copy, arrSize); break;
                            case 1: selectionSort(copy, arrSize); break;
                            case 2: insertionSort(copy, arrSize); break;
                            case 3: mergeSortWrapper(copy, arrSize); break;
                            case 4: quickSortWrapper(copy, arrSize); break;
                        }
                        printReadingArray(copy, arrSize, names[s] + " SORTED");
                        delete[] copy;
                    }
                    break;
                }
            }

            delete[] arr;
        }
    } while (choice != 0);
}

// ============================================================
//  6. SEARCHING MENU
// ============================================================
void searchingMenu() {
    if (sensorLog.isEmpty()) {
        cout << "\n  [!] Sensor log is empty. Run a simulation first (Option 1)." << endl;
        return;
    }

    int choice;
    do {
        cout << "\n  === SEARCHING ALGORITHMS ===" << endl;
        cout << "  1. Linear Search — find first below threshold" << endl;
        cout << "  2. Linear Search — find ALL below threshold" << endl;
        cout << "  3. Linear Search — by timestamp" << endl;
        cout << "  4. Binary Search — by voltage (sorts first)" << endl;
        cout << "  5. Find Min voltage" << endl;
        cout << "  6. Find Max voltage" << endl;
        cout << "  0. Back to main menu" << endl;
        cout << "  Choice: ";
        cin >> choice;

        if (choice >= 1 && choice <= 6) {
            int arrSize;
            SensorReading* arr = sensorLog.toArray(arrSize);

            if (arr == nullptr) {
                cout << "  [!] No data to search." << endl;
                continue;
            }

            switch (choice) {
                case 1: {
                    double threshold;
                    cout << "  Enter voltage threshold: "; cin >> threshold;
                    linearSearchByVoltage(arr, arrSize, threshold, true);
                    break;
                }
                case 2: {
                    double threshold;
                    cout << "  Enter voltage threshold: "; cin >> threshold;
                    linearSearchAllBreach(arr, arrSize, threshold);
                    break;
                }
                case 3: {
                    double ts;
                    cout << "  Enter timestamp to find: "; cin >> ts;
                    linearSearchByTimestamp(arr, arrSize, ts);
                    break;
                }
                case 4: {
                    double v;
                    cout << "  Enter voltage to search: "; cin >> v;
                    // Must sort first for binary search
                    cout << "  (Sorting array first for binary search...)" << endl;
                    mergeSortWrapper(arr, arrSize);
                    binarySearchByVoltage(arr, arrSize, v);
                    break;
                }
                case 5:
                    findMinVoltage(arr, arrSize);
                    break;
                case 6:
                    findMaxVoltage(arr, arrSize);
                    break;
            }

            delete[] arr;
        }
    } while (choice != 0);
}

// ============================================================
//  7. CALIBRATION STACK MENU
// ============================================================
void calibrationMenu() {
    int choice;
    do {
        cout << "\n  === CALIBRATION STACK (Undo/Redo) ===" << endl;
        cout << "  1. View calibration history (stack)" << endl;
        cout << "  2. Push new calibration" << endl;
        cout << "  3. Undo last calibration" << endl;
        cout << "  4. View current (top) calibration" << endl;
        cout << "  5. Show stack size" << endl;
        cout << "  0. Back to main menu" << endl;
        cout << "  Choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                calibrationStack.display();
                break;

            case 2: {
                double bv, tt, tc;
                string desc;
                cout << "  Enter new baseline voltage (V): "; cin >> bv;
                cout << "  Enter turbidity threshold (V): "; cin >> tt;
                cout << "  Enter temp correction factor: "; cin >> tc;
                cin.ignore();
                cout << "  Enter description: ";
                getline(cin, desc);
                simulationTime += 1.0;
                calibrationStack.push(CalibrationState(bv, tt, tc, simulationTime, desc));
                laserChamber.setBaseline(bv);
                turbiditySensor.setThreshold(tt);
                cout << "  Calibration pushed. Laser baseline updated." << endl;
                break;
            }

            case 3: {
                CalibrationState restored = calibrationStack.undo();
                laserChamber.setBaseline(restored.baselineVoltage);
                turbiditySensor.setThreshold(restored.turbidityThreshold);
                break;
            }

            case 4: {
                CalibrationState top = calibrationStack.peek();
                cout << "  Current calibration:" << endl;
                top.display();
                break;
            }

            case 5:
                cout << "  Stack depth: " << calibrationStack.getSize() << endl;
                break;
        }
    } while (choice != 0);
}

// ============================================================
//  8. ALERT QUEUE MENU
// ============================================================
void alertQueueMenu() {
    int choice;
    do {
        cout << "\n  === ALERT QUEUE ===" << endl;
        cout << "  1. View pending alerts" << endl;
        cout << "  2. Process all alerts (dequeue all)" << endl;
        cout << "  3. Add manual alert" << endl;
        cout << "  4. Add priority alert" << endl;
        cout << "  5. Process next alert (dequeue one)" << endl;
        cout << "  6. Peek front alert" << endl;
        cout << "  0. Back to main menu" << endl;
        cout << "  Choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                alertQueue.display();
                break;

            case 2:
                alertQueue.processAll();
                break;

            case 3: {
                string type, msg;
                cout << "  Enter type (ERROR/WARNING/INFO): "; cin >> type;
                cin.ignore();
                cout << "  Enter message: ";
                getline(cin, msg);
                simulationTime += 0.1;
                alertQueue.enqueue(Alert(type, msg, simulationTime, 4));
                cout << "  Alert added to queue." << endl;
                break;
            }

            case 4: {
                string msg;
                cin.ignore();
                cout << "  Enter critical alert message: ";
                getline(cin, msg);
                simulationTime += 0.1;
                alertQueue.enqueuePriority(Alert("CRITICAL", msg, simulationTime, 1));
                cout << "  Priority alert added (jumped to front)." << endl;
                break;
            }

            case 5: {
                Alert a = alertQueue.dequeue();
                if (a.timestamp > 0) {
                    cout << "  Processed: ";
                    a.display();
                }
                break;
            }

            case 6: {
                Alert a = alertQueue.peek();
                if (a.timestamp > 0) {
                    cout << "  Front of queue: ";
                    a.display();
                }
                break;
            }
        }
    } while (choice != 0);
}

// ============================================================
//  9. BST MENU
// ============================================================
void bstMenu() {
    int choice;
    do {
        cout << "\n  === DETECTION BST (Binary Search Tree) ===" << endl;
        cout << "  1. Inorder traversal (chronological)" << endl;
        cout << "  2. Preorder traversal" << endl;
        cout << "  3. Postorder traversal" << endl;
        cout << "  4. Search by timestamp" << endl;
        cout << "  5. Range search (time range)" << endl;
        cout << "  6. Delete by timestamp" << endl;
        cout << "  7. Tree info (size, height)" << endl;
        cout << "  0. Back to main menu" << endl;
        cout << "  Choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                detectionTree.displayInorder();
                break;
            case 2:
                detectionTree.displayPreorder();
                break;
            case 3:
                detectionTree.displayPostorder();
                break;
            case 4: {
                double ts;
                cout << "  Enter timestamp to search: "; cin >> ts;
                detectionTree.search(ts);
                break;
            }
            case 5: {
                double start, end;
                cout << "  Enter start time (s): "; cin >> start;
                cout << "  Enter end time (s): "; cin >> end;
                detectionTree.rangeSearch(start, end);
                break;
            }
            case 6: {
                double ts;
                cout << "  Enter timestamp to delete: "; cin >> ts;
                detectionTree.deleteEvent(ts);
                cout << "  Event deleted from BST." << endl;
                break;
            }
            case 7:
                cout << "  Total events in BST: " << detectionTree.getSize() << endl;
                cout << "  Tree height: " << detectionTree.getHeight() << endl;
                break;
        }
    } while (choice != 0);
}

// ============================================================
//  10. DASHBOARD
// ============================================================
void showDashboard() {
    dashboard.displayDashboard();

    // Also show a voltage graph if we have data
    if (!sensorLog.isEmpty()) {
        int arrSize;
        SensorReading* arr = sensorLog.toArray(arrSize);
        double* voltages = new double[arrSize];

        for (int i = 0; i < arrSize; i++) {
            voltages[i] = arr[i].getVoltage();
        }

        dashboard.displayVoltageGraph(voltages, arrSize, laserChamber.getBaseline());

        delete[] voltages;
        delete[] arr;
    }
}

// ============================================================
//  11. VIEW ALL SYSTEM STATUS
// ============================================================
void viewAllStatus() {
    cout << "\n  +======================================================+" << endl;
    cout << "  |              COMPLETE SYSTEM STATUS                  |" << endl;
    cout << "  +======================================================+" << endl;

    cout << "\n  ----- Hardware Components -----" << endl;
    pumpController.displayStatus();
    cout << endl;
    turbiditySensor.displayStatus();
    cout << endl;
    tempSensor.displayStatus();
    cout << endl;
    laserChamber.displayStatus();

    cout << "\n  ----- Data Structures -----" << endl;
    cout << "  Sensor Log (Singly LL)     : " << sensorLog.getSize() << " readings" << endl;
    cout << "  Event History (Doubly LL)  : " << eventHistory.getSize() << " events" << endl;
    cout << "  Sliding Window (Circular)  : " << slidingWindow.getSize()
         << "/" << slidingWindow.getCapacity() << " slots" << endl;
    cout << "  Alert Queue                : " << alertQueue.getSize() << " pending" << endl;
    cout << "  Calibration Stack          : " << calibrationStack.getSize() << " entries" << endl;
    cout << "  Detection BST              : " << detectionTree.getSize()
         << " events (height: " << detectionTree.getHeight() << ")" << endl;

    cout << "\n  ----- Simulation -----" << endl;
    cout << "  Simulation Time: " << simulationTime << " seconds" << endl;
}

// ============================================================
//  MAIN FUNCTION
// ============================================================
int main() {
#ifdef _WIN32
    SetConsoleOutputCP(CP_UTF8);
#endif

    // Seed random number generator
    srand((unsigned int)time(0));

    cout << "\n";
    cout << "  +==============================================================+" << endl;
    cout << "  |                                                              |" << endl;
    cout << "  |    LOW-COST OPTICAL ATTENUATION SYSTEM FOR REAL-TIME         |" << endl;
    cout << "  |           MICROPLASTIC DETECTION                             |" << endl;
    cout << "  |                                                              |" << endl;
    cout << "  |    DSA Project Implementation                                |" << endl;
    cout << "  |    MIT Manipal | B.Tech CPS | 3rd Semester                   |" << endl;
    cout << "  |                                                              |" << endl;
    cout << "  |    DSA Concepts: Classes, Pointers, Linked Lists (3 types),  |" << endl;
    cout << "  |    Sorting (5 algos), Searching (2 algos), Stack, Queue, BST |" << endl;
    cout << "  |                                                              |" << endl;
    cout << "  +==============================================================+" << endl;

    int choice;
    do {
        displayMainMenu();
        cin >> choice;

        switch (choice) {
            case 1:  runFullSimulation();    break;
            case 2:  sensorLogMenu();        break;
            case 3:  eventHistoryMenu();     break;
            case 4:  slidingWindowMenu();    break;
            case 5:  sortingMenu();          break;
            case 6:  searchingMenu();        break;
            case 7:  calibrationMenu();      break;
            case 8:  alertQueueMenu();       break;
            case 9:  bstMenu();              break;
            case 10: showDashboard();        break;
            case 11: viewAllStatus();        break;
            case 0:
                cout << "\n  Exiting Microplastic Detection System. Goodbye!\n" << endl;
                break;
            default:
                cout << "  Invalid choice. Try again." << endl;
        }
    } while (choice != 0);

    return 0;
}
