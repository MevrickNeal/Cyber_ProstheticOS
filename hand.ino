#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

// SENSORS (Input)
const int sensorPins[] = {A0, A1, A2, A3, A6}; // Ring, Pinky, Thumb, Middle, Index

// SERVOS (Output)
const int servoChans[] = {2, 3, 4, 5, 6}; 

unsigned long lastTelemetry = 0;

void setup() {
  Serial.begin(115200);
  pwm.begin();
  pwm.setPWMFreq(50);
}

void relaxAll() {
  for (int i = 2; i <= 6; i++) pwm.setPin(i, 4096, true);
}

void loop() {
  // 1. LISTEN FOR COMMANDS (Browser -> Arduino)
  if (Serial.available() > 0) {
    char head = Serial.read();
    
    if (head == 'C') { // Control Command
      int chan = Serial.parseInt();
      if (Serial.read() == ',') {
        int pulse = Serial.parseInt();
        // Constrain pulse for safety
        if (pulse < 60) pulse = 60; 
        if (pulse > 600) pulse = 600;
        pwm.setPWM(chan, 0, pulse);
      }
    } 
    else if (head == 'R') { // Relax Command
      relaxAll();
    }
  }

  // 2. SEND TELEMETRY (Arduino -> Browser)
  // Sends data every 50ms (20Hz) to keep graphs smooth but not clog the line
  if (millis() - lastTelemetry > 50) {
    Serial.print("E"); // 'E' for EMG Data
    for (int i = 0; i < 5; i++) {
      Serial.print(",");
      Serial.print(analogRead(sensorPins[i]));
    }
    Serial.println(); // End line
    lastTelemetry = millis();
  }
}
