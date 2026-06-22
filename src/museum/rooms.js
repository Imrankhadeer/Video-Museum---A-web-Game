import * as THREE from 'three';
import { createMaterials } from './materials.js';
import { createSofa, createBench, createColumn, createWelcomeSign, createPaintingFrame } from './furniture.js';

/**
 * Helper: creates a BoxGeometry mesh with shadow flags and adds it to a group.
 * @param {THREE.Group} group - Parent group to add the mesh to
 * @param {number} w - Box width (X)
 * @param {number} h - Box height (Y)
 * @param {number} d - Box depth (Z)
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {number} z - Position Z
 * @param {THREE.Material} material - Material for the mesh
 * @returns {THREE.Mesh} The created mesh
 */
function addBox(group, w, h, d, x, y, z, material) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/**
 * Helper: adds a thin gold accent baseboard strip.
 * @param {THREE.Group} group - Parent group
 * @param {number} w - Strip width (X)
 * @param {number} d - Strip depth (Z)
 * @param {number} x - Position X
 * @param {number} z - Position Z
 * @param {THREE.Material} material - Accent material
 */
function addBaseboard(group, w, d, x, z, material) {
  // Baseboard: height 0.12, centered at Y=0.06
  addBox(group, w, 0.12, d, x, 0.06, z, material);
}

/**
 * Builds the entire museum environment.
 * The museum extends along the -Z axis, centered on X=0.
 * Rooms: Lobby -> Gallery Hall -> Corridor -> Main Theater
 *
 * @returns {Object} Museum data containing:
 *   - group: THREE.Group with all meshes
 *   - screenSlots: Array of screen placement data
 *   - sofaPosition: Vector3 for sofa seat center
 *   - sofaLookAt: Vector3 for theater screen center
 *   - roomZones: Array of named room boundaries
 *   - playerSpawn: Object with position and lookAt vectors
 */
