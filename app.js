let lastCmds = [0,0,0,0,0]; // Cache last sent pulses
let lastSentTime = 0;

function processFingers(landmarks) {
    const wrist = landmarks[0];
    const tips = [16, 20, 4, 12, 8]; // Ring, Pinky, Thumb, Middle, Index
    const chans = [2, 3, 4, 5, 6];
    
    // 1. Calculate Distances
    const distances = tips.map(idx => {
        return Math.sqrt(
            Math.pow(landmarks[idx].x - wrist.x, 2) + 
            Math.pow(landmarks[idx].y - wrist.y, 2)
        );
    });

    // 2. State Detection Logic
    const isFist = distances.every(d => d < 0.18);
    const isOpen = distances.every(d => d > 0.35);

    if (isFist) {
        sendGlobalCommand('B'); // Force Full Close
    } else if (isOpen) {
        sendGlobalCommand('A'); // Force Full Open
    } else {
        // 3. Individual Finger Logic
        distances.forEach((d, i) => {
            let targetPulse = (chans[i] === 5) ? 590 : 450; // Open
            if (d < 0.22) targetPulse = 60; // Individual Close
            
            sendThrottled(chans[i], targetPulse);
        });
    }
}

async function sendThrottled(chan, pulse) {
    const now = Date.now();
    // Only send if pulse changed AND we haven't sent in 50ms
    if (pulse !== lastCmds[chan-2] && now - lastSentTime > 50) {
        if (serialWriter) {
            await serialWriter.write(new TextEncoder().encode(`C${chan},${pulse}`));
            lastCmds[chan-2] = pulse;
            lastSentTime = now;
        }
    }
}
