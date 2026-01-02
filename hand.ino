#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

int channels[] = {2, 3, 4, 5, 6}; 
int openVals[] = {450, 450, 450, 590, 450};
int closeVals[] = {60, 60, 60, 60, 60};

void setup() {
  Serial.begin(115200);
  pwm.begin();
  pwm.setPWMFreq(50);
  relaxAll();
}

void relaxAll() {
  for (int i = 0; i < 5; i++) pwm.setPin(channels[i], 4096, true); 
}

void moveHand(bool open) {
  for (int i = 0; i < 5; i++) {
    pwm.setPWM(channels[i], 0, open ? openVals[i] : closeVals[i]);
  }
}

void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == 'A') moveHand(true);
    if (cmd == 'B') moveHand(false);
    if (cmd == 'C') { // Middle Finger Gesture
      for(int i=0; i<5; i++) pwm.setPWM(channels[i], 0, (channels[i] == 5) ? 590 : 60);
    }
    if (cmd == 'R') relaxAll(); // RELAX COMMAND
  }
}
