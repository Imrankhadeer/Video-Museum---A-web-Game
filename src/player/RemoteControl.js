import * as THREE from 'three';

export class RemoteControl {
  constructor() {
    this.group = new THREE.Group();
    this.buttons = {};
    
    this._buildModel();
  }

  _buildModel() {
    // Main body of the remote
    const bodyGeo = new THREE.BoxGeometry(0.06, 0.02, 0.16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    // Sensor at the front
    const sensorGeo = new THREE.BoxGeometry(0.03, 0.01, 0.005);
    const sensorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 });
    const sensor = new THREE.Mesh(sensorGeo, sensorMat);
    sensor.position.set(0, 0, -0.08); // Front face (-Z is forward usually)
    this.group.add(sensor);

    // Common button geometry
    const btnGeo = new THREE.BoxGeometry(0.015, 0.005, 0.015);
    const playBtnGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.005, 16);

    // Play/Pause button (Red)
    const playMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.6 });
    const playBtn = new THREE.Mesh(playBtnGeo, playMat);
    playBtn.position.set(0, 0.01, -0.04);
    this.group.add(playBtn);
    this.buttons.play = playBtn;

    // Fast Forward button (Blue)
    const ffMat = new THREE.MeshStandardMaterial({ color: 0x3498db, roughness: 0.6 });
    const ffBtn = new THREE.Mesh(btnGeo, ffMat);
    ffBtn.position.set(0.015, 0.01, -0.01);
    this.group.add(ffBtn);
    this.buttons.ff = ffBtn;

    // Rewind button (Blue)
    const rwBtn = new THREE.Mesh(btnGeo, ffMat);
    rwBtn.position.set(-0.015, 0.01, -0.01);
    this.group.add(rwBtn);
    this.buttons.rw = rwBtn;

    // Mute button (Yellow)
    const muteMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.6 });
    const muteBtn = new THREE.Mesh(btnGeo, muteMat);
    muteBtn.position.set(0, 0.01, 0.02);
    this.group.add(muteBtn);
    this.buttons.mute = muteBtn;
  }

  /**
   * Animates a specific button pressing down briefly.
   * @param {string} action - 'play', 'ff', 'rw', or 'mute'
   */
  animateButtonPress(action) {
    const btn = this.buttons[action];
    if (!btn) return;

    const originalY = 0.01;
    btn.position.y = 0.007; // push in slightly

    // Small recoil animation for the whole remote
    const origZ = this.group.position.z;
    this.group.position.z += 0.01;

    setTimeout(() => {
      btn.position.y = originalY;
      this.group.position.z = origZ;
    }, 150);
  }
}
