import * as THREE from 'three';

/**
 * MUSEUM EXTENSIONS
 * Use this module to add custom 3D props, models, and lighting setups to the museum.
 */
export class MuseumExtensions {
  /**
   * Initialize custom extensions and inject them into the scene.
   * @param {THREE.Scene} scene - The main Three.js scene.
   * @param {THREE.Group} collisionWorld - The main museum group used for player collision.
   */
  static init(scene, collisionWorld) {
    console.log('Initializing custom museum extensions...');

    // Add your custom props and lights here
    this.addCustomLights(scene);
    this.addCustomProps(scene, collisionWorld);
  }

  /**
   * Template: Add custom point lights, spotlights, or ambient glows.
   */
  static addCustomLights(scene) {
    // Example: A warm glowing spotlight above the main theater entrance (Z = -46)
    const entranceSpot = new THREE.SpotLight(0xf5d98f, 15, 8, Math.PI / 4, 0.5, 1);
    entranceSpot.position.set(0, 4.5, -45); // just above door height (4m)
    entranceSpot.target.position.set(0, 0, -46); // point at floor/door
    
    // Enable shadows for the light if desired (optional, high performance cost)
    entranceSpot.castShadow = true;
    entranceSpot.shadow.bias = -0.002;
    entranceSpot.shadow.mapSize.width = 512;
    entranceSpot.shadow.mapSize.height = 512;

    scene.add(entranceSpot);
    scene.add(entranceSpot.target);

    // Example: A decorative color wash in the corridor (X = 0, Z = -41)
    const washLight = new THREE.PointLight(0xd4a853, 5, 6);
    washLight.position.set(0, 3.5, -41);
    scene.add(washLight);
  }

  /**
   * Template: Add custom 3D geometries or import GLTF models.
   */
  static addCustomProps(scene, collisionWorld) {
    // Example: Adding a decorative pedestal at the center of the lobby
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0, -6); // Center of Lobby (Z ranges 0 to -12)

    // Pedestal base
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x12121e, roughness: 0.4, metalness: 0.8 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.1; // Sits on floor
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    pedestalGroup.add(baseMesh);

    // Pedestal shaft
    const shaftGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, baseMat);
    shaftMesh.position.y = 0.8; // sits on base
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    pedestalGroup.add(shaftMesh);

    // Glowing art piece on top (Torus knot)
    const artGeo = new THREE.TorusKnotGeometry(0.25, 0.08, 64, 8);
    const artMat = new THREE.MeshStandardMaterial({
      color: 0xd4a853,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0xd4a853,
      emissiveIntensity: 0.4
    });
    const artMesh = new THREE.Mesh(artGeo, artMat);
    artMesh.position.y = 1.6; // sits on top of pedestal
    artMesh.castShadow = true;
    pedestalGroup.add(artMesh);

    // Make the art piece spin in the animation loop
    this.spinningProp = artMesh;

    // Add pedestal group to scene
    scene.add(pedestalGroup);

    // CRITICAL: Add props to the collisionWorld so the player cannot walk through them
    collisionWorld.add(pedestalGroup);

    // -------------------------------------------------------------
    // HOW TO LOAD EXTERNAL 3D GLTF MODELS:
    // If you want to load a custom .gltf or .glb model, use GLTFLoader:
    //
    // import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    // const loader = new GLTFLoader();
    // loader.load('/models/my_statue.glb', (gltf) => {
    //   const model = gltf.scene;
    //   model.position.set(0, 0, -8);
    //   model.scale.set(1.5, 1.5, 1.5);
    //   scene.add(model);
    //   collisionWorld.add(model); // adds physical collision support!
    // });
    // -------------------------------------------------------------
  }

  /**
   * Called inside the main animate() loop.
   */
  static update(deltaTime) {
    if (this.spinningProp) {
      this.spinningProp.rotation.y += deltaTime * 0.5;
      this.spinningProp.rotation.x += deltaTime * 0.2;
    }
  }
}
