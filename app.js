// High-Density Connectivity Map (Abridged for brevity)
// These indices represent the triangles forming the hand surface
const HAND_MESH_INDICES = [
  0, 1, 5,  1, 2, 5,  2, 3, 5,  // Palm base
  5, 6, 9,  6, 7, 9,  // Finger webbing
  // ... (Full map includes ~400 connections for the level in your image)
];

function createHighDensityMesh() {
    const geometry = new THREE.BufferGeometry();
    // We create enough vertices for a high-poly look
    const vertices = new Float32Array(21 * 3); 
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(HAND_MESH_INDICES);

    const material = new THREE.MeshBasicMaterial({
        color: 0x00f2ff,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
}
