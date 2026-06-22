import * as THREE from 'three';

/**
 * Creates a modern sofa from multiple BoxGeometry pieces.
 * Total dimensions: ~2.5m wide (X), 0.85m tall (Y), 0.9m deep (Z).
 * Seat surface at Y=0.42.
 *
 * @param {THREE.Material} material - The sofa material (sofaMaterial)
 * @returns {THREE.Group} Sofa group with base at Y=0
 */
export function createSofa(material) {
  const group = new THREE.Group();

  // --- Base frame: the solid bottom foundation ---
  // Spans the full width and depth, low height
  const baseGeo = new THREE.BoxGeometry(2.5, 0.12, 0.9);
  const base = new THREE.Mesh(baseGeo, material);
  base.position.set(0, 0.06, 0); // base at Y=0, top at Y=0.12
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // --- Seat cushion: the sitting surface ---
  // Sits on top of the base, slightly inset from edges
  const seatGeo = new THREE.BoxGeometry(2.3, 0.18, 0.7);
  const seat = new THREE.Mesh(seatGeo, material);
  seat.position.set(0, 0.33, 0.05); // top at ~0.42 (seat surface)
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  // --- Back rest: vertical cushion behind the seat ---
  // Extends from seat height up to full sofa height
  const backGeo = new THREE.BoxGeometry(2.3, 0.43, 0.15);
  const back = new THREE.Mesh(backGeo, material);
  back.position.set(0, 0.635, -0.375); // center Y between 0.42 and 0.85
  back.castShadow = true;
  back.receiveShadow = true;
  group.add(back);

  // --- Left armrest ---
  const armGeo = new THREE.BoxGeometry(0.15, 0.35, 0.9);
  const leftArm = new THREE.Mesh(armGeo, material);
  leftArm.position.set(-1.175, 0.5, 0); // outer edge at ~-1.25
  leftArm.castShadow = true;
  leftArm.receiveShadow = true;
  group.add(leftArm);

  // --- Right armrest ---
  const rightArm = new THREE.Mesh(armGeo, material);
  rightArm.position.set(1.175, 0.5, 0); // outer edge at ~1.25
  rightArm.castShadow = true;
  rightArm.receiveShadow = true;
  group.add(rightArm);

  return group;
}

/**
 * Creates a minimal gallery bench.
 * Dimensions: 1.5m wide, 0.45m tall, 0.4m deep.
 * Simple seat top with two leg supports.
 *
 * @param {THREE.Material} material - The bench material (benchMaterial)
 * @returns {THREE.Group} Bench group with base at Y=0
 */
export function createBench(material) {
  const group = new THREE.Group();

  // --- Seat top: the flat sitting surface ---
  const seatGeo = new THREE.BoxGeometry(1.5, 0.06, 0.4);
  const seat = new THREE.Mesh(seatGeo, material);
  seat.position.set(0, 0.42, 0); // top at Y=0.45
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  // --- Left leg support: solid panel ---
  const legGeo = new THREE.BoxGeometry(0.08, 0.39, 0.35);

  const leftLeg = new THREE.Mesh(legGeo, material);
  leftLeg.position.set(-0.6, 0.195, 0); // centered under seat, inset from edge
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  group.add(leftLeg);

  // --- Right leg support: solid panel ---
  const rightLeg = new THREE.Mesh(legGeo, material);
  rightLeg.position.set(0.6, 0.195, 0); // symmetric with left leg
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  group.add(rightLeg);

  return group;
}

/**
 * Creates a decorative column with base and capital.
 * Uses CylinderGeometry for the shaft and wider cylinders for base/capital.
 *
 * @param {THREE.Material} material - The column material (columnMaterial)
 * @param {number} height - Total column height in meters (default 5)
 * @returns {THREE.Group} Column group with base at Y=0
 */
export function createColumn(material, height = 5) {
  const group = new THREE.Group();

  // --- Base: wider cylinder at the bottom ---
  const baseGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
  const base = new THREE.Mesh(baseGeo, material);
  base.position.set(0, 0.075, 0); // bottom at Y=0
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // --- Main shaft: the tall central cylinder ---
  const shaftHeight = height - 0.3; // subtract base + capital heights
  const shaftGeo = new THREE.CylinderGeometry(0.25, 0.25, shaftHeight, 16);
  const shaft = new THREE.Mesh(shaftGeo, material);
  shaft.position.set(0, 0.15 + shaftHeight / 2, 0); // sits on top of base
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  // --- Capital: wider cylinder at the top ---
  const capitalGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
  const capital = new THREE.Mesh(capitalGeo, material);
  capital.position.set(0, height - 0.075, 0); // top at Y=height
  capital.castShadow = true;
  capital.receiveShadow = true;
  group.add(capital);

  return group;
}

/**
 * Creates a 'VIDEO MUSEUM' welcome sign using a canvas texture.
 * Dimensions: 4m wide, 0.8m tall plane.
 * Dark background with gold text, includes emissive glow.
 *
 * @returns {THREE.Mesh} Sign mesh ready to be positioned in the scene
 */
export function createWelcomeSign() {
  // Create canvas for the sign texture
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 204; // maintain ~5:1 aspect ratio matching 4m x 0.8m

  const ctx = canvas.getContext('2d');

  // Dark background fill
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gold text centered on the canvas
  ctx.font = 'bold 72px serif';
  ctx.fillStyle = '#d4a853';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VIDEO MUSEUM', canvas.width / 2, canvas.height / 2);

  // Create texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);

  // Create the sign plane geometry
  const geometry = new THREE.PlaneGeometry(4, 0.8);

  // Material with both diffuse map and emissive glow for visibility
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: new THREE.Color('#d4a853'),
    emissiveIntensity: 0.3,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Creates a decorative painting frame border around a screen area.
 * Uses 4 thin BoxGeometry pieces forming a rectangular border.
 * The frame surrounds the given screen dimensions.
 *
 * @param {number} width - Inner screen width in meters
 * @param {number} height - Inner screen height in meters
 * @param {THREE.Material} material - Frame material (accent/gold)
 * @returns {THREE.Group} Frame group centered at origin
 */
export function createPaintingFrame(width, height, material) {
  const group = new THREE.Group();

  const frameWidth = 0.06;  // thickness of the frame border
  const frameDepth = 0.08;  // how far the frame protrudes

  // Outer dimensions of the frame
  const outerW = width + frameWidth * 2;
  const outerH = height + frameWidth * 2;

  // --- Top bar ---
  const topGeo = new THREE.BoxGeometry(outerW, frameWidth, frameDepth);
  const top = new THREE.Mesh(topGeo, material);
  top.position.set(0, height / 2 + frameWidth / 2, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // --- Bottom bar ---
  const bottom = new THREE.Mesh(topGeo, material);
  bottom.position.set(0, -(height / 2 + frameWidth / 2), 0);
  bottom.castShadow = true;
  bottom.receiveShadow = true;
  group.add(bottom);

  // --- Left bar (spans inner height only, fits between top and bottom) ---
  const sideGeo = new THREE.BoxGeometry(frameWidth, height, frameDepth);
  const left = new THREE.Mesh(sideGeo, material);
  left.position.set(-(width / 2 + frameWidth / 2), 0, 0);
  left.castShadow = true;
  left.receiveShadow = true;
  group.add(left);

  // --- Right bar ---
  const right = new THREE.Mesh(sideGeo, material);
  right.position.set(width / 2 + frameWidth / 2, 0, 0);
  right.castShadow = true;
  right.receiveShadow = true;
  group.add(right);

  return group;
}
