#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

void setup() {
  Serial.begin(115200);
  pwm.begin();
  pwm.setPWMFreq(50);
}

void relaxAll() {
  for (int i = 2; i <= 6; i++) pwm.setPin(i, 4096, true); 
}

void loop() {
  if (Serial.available() > 0) {
    char head = Serial.read();
    
    // PRECISION MOVEMENT
    if (head == 'C') {
      int chan = Serial.parseInt();
      if (Serial.read() == ',') {
        int pulse = Serial.parseInt();
        // Constrain for safety
        if (pulse < 60) pulse = 60;
        if (pulse > 600) pulse = 600;
        pwm.setPWM(chan, 0, pulse);
      }
    } 
    // EMERGENCY RELAX
    else if (head == 'R') {
      relaxAll();
    }
  }
}
