#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

// Initialize the driver at default I2C address 0x40
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

// Mapping: 2=Ring, 3=Pinky, 4=Thumb, 5=Middle, 6=Index
const int channels[] = {2, 3, 4, 5, 6};
int currentPos[] = {450, 450, 450, 590, 450}; // Current positions
int targetPos[]  = {450, 450, 450, 590, 450}; // Targets from Browser

// --- TUNING PARAMETERS ---
int stepSpeed = 10; // Speed of movement (Higher = Faster)
int loopDelay = 10; // Smoothness (Lower = Smoother, but more CPU)

void setup() {
  Serial.begin(115200); // Matches your Browser speed
  pwm.begin();
  pwm.setPWMFreq(50); // Standard frequency for SG90 servos
  
  // Set initial home positions
  for(int i = 0; i < 5; i++) {
    pwm.setPWM(channels[i], 0, currentPos[i]);
  }
}

void loop() {
  // 1. LISTEN FOR NEURAL LINK COMMANDS (Format: "C[chan],[pulse]")
  if (Serial.available() > 0) {
    char startChar = Serial.read();
    if (startChar == 'C') {
      int incomingChan = Serial.parseInt();
      if (Serial.read() == ',') {
        int incomingPulse = Serial.parseInt();
        
        // Update the target for the specific finger
        for(int i = 0; i < 5; i++) {
          if(channels[i] == incomingChan) {
            targetPos[i] = incomingPulse;
          }
        }
      }
    }
  }

  // 2. SMOOTH INTERPOLATION ENGINE
  for (int i = 0; i < 5; i++) {
    if (currentPos[i] < targetPos[i]) {
      currentPos[i] += stepSpeed;
      if (currentPos[i] > targetPos[i]) currentPos[i] = targetPos[i];
    } 
    else if (currentPos[i] > targetPos[i]) {
      currentPos[i] -= stepSpeed;
      if (currentPos[i] < targetPos[i]) currentPos[i] = targetPos[i];
    }
    
    // Apply the position to the PCA9685
    pwm.setPWM(channels[i], 0, currentPos[i]);
  }

  delay(loopDelay); 
}
