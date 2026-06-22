import * as THREE from 'three';

/**
 * Create a gallery-style screen mesh suitable for wall-mounted exhibits.
 * Returns a THREE.Group containing the emissive video plane and a dark back panel.
 *
 * @param {THREE.VideoTexture} videoTexture - The video texture to display.
 * @param {number} width  - Screen width in world units.
 * @param {number} height - Screen height in world units.
 * @returns {THREE.Group}
 */
export function createGalleryScreen(videoTexture, width, height) {
  const group = new THREE.Group();

  // Main screen plane
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshStandardMaterial({
    map: videoTexture,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: videoTexture,
    emissiveIntensity: 0.5,
    side: THREE.FrontSide,
    toneMapped: false, // prevent Three.js tone mapping from washing out video colours
  });

  const screen = new THREE.Mesh(geometry, material);
  screen.name = 'screen';
  group.add(screen);

  // Subtle dark back panel (slightly larger, placed just behind the screen)
  const backGeo = new THREE.PlaneGeometry(width + 0.1, height + 0.1);
  const backMat = new THREE.MeshStandardMaterial({ color: 0x050508 });
  const backPanel = new THREE.Mesh(backGeo, backMat);
  backPanel.position.z = -0.02;
  group.add(backPanel);

  return group;
}

/**
 * Create the large theater screen with higher emissive intensity so it
 * illuminates the surrounding room convincingly.
 * Returns a THREE.Group containing the emissive video plane and a dark bezel.
 *
 * @param {THREE.VideoTexture} videoTexture - The video texture to display.
 * @param {number} width  - Screen width in world units.
 * @param {number} height - Screen height in world units.
 * @returns {THREE.Group}
 */
export function createTheaterScreen(videoTexture, width, height) {
  const group = new THREE.Group();

  // Main screen plane – brighter than gallery for room illumination
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshStandardMaterial({
    map: videoTexture,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: videoTexture,
    emissiveIntensity: 1.2,
    side: THREE.FrontSide,
    toneMapped: false,
  });

  const screen = new THREE.Mesh(geometry, material);
  screen.name = 'theater-screen';
  group.add(screen);

  // Dark bezel frame around the screen
  const bezelGeo = new THREE.PlaneGeometry(width + 0.3, height + 0.3);
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x020204,
    roughness: 0.8,
  });
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.z = -0.03;
  group.add(bezel);

  return group;
}
