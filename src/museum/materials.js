import * as THREE from 'three';

/**
 * Creates a procedural marble texture using canvas.
 * Generates an off-white base with subtle gray veins using random Bezier curves.
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {HTMLCanvasElement} Canvas element with marble pattern
 */
function createMarbleTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Off-white base fill
  ctx.fillStyle = '#f0ece4';
  ctx.fillRect(0, 0, width, height);

  // Add subtle noise/variation to the base
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const shade = 220 + Math.floor(Math.random() * 25);
    ctx.fillStyle = `rgba(${shade}, ${shade - 5}, ${shade - 10}, 0.3)`;
    ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
  }

  // Draw subtle gray veins using random Bezier curves
  const veinCount = 6 + Math.floor(Math.random() * 5);
  for (let i = 0; i < veinCount; i++) {
    ctx.beginPath();

    // Random start point
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    ctx.moveTo(startX, startY);

    // Draw 2-4 connected Bezier curve segments per vein
    const segments = 2 + Math.floor(Math.random() * 3);
    let cx = startX;
    let cy = startY;
    for (let s = 0; s < segments; s++) {
      const cp1x = cx + (Math.random() - 0.5) * width * 0.4;
      const cp1y = cy + (Math.random() - 0.5) * height * 0.4;
      const cp2x = cx + (Math.random() - 0.5) * width * 0.5;
      const cp2y = cy + (Math.random() - 0.5) * height * 0.5;
      const endX = cx + (Math.random() - 0.5) * width * 0.6;
      const endY = cy + (Math.random() - 0.5) * height * 0.6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      cx = endX;
      cy = endY;
    }

    // Vary vein opacity and width for realism
    const gray = 160 + Math.floor(Math.random() * 40);
    ctx.strokeStyle = `rgba(${gray}, ${gray - 5}, ${gray + 5}, ${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.stroke();
  }

  // Add a few thinner, subtler secondary veins
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.bezierCurveTo(
      Math.random() * width, Math.random() * height,
      Math.random() * width, Math.random() * height,
      Math.random() * width, Math.random() * height
    );
    ctx.strokeStyle = `rgba(190, 185, 175, ${0.08 + Math.random() * 0.1})`;
    ctx.lineWidth = 0.3 + Math.random() * 0.8;
    ctx.stroke();
  }

  return canvas;
}

/**
 * Creates a procedural wood texture using canvas.
 * Generates a dark brown base with lighter grain lines for a walnut appearance.
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {HTMLCanvasElement} Canvas element with wood grain pattern
 */
function createWoodTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark walnut brown base
  ctx.fillStyle = '#3b2716';
  ctx.fillRect(0, 0, width, height);

  // Add wood grain lines running along the X axis (horizontal)
  for (let y = 0; y < height; y++) {
    // Vary the base color slightly per scanline for natural look
    const variation = Math.sin(y * 0.15) * 8 + Math.sin(y * 0.37) * 4 + Math.random() * 6;
    const r = 59 + variation;
    const g = 39 + variation * 0.6;
    const b = 22 + variation * 0.3;
    ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    ctx.fillRect(0, y, width, 1);
  }

  // Overlay lighter grain lines
  const grainCount = 30 + Math.floor(Math.random() * 20);
  for (let i = 0; i < grainCount; i++) {
    const y = Math.random() * height;
    const grainWidth = 0.5 + Math.random() * 1.5;

    ctx.beginPath();
    ctx.moveTo(0, y);

    // Slight waviness in the grain
    for (let x = 0; x < width; x += 10) {
      const wobble = Math.sin(x * 0.02 + i) * 2 + Math.sin(x * 0.05) * 1;
      ctx.lineTo(x, y + wobble);
    }

    const lightness = 70 + Math.floor(Math.random() * 30);
    ctx.strokeStyle = `rgba(${lightness}, ${lightness - 15}, ${lightness - 25}, ${0.1 + Math.random() * 0.15})`;
    ctx.lineWidth = grainWidth;
    ctx.stroke();
  }

  // Add darker knot accents
  for (let i = 0; i < 3; i++) {
    const kx = Math.random() * width;
    const ky = Math.random() * height;
    const radius = 5 + Math.random() * 15;
    const gradient = ctx.createRadialGradient(kx, ky, 0, kx, ky, radius);
    gradient.addColorStop(0, 'rgba(25, 15, 8, 0.4)');
    gradient.addColorStop(1, 'rgba(25, 15, 8, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(kx - radius, ky - radius, radius * 2, radius * 2);
  }

  return canvas;
}

/**
 * Creates all PBR materials used throughout the museum.
 * All materials are MeshStandardMaterial for physically-based rendering.
 * @returns {Object} Object containing named material references
 */
export function createMaterials() {
  // --- Marble floor texture ---
  const marbleCanvas = createMarbleTexture(512, 512);
  const marbleMap = new THREE.CanvasTexture(marbleCanvas);
  marbleMap.wrapS = THREE.RepeatWrapping;
  marbleMap.wrapT = THREE.RepeatWrapping;
  marbleMap.repeat.set(4, 4);

  const marbleFloor = new THREE.MeshStandardMaterial({
    map: marbleMap,
    roughness: 0.25,
    metalness: 0.05,
  });

  // --- Wood floor texture ---
  const woodCanvas = createWoodTexture(512, 512);
  const woodMap = new THREE.CanvasTexture(woodCanvas);
  woodMap.wrapS = THREE.RepeatWrapping;
  woodMap.wrapT = THREE.RepeatWrapping;
  woodMap.repeat.set(6, 6);

  const woodFloor = new THREE.MeshStandardMaterial({
    map: woodMap,
    roughness: 0.55,
    metalness: 0.0,
  });

  // --- Dark blue-gray walls for lobby/gallery ---
  const darkWall = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.85,
    metalness: 0.0,
  });

  // --- Very dark near-black walls for theater ---
  const theaterWall = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    roughness: 0.9,
    metalness: 0.0,
  });

  // --- Moody dark indigo walls for corridor ---
  const corridorWall = new THREE.MeshStandardMaterial({
    color: 0x151525,
    roughness: 0.8,
    metalness: 0.0,
  });

  // --- Dark matte ceiling ---
  const ceiling = new THREE.MeshStandardMaterial({
    color: 0x121218,
    roughness: 0.95,
    metalness: 0.0,
  });

  // --- Gold accent trim ---
  const accent = new THREE.MeshStandardMaterial({
    color: 0xb8941f,
    roughness: 0.35,
    metalness: 0.7,
  });

  // --- Dark wood baseboard ---
  const baseboard = new THREE.MeshStandardMaterial({
    color: 0x2a1a0e,
    roughness: 0.7,
    metalness: 0.0,
  });

  // --- Brass/gold door frame ---
  const doorFrame = new THREE.MeshStandardMaterial({
    color: 0xc9a84c,
    roughness: 0.3,
    metalness: 0.8,
  });

  // --- Light marble for columns ---
  const columnCanvas = createMarbleTexture(256, 256);
  const columnMap = new THREE.CanvasTexture(columnCanvas);
  columnMap.wrapS = THREE.RepeatWrapping;
  columnMap.wrapT = THREE.RepeatWrapping;
  columnMap.repeat.set(1, 2);

  const columnMaterial = new THREE.MeshStandardMaterial({
    map: columnMap,
    roughness: 0.3,
    metalness: 0.05,
  });

  // --- Dark charcoal leather for sofas ---
  const sofaMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a30,
    roughness: 0.45,
    metalness: 0.05,
  });

  // --- Dark wood for benches ---
  const benchCanvas = createWoodTexture(256, 256);
  const benchMap = new THREE.CanvasTexture(benchCanvas);
  benchMap.wrapS = THREE.RepeatWrapping;
  benchMap.wrapT = THREE.RepeatWrapping;
  benchMap.repeat.set(2, 1);

  const benchMaterial = new THREE.MeshStandardMaterial({
    map: benchMap,
    roughness: 0.6,
    metalness: 0.0,
  });

  return {
    marbleFloor,
    woodFloor,
    darkWall,
    theaterWall,
    corridorWall,
    ceiling,
    accent,
    baseboard,
    doorFrame,
    columnMaterial,
    sofaMaterial,
    benchMaterial,
  };
}
