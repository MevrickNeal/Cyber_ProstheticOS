hands.onResults((results) => {
    // Clear and draw the background video frame first
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            // THE FIX: Proper Coordinate Alignment
            landmarks.forEach((p, i) => {
                // Map 0->1 to -Range->+Range based on aspect ratio
                const x = (p.x - 0.5) * -2 * (window.innerWidth / window.innerHeight);
                const y = (p.y - 0.5) * -2;
                const z = p.z * -2; // Depth scaling

                points[i].position.set(x, y, z);
                
                // Add glowing "Data Lines" between joints for the Cyberpunk look
                updateMeshConnections(landmarks);
            });

            // LOG TELEMETRY (Interesting HUD Data)
            const wrist = landmarks[0];
            document.getElementById('log').innerHTML = `
                X: ${wrist.x.toFixed(2)} | Y: ${wrist.y.toFixed(2)}<br>
                Z-DEPTH: ${Math.abs(wrist.z * 100).toFixed(0)}cm<br>
                ACTIVE_SERVOS: ${serialWriter ? '5/5' : '0/5'}
            `;

            // Process Robotic Arm logic...
            processFingers(landmarks);
        }
    }
    renderer.render(scene, camera);
    canvasCtx.restore();
});