export function createMuseum() {
  const materials = createMaterials();
  const group = new THREE.Group();

  // =====================================================================
  // SCREEN SLOTS — defines where video screens are placed in the museum
  // =====================================================================
  const screenSlots = [
    // --- Left gallery wall (X=-7.95, screens face +X) ---
    { position: new THREE.Vector3(-7.95, 2.5, -16), rotation: new THREE.Euler(0, Math.PI / 2, 0), size: { w: 2.4, h: 1.6 }, type: 'gallery', index: 0 },
    { position: new THREE.Vector3(-7.95, 2.5, -21), rotation: new THREE.Euler(0, Math.PI / 2, 0), size: { w: 2.4, h: 1.6 }, type: 'gallery', index: 1 },
    { position: new THREE.Vector3(-7.95, 2.5, -26), rotation: new THREE.Euler(0, Math.PI / 2, 0), size: { w: 2.4, h: 1.6 }, type: 'gallery', index: 2 },
    { position: new THREE.Vector3(-7.95, 2.5, -31), rotation: new THREE.Euler(0, Math.PI / 2, 0), size: { w: 2.4, h: 1.6 }, type: 'gallery', index: 3 },
    // --- Right gallery wall (X=7.95, screens face -X) ---
    { position: new THREE.Vector3(7.95, 2.5, -16), rotation: new THREE.Euler(0, -Math.PI / 2, 0), size: { w: 2.4, h: 1.6 }, type: 'gallery', index: 4 },
    { position: new THREE.Vector3(7.95, 2.5, -21), rotation: new THREE.Euler(0, -Math.PI / 2, 0), size: { w: 2.4, h: 1.6 }, type: 'gallery', index: 5 },
    { position: new THREE.Vector3(7.95, 2.5, -26), rotation: new THREE.Euler(0, -Math.PI / 2, 0), size: { w: 2.4, h: 1.6 }, type: 'gallery', index: 6 },
    { position: new THREE.Vector3(7.95, 2.5, -31), rotation: new THREE.Euler(0, -Math.PI / 2, 0), size: { w: 2.4, h: 1.6 }, type: 'gallery', index: 7 },
    // --- Theater main screen (Z=-65.7, faces +Z) ---
    { position: new THREE.Vector3(0, 4.375, -65.7), rotation: new THREE.Euler(0, 0, 0), size: { w: 12, h: 6.75 }, type: 'theater', index: 8 },
    // --- Lobby screen (left wall) ---
    { position: new THREE.Vector3(-7.95, 2.5, -6), rotation: new THREE.Euler(0, Math.PI / 2, 0), size: { w: 3.6, h: 2.4 }, type: 'gallery', index: 9 },
  ];

  // =====================================================================
  // LOBBY (Z: 0 to -12, X: -8 to 8, Y: 0 to 5)
  // =====================================================================

  // --- Floor: marble ---
  addBox(group, 16, 0.2, 12, 0, -0.1, -6, materials.marbleFloor);

  // --- Ceiling ---
  addBox(group, 16, 0.15, 12, 0, 5.075, -6, materials.ceiling);

  // --- Back wall (Z=0.15, behind the player spawn) ---
  addBox(group, 16.3, 5, 0.3, 0, 2.5, 0.15, materials.darkWall);

  // --- Left wall ---
  addBox(group, 0.3, 5, 12.3, -8.15, 2.5, -6, materials.darkWall);

  // --- Right wall ---
  addBox(group, 0.3, 5, 12.3, 8.15, 2.5, -6, materials.darkWall);

  // --- Front wall at Z=-12 with door opening ---
  // Door opening: 3.6m wide (X: -1.8 to 1.8), 3.8m tall
  // Left wall segment
  addBox(group, 6.2, 5, 0.3, -4.9, 2.5, -12, materials.darkWall);
  // Right wall segment
  addBox(group, 6.2, 5, 0.3, 4.9, 2.5, -12, materials.darkWall);
  // Lintel above door opening
  addBox(group, 3.6, 1.2, 0.3, 0, 4.4, -12, materials.darkWall);

  // --- Door frame accents at Z=-12 ---
  // Left door frame edge (vertical)
  addBox(group, 0.06, 3.8, 0.32, -1.83, 1.9, -12, materials.doorFrame);
  // Right door frame edge (vertical)
  addBox(group, 0.06, 3.8, 0.32, 1.83, 1.9, -12, materials.doorFrame);
  // Top door frame (horizontal)
  addBox(group, 3.72, 0.06, 0.32, 0, 3.83, -12, materials.doorFrame);

  // --- 4 decorative columns ---
  const columnPositions = [
    [-6, 0, -2.5],
    [6, 0, -2.5],
    [-6, 0, -9.5],
    [6, 0, -9.5],
  ];
  for (const [cx, cy, cz] of columnPositions) {
    const col = createColumn(materials.columnMaterial, 5);
    col.position.set(cx, cy, cz);
    group.add(col);
  }

  // --- Welcome sign: faces -Z (into the lobby) ---
  const sign = createWelcomeSign();
  sign.position.set(0, 3.2, -0.05);
  sign.rotation.y = Math.PI; // face -Z direction
  group.add(sign);

  // --- Gold accent baseboards along lobby walls ---
  // Back wall baseboard
  addBaseboard(group, 16.3, 0.3, 0, 0.15, materials.accent);
  // Left wall baseboard
  addBaseboard(group, 0.3, 12.3, -8.15, -6, materials.accent);
  // Right wall baseboard
  addBaseboard(group, 0.3, 12.3, 8.15, -6, materials.accent);
  // Front wall baseboards (around door)
  addBaseboard(group, 6.2, 0.3, -4.9, -12, materials.accent);
  addBaseboard(group, 6.2, 0.3, 4.9, -12, materials.accent);

  // =====================================================================
  // GALLERY HALL (Z: -12 to -36, X: -8 to 8, Y: 0 to 5)
  // =====================================================================

  // --- Floor: wood ---
  addBox(group, 16, 0.2, 24, 0, -0.1, -24, materials.woodFloor);

  // --- Ceiling ---
  addBox(group, 16, 0.15, 24, 0, 5.075, -24, materials.ceiling);

  // --- Left wall ---
  addBox(group, 0.3, 5, 24.3, -8.15, 2.5, -24, materials.darkWall);

  // --- Right wall ---
  addBox(group, 0.3, 5, 24.3, 8.15, 2.5, -24, materials.darkWall);

  // --- Far wall at Z=-36 with door opening ---
  // Left segment
  addBox(group, 6.2, 5, 0.3, -4.9, 2.5, -36, materials.darkWall);
  // Right segment
  addBox(group, 6.2, 5, 0.3, 4.9, 2.5, -36, materials.darkWall);
  // Lintel above door
  addBox(group, 3.6, 1.2, 0.3, 0, 4.4, -36, materials.darkWall);

  // --- Door frame accents at Z=-36 ---
  addBox(group, 0.06, 3.8, 0.32, -1.83, 1.9, -36, materials.doorFrame);
  addBox(group, 0.06, 3.8, 0.32, 1.83, 1.9, -36, materials.doorFrame);
  addBox(group, 3.72, 0.06, 0.32, 0, 3.83, -36, materials.doorFrame);

  // --- Gallery baseboards ---
  addBaseboard(group, 0.3, 24.3, -8.15, -24, materials.accent);
  addBaseboard(group, 0.3, 24.3, 8.15, -24, materials.accent);
  addBaseboard(group, 6.2, 0.3, -4.9, -36, materials.accent);
  addBaseboard(group, 6.2, 0.3, 4.9, -36, materials.accent);

  // --- Painting frames at each gallery screen slot ---
  for (const slot of screenSlots) {
    if (slot.type === 'gallery') {
      const frame = createPaintingFrame(slot.size.w, slot.size.h, materials.accent);
      frame.position.copy(slot.position);
      frame.rotation.copy(slot.rotation);
      group.add(frame);
    }
  }

  // --- 2 gallery benches ---
  const bench1 = createBench(materials.benchMaterial);
  bench1.position.set(0, 0, -20);
  group.add(bench1);

  const bench2 = createBench(materials.benchMaterial);
  bench2.position.set(0, 0, -28);
  group.add(bench2);

  // =====================================================================
  // CORRIDOR (Z: -36 to -46, X: -2 to 2, Y: 0 to 4)
  // =====================================================================

  // --- Floor ---
  addBox(group, 4, 0.2, 10, 0, -0.1, -41, materials.woodFloor);

  // --- Ceiling ---
  addBox(group, 4, 0.15, 10, 0, 4.075, -41, materials.ceiling);

  // --- Left wall ---
  addBox(group, 0.3, 4, 10, -2.15, 2, -41, materials.corridorWall);

  // --- Right wall ---
  addBox(group, 0.3, 4, 10, 2.15, 2, -41, materials.corridorWall);

  // --- Fill walls at Z=-36: bridge gallery width (16m) to corridor width (4m) ---
  // Left fill wall
  addBox(group, 5.85, 5, 0.3, -5.075, 2.5, -36, materials.darkWall);
  // Right fill wall
  addBox(group, 5.85, 5, 0.3, 5.075, 2.5, -36, materials.darkWall);

  // --- Fill walls at Z=-46: bridge corridor width (4m) to theater width (16m) ---
  // Left fill wall
  addBox(group, 5.85, 5, 0.3, -5.075, 2.5, -46, materials.darkWall);
  // Right fill wall
  addBox(group, 5.85, 5, 0.3, 5.075, 2.5, -46, materials.darkWall);

  // --- Corridor baseboards ---
  addBaseboard(group, 0.3, 10, -2.15, -41, materials.accent);
  addBaseboard(group, 0.3, 10, 2.15, -41, materials.accent);

  // =====================================================================
  // MAIN THEATER (Z: -46 to -66, X: -8 to 8, Y: 0 to 7)
  // =====================================================================

  // --- Floor: very dark carpet-like surface ---
  addBox(group, 16, 0.2, 20, 0, -0.1, -56, materials.theaterWall);

  // --- Ceiling ---
  addBox(group, 16, 0.15, 20, 0, 7.075, -56, materials.ceiling);

  // --- Left wall ---
  addBox(group, 0.3, 7, 20, -8.15, 3.5, -56, materials.theaterWall);

  // --- Right wall ---
  addBox(group, 0.3, 7, 20, 8.15, 3.5, -56, materials.theaterWall);

  // --- Back wall (Z=-66) ---
  addBox(group, 16.3, 7, 0.3, 0, 3.5, -66, materials.theaterWall);

  // --- Entry wall at Z=-46 with door opening ---
  // Door opening: 3.6m wide, 4m tall (taller theater)
  // Left segment
  addBox(group, 6.2, 7, 0.3, -4.9, 3.5, -46, materials.theaterWall);
  // Right segment
  addBox(group, 6.2, 7, 0.3, 4.9, 3.5, -46, materials.theaterWall);
  // Lintel above door
  addBox(group, 3.6, 3, 0.3, 0, 5.5, -46, materials.theaterWall);

  // --- Door frame accents at Z=-46 ---
  addBox(group, 0.06, 4, 0.32, -1.83, 2, -46, materials.doorFrame);
  addBox(group, 0.06, 4, 0.32, 1.83, 2, -46, materials.doorFrame);
  addBox(group, 3.72, 0.06, 0.32, 0, 4.03, -46, materials.doorFrame);

  // --- Theater baseboards ---
  addBaseboard(group, 0.3, 20, -8.15, -56, materials.accent);
  addBaseboard(group, 0.3, 20, 8.15, -56, materials.accent);
  addBaseboard(group, 16.3, 0.3, 0, -66, materials.accent);

  // --- Theater painting frame around the big screen ---
  const theaterSlot = screenSlots.find(s => s.type === 'theater');
  if (theaterSlot) {
    const theaterFrame = createPaintingFrame(theaterSlot.size.w, theaterSlot.size.h, materials.accent);
    theaterFrame.position.copy(theaterSlot.position);
    theaterFrame.rotation.copy(theaterSlot.rotation);
    group.add(theaterFrame);
  }

  // --- Sofa at center of theater, facing the screen (-Z) ---
  const sofa = createSofa(materials.sofaMaterial);
  sofa.position.set(0, 0, -56);
  sofa.rotation.y = 0; // Fixed rotation based on user feedback
  group.add(sofa);

  // =====================================================================
  // Return museum data
  // =====================================================================
  return {
    group,
    screenSlots,
    sofaPosition: new THREE.Vector3(0, 0.42, -56),   // sofa seat center
    sofaLookAt: new THREE.Vector3(0, 4.375, -65.7),   // theater screen center
    roomZones: [
      { name: 'The Lobby', minZ: -12, maxZ: 1 },
      { name: 'Gallery Wing', minZ: -36, maxZ: -12 },
      { name: 'The Corridor', minZ: -46, maxZ: -36 },
      { name: 'The Screening Room', minZ: -66, maxZ: -46 },
    ],
    playerSpawn: {
      position: new THREE.Vector3(0, 1.7, -3),
      lookAt: new THREE.Vector3(0, 1.7, -12),
    },
  };
}
