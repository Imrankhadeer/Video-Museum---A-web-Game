import * as THREE from 'three';

export class InteractionSystem {
  constructor(camera, playerController) {
    this.camera = camera;
    this.playerController = playerController;
    this.zones = [];       // interaction zones
    this.activeZone = null; // currently active zone
    this._onInteract = null;

    // Listen for E key to trigger interaction
    this._onKeyDown = (e) => {
      if (e.code === 'KeyE' && this.activeZone) {
        this.activeZone.callback();
      }
    };

    document.addEventListener('keydown', this._onKeyDown);
  }

  /**
   * Register an interaction zone.
   * @param {string} id - Unique identifier for this zone.
   * @param {THREE.Vector3} position - World-space center of the zone.
   * @param {number} radius - Detection radius in world units.
   * @param {string} promptText - UI prompt shown when the player is in range (e.g. "Press E to sit").
   * @param {Function} callback - Function invoked when the player presses E inside this zone.
   */
  addZone(id, position, radius, promptText, callback) {
    this.zones.push({ id, position, radius, promptText, callback, active: true });
  }

  /**
   * Remove a zone by its id.
   */
  removeZone(id) {
    this.zones = this.zones.filter((z) => z.id !== id);
    if (this.activeZone && this.activeZone.id === id) {
      this.activeZone = null;
    }
  }

  /**
   * Enable or disable a zone without removing it.
   */
  setZoneActive(id, active) {
    const zone = this.zones.find((z) => z.id === id);
    if (zone) {
      zone.active = active;
      // If we just deactivated the currently-active zone, clear it
      if (!active && this.activeZone && this.activeZone.id === id) {
        this.activeZone = null;
      }
    }
  }

  /**
   * Call once per frame. Returns the prompt text of the closest in-range zone, or null.
   */
  update() {
    const playerPos = this.playerController.getPosition();

    let closest = null;
    let closestDist = Infinity;

    for (const zone of this.zones) {
      if (!zone.active) continue;

      const dist = playerPos.distanceTo(zone.position);
      if (dist < zone.radius && dist < closestDist) {
        closest = zone;
        closestDist = dist;
      }
    }

    this.activeZone = closest;
    return closest ? closest.promptText : null;
  }

  /**
   * Clean up event listeners.
   */
  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
  }
}
