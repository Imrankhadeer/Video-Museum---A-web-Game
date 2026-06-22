import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);

    // Player capsule for collision
    // Capsule from Y=0.35 to Y=1.6, radius=0.35
    // Camera syncs to capsule end (Y=1.6 approximately, eye height ~1.7)
    this.playerCollider = new Capsule(
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0, 1.6, 0),
      0.35
    );

    this.worldOctree = new Octree();
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.onFloor = false;
    this.enabled = true;
    this.seated = false; // when player sits on sofa

    // Movement config
    this.SPEED = 8;         // walk speed
    this.SPRINT_SPEED = 14; // sprint speed
    this.JUMP_VELOCITY = 6;
    this.GRAVITY = 25;

    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
    };

    // Head bob
    this.headBobTimer = 0;
    this.headBobIntensity = 0.04; // subtle

    this._setupInputListeners();
  }

  /**
   * Build the collision octree from a THREE.Group (e.g. the museum mesh).
   */
  setCollisionWorld(group) {
    this.worldOctree.fromGraphNode(group);
  }

  lock() {
    this.controls.lock();
  }

  unlock() {
    this.controls.unlock();
  }

  get isLocked() {
    return this.controls.isLocked;
  }

  /**
   * Instantly move the player to `position` and optionally look toward `lookAt`.
   */
  teleportTo(position, lookAt) {
    const capsuleHeight = this.playerCollider.end.y - this.playerCollider.start.y;
    this.playerCollider.start.set(position.x, position.y, position.z);
    this.playerCollider.end.set(position.x, position.y + capsuleHeight, position.z);
    this.velocity.set(0, 0, 0);
    this.camera.position.copy(this.playerCollider.end);
    if (lookAt) {
      this.camera.lookAt(lookAt);
    }
  }

  /**
   * Sit the player down at a seat position, facing a target.
   */
  sitDown(seatPosition, lookAtTarget) {
    this.seated = true;
    this.enabled = false;
    // Position camera slightly above seat
    this.camera.position.set(seatPosition.x, seatPosition.y + 1.0, seatPosition.z);
    this.camera.lookAt(lookAtTarget);
    // Update capsule position to match
    this.playerCollider.start.set(seatPosition.x, seatPosition.y, seatPosition.z);
    this.playerCollider.end.set(seatPosition.x, seatPosition.y + 1.2, seatPosition.z);
    this.velocity.set(0, 0, 0);
  }

  /**
   * Stand the player back up from a seated position.
   */
  standUp() {
    this.seated = false;
    this.enabled = true;
    // Move player back slightly from seated position
    const pos = this.playerCollider.end.clone();
    pos.z += 1.5; // step back from sofa
    this.playerCollider.start.set(pos.x, 0.35, pos.z);
    this.playerCollider.end.set(pos.x, 1.6, pos.z);
    this.camera.position.copy(this.playerCollider.end);
  }

  /**
   * Return the current eye-level position (capsule end).
   */
  getPosition() {
    return this.playerCollider.end.clone();
  }

  /**
   * Return true if any movement key is currently pressed and the controller is enabled.
   */
  isMoving() {
    if (!this.enabled) return false;
    return (
      this.keys.forward ||
      this.keys.backward ||
      this.keys.left ||
      this.keys.right
    );
  }

  /**
   * Main update loop – call once per frame.
   */
  update(deltaTime) {
    if (!this.enabled || this.seated) return;

    // Clamp deltaTime to prevent huge jumps (e.g. after tab switch)
    const dt = Math.min(deltaTime, 0.05);

    // 1. Apply gravity
    if (!this.onFloor) {
      this.velocity.y -= this.GRAVITY * dt;
    }

    // 2. Calculate movement direction from keys
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, this.camera.up).normalize();

    this.direction.set(0, 0, 0);
    if (this.keys.forward) this.direction.add(forward);
    if (this.keys.backward) this.direction.sub(forward);
    if (this.keys.right) this.direction.add(right);
    if (this.keys.left) this.direction.sub(right);

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();
    }

    const speed = this.keys.sprint ? this.SPRINT_SPEED : this.SPEED;

    // Apply acceleration in movement direction
    this.velocity.x += this.direction.x * speed * dt;
    this.velocity.z += this.direction.z * speed * dt;

    // Horizontal damping (deceleration) when on floor
    if (this.onFloor) {
      const damping = Math.pow(0.0001, dt);
      this.velocity.x *= damping;
      this.velocity.z *= damping;
    }

    // 3. Move the capsule
    const moveVector = this.velocity.clone().multiplyScalar(dt);
    this.playerCollider.translate(moveVector);

    // 4. Collision detection with Octree
    const result = this.worldOctree.capsuleIntersect(this.playerCollider);
    this.onFloor = false;

    if (result) {
      this.onFloor = result.normal.y > 0.5;

      if (!this.onFloor) {
        // Wall collision – remove velocity component going into the wall
        this.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.velocity)
        );
      } else {
        // Floor collision – zero out downward velocity
        this.velocity.y = 0;
      }

      // Push capsule out of collision
      this.playerCollider.translate(
        result.normal.multiplyScalar(result.depth)
      );
    }

    // 5. Teleport back to spawn if fallen below Y=-20
    if (this.playerCollider.end.y < -20) {
      this.teleportTo(new THREE.Vector3(0, 1.7, -3));
    }

    // 6. Sync camera to capsule end position
    this.camera.position.copy(this.playerCollider.end);

    // 7. Head bob when walking on floor
    if (this.onFloor && this.isMoving()) {
      const bobSpeed = this.keys.sprint ? 14 : 10;
      this.headBobTimer += dt * bobSpeed;
      this.camera.position.y += Math.sin(this.headBobTimer) * this.headBobIntensity;
    } else {
      // Gradually reset head bob timer so the bob doesn't start at a random phase
      this.headBobTimer = 0;
    }
  }

  /**
   * Wire up keyboard listeners for movement, sprint, and jump.
   */
  _setupInputListeners() {
    const onKeyDown = (event) => {
      this.keys.sprint = event.shiftKey;
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'Space':
          if (this.onFloor && this.enabled) {
            this.velocity.y = this.JUMP_VELOCITY;
          }
          this.keys.jump = true;
          break;
      }
    };

    const onKeyUp = (event) => {
      this.keys.sprint = event.shiftKey;
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Store references so they can be removed if needed
    this._onKeyDown = onKeyDown;
    this._onKeyUp = onKeyUp;
  }

  /**
   * Clean up event listeners.
   */
  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    this.controls.dispose();
  }
}
