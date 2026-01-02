let serialWriter = null;
const logs = document.getElementById('logs');

// 1. SCENE SETUP (The Transparency Fix)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // ALPHA MUST BE TRUE
renderer.setClearColor(0x000000, 0); // SET ALPHA TO 0
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('viewport').appendChild(renderer.domElement);

// 2. MESH GENERATION (Glow Dots)
const joints = [];
for (let i = 0; i < 21; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
    joints.push(mesh);
    scene.add(mesh);
}
camera.position.z = 2;

// 3. SERIAL LINK
document.getElementById('connectBtn').onclick = async () => {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    serialWriter = port.writable.getWriter();
    document.getElementById('status').innerText = "ONLINE";
    jarvis("Neural link established.");
};

function jarvis(msg) {
    const s = new SpeechSynthesisUtterance(msg); s.rate = 1.1; window.speechSynthesis.speak(s);
    logs.innerHTML = `> ${msg.toUpperCase()}<br>` + logs.innerHTML;
}

// 4. TRACKING LOOP
const hands = new Hands({locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7 });
hands.onResults((res) => {
    if (res.multiHandLandmarks) {
        for (const landmarks of res.multiHandLandmarks) {
            landmarks.forEach((p, i) => {
                joints[i].position.set((p.x - 0.5) * -3, (p.y - 0.5) * -3, p.z * 2);
            });
            // Finger Logic
            processFingers(landmarks);
        }
    }
    renderer.render(scene, camera);
});

function processFingers(pts) {
    const wrist = pts[0];
    const tips = [16, 20, 4, 12, 8]; // Ring, Pinky, Thumb, Middle, Index
    const chans = [2, 3, 4, 5, 6];
    
    tips.forEach((idx, i) => {
        const d = Math.sqrt(Math.pow(pts[idx].x - wrist.x, 2) + Math.pow(pts[idx].y - wrist.y, 2));
        const pulse = d < 0.25 ? 60 : (chans[i] === 5 ? 590 : 450);
        if (serialWriter) serialWriter.write(new TextEncoder().encode(`C${chans[i]},${pulse}`));
    });
}

const cam = new Camera(document.getElementById('input_video'), {
    onFrame: async () => { await hands.send({image: document.getElementById('input_video')}); }
});
cam.start();
