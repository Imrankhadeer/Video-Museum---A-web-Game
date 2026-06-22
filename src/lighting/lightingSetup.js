import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

export function setupLighting(scene) {
  // MUST initialize RectAreaLight uniforms
  RectAreaLightUniformsLib.init();

  // === GLOBAL AMBIENT ===
  const ambient = new THREE.AmbientLight(0x151520, 4.0);
  scene.add(ambient);

  // === LOBBY (Z: 0 to -12) ===
  // Warm overhead lights
  const lobbyLight1 = new THREE.PointLight(0xffeedd, 30, 15);
  lobbyLight1.position.set(0, 4.5, -3);
  lobbyLight1.castShadow = true;
  lobbyLight1.shadow.mapSize.set(512, 512);
  scene.add(lobbyLight1);

  const lobbyLight2 = new THREE.PointLight(0xffeedd, 25, 15);
  lobbyLight2.position.set(0, 4.5, -9);
  lobbyLight2.castShadow = true;
  lobbyLight2.shadow.mapSize.set(512, 512);
  scene.add(lobbyLight2);

  // Accent lights on welcome sign
  const signLight = new THREE.SpotLight(0xd4a853, 40, 8, Math.PI / 6, 0.5);
  signLight.position.set(0, 4.8, -2);
  signLight.target.position.set(0, 3.2, 0);
  scene.add(signLight);
  scene.add(signLight.target);

  // === GALLERY HALL (Z: -12 to -36) ===
  // Spot lights aimed at each screen position (8 screens)
  const galleryScreenZPositions = [-16, -21, -26, -31];

  galleryScreenZPositions.forEach(z => {
    // Left wall screen spotlights
    const leftSpot = new THREE.SpotLight(0xeeeeff, 30, 10, Math.PI / 5, 0.6);
    leftSpot.position.set(-5, 4.5, z);
    leftSpot.target.position.set(-8, 2.5, z);
    scene.add(leftSpot);
    scene.add(leftSpot.target);

    // Right wall screen spotlights
    const rightSpot = new THREE.SpotLight(0xeeeeff, 30, 10, Math.PI / 5, 0.6);
    rightSpot.position.set(5, 4.5, z);
    rightSpot.target.position.set(8, 2.5, z);
    scene.add(rightSpot);
    scene.add(rightSpot.target);
  });

  // Subtle overhead gallery lights
  for (let z = -14; z > -36; z -= 6) {
    const galleryOverhead = new THREE.PointLight(0xdddde8, 10, 10);
    galleryOverhead.position.set(0, 4.8, z);
    scene.add(galleryOverhead);
  }

  // === CORRIDOR (Z: -36 to -46) ===
  // Moody accent lighting
  const corridorLight1 = new THREE.PointLight(0x6644aa, 15, 8);
  corridorLight1.position.set(0, 3.5, -39);
  scene.add(corridorLight1);

  const corridorLight2 = new THREE.PointLight(0x4466bb, 12, 8);
  corridorLight2.position.set(0, 3.5, -43);
  scene.add(corridorLight2);

  // === THEATER (Z: -46 to -66) ===
  // RectAreaLight at the screen position to illuminate the room
  // Screen is at position(0, 4.375, -65.7), 12m wide × 6.75m tall
  const theaterRectLight = new THREE.RectAreaLight(0xaabbcc, 15, 12, 6.75);
  theaterRectLight.position.set(0, 4.375, -65.5);
  theaterRectLight.lookAt(0, 4.375, -56); // face toward audience
  scene.add(theaterRectLight);

  // Very dim ambient in theater so it's not pitch black
  const theaterAmbient = new THREE.PointLight(0x111122, 0.3, 25);
  theaterAmbient.position.set(0, 6, -56);
  scene.add(theaterAmbient);

  return {
    theaterRectLight, // for dynamic color updates
    // Update function to sync theater light color with video
    updateTheaterLight(color) {
      // color: THREE.Color - average color from video frame
      theaterRectLight.color.copy(color);
      theaterRectLight.intensity = 5 + color.getHSL({}).l * 15; // brighter for bright scenes
    },
  };
}
