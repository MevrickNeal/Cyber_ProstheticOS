// --- 1. NEURAL LINK & TELEMETRY ---
let serialWriter = null;
let lastSent = 0;
const logStream = document.getElementById('log');

function updateHUD(landmarks, state) {
    const wrist = landmarks[0];
    logStream.innerHTML = `
        <div style="color:#00f2ff">>> NEURAL_LINK_ACTIVE</div>
        STATE: ${state} <br>
        WRIST_X: ${wrist.x.toFixed(3)} | WRIST_Y: ${wrist.y.toFixed(3)} <br>
        DEPTH: ${Math.abs(wrist.z * 100).toFixed(1)}cm
    `;
}

// --- 2. HOLOGRAPHIC 3D MESH (Iron Man Style) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
// FIX: Alpha: true enables transparent background so you can see yourself
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0); 
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('viewport').appendChild(renderer.domElement);

const joints = [];
for (let i = 0; i < 21; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
    joints.push(mesh);
    scene.add(mesh);
}
camera.position.z = 2;

// --- 3. GESTURE & SERIAL LOGIC ---
document.getElementById('connectBtn').onclick = async () => {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    serialWriter = port.writable.getWriter();
    document.getElementById('sync').innerText = "ONLINE";
};

function processGestures(landmarks) {
    const wrist = landmarks[0];
    const tips = [16, 20, 4, 12, 8]; // Ring, Pinky, Thumb, Middle, Index
    const chans = [2, 3, 4, 5, 6];
    
    const distances = tips.map(idx => Math.sqrt(
        Math.pow(landmarks[idx].x - wrist.x, 2) + Math.pow(landmarks[idx].y - wrist.y, 2)
    ));

    const allClosed = distances.every(d => d < 0.20);
    const allOpen = distances.every(d => d > 0.35);

    if (allClosed) {
        sendCommand('B'); // Force Full Close
        updateHUD(landmarks, "FIST_MODE");
    } else if (allOpen) {
        sendCommand('A'); // Force Full Open
        updateHUD(landmarks, "OPEN_PALM");
    } else {
        // Individual Syncing
        distances.forEach((d, i) => {
            const pulse = d < 0.23 ? 60 : (chans[i] === 5 ? 590 : 450);
            sendToArm(`C${chans[i]},${pulse}`);
        });
        updateHUD(landmarks, "INDIVIDUAL_SYNC");
    }
}

async function sendToArm(cmd) {
    if (serialWriter && Date.now() - lastSent > 50) {
        await serialWriter.write(new TextEncoder().encode(cmd));
        lastSent = Date.now();
    }
}

// --- 4. TRACKING LOOP ---
const hands = new Hands({locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7 });
hands.onResults((res) => {
    if (res.multiHandLandmarks) {
        for (const landmarks of res.multiHandLandmarks) {
            landmarks.forEach((p, i) => {
                // FIX: Coordinate Normalization to align mesh to hand
                joints[i].position.set((p.x - 0.5) * -3, (p.y - 0.5) * -3, p.z * 2);
            });
            processGestures(landmarks);
        }
    }
    renderer.render(scene, camera);
});

const cam = new Camera(document.getElementById('input_video'), {
    onFrame: async () => { await hands.send({image: document.getElementById('input_video')}); }
});
cam.start();
