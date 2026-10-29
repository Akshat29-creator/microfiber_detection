// ============================================================
//  MicroplasticEvent.h (Arduino/ESP32 Version)
//  CLASS: Represents a confirmed microplastic detection
//  DSA Concepts: Classes & Objects, Encapsulation
// ============================================================
#ifndef MICROPLASTIC_EVENT_H
#define MICROPLASTIC_EVENT_H

#include <Arduino.h>

// ---- Class: MicroplasticEvent ----
class MicroplasticEvent {
private:
    int eventID;
    float timestamp;
    float voltageDrop;
    float baselineVoltage;
    float duration;
    float waterTemperature;
    String severity;
    static int nextID;

public:
    MicroplasticEvent()
        : eventID(0), timestamp(0), voltageDrop(0), baselineVoltage(3.0),
          duration(0), waterTemperature(25.0), severity("LOW") {}

    MicroplasticEvent(float ts, float drop, float baseline, float dur, float temp)
        : timestamp(ts), voltageDrop(drop), baselineVoltage(baseline),
          duration(dur), waterTemperature(temp) {
        eventID = nextID++;
        float dropPercent = (voltageDrop / baselineVoltage) * 100.0;
        if (dropPercent > 20.0) severity = "HIGH";
        else if (dropPercent > 10.0) severity = "MEDIUM";
        else severity = "LOW";
    }

    int getEventID() const { return eventID; }
    float getTimestamp() const { return timestamp; }
    float getVoltageDrop() const { return voltageDrop; }
    float getBaselineVoltage() const { return baselineVoltage; }
    float getDuration() const { return duration; }
    String getSeverity() const { return severity; }

    float confidence() const {
        float dropRatio = voltageDrop / baselineVoltage;
        float durationFactor = (duration < 5.0) ? 1.0 : (5.0 / duration);
        return (dropRatio * 70.0 + durationFactor * 30.0);
    }

    void display() const {
        Serial.print("  Event #");
        Serial.print(eventID);
        Serial.print(" | Time: ");
        Serial.print(timestamp, 2);
        Serial.print("s | Drop: ");
        Serial.print(voltageDrop, 2);
        Serial.print("V | Severity: ");
        Serial.print(severity);
        Serial.print(" | Confidence: ");
        Serial.print(confidence(), 1);
        Serial.println("%");
    }
};

int MicroplasticEvent::nextID = 1;

#endif
