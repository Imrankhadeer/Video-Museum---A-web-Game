import * as THREE from 'three';

export class MultiplayerManager {
  /**
   * @param {THREE.Scene} scene - The Three.js scene to add remote players to.
   * @param {PlayerController} playerController - Local player controller.
   * @param {VideoManager} videoManager - Local video manager.
   * @param {MenuScreen} menuScreen - UI Menu.
   */
  constructor(scene, playerController, videoManager, menuScreen) {
    this.scene = scene;
    this.playerController = playerController;
    this.videoManager = videoManager;
    this.menuScreen = menuScreen;

    this.peer = null;
    this.connections = {}; // peerId -> DataConnection
    this.remotePlayers = {}; // peerId -> { mesh, sprite, targetPos, targetRot, username }

    this.isHost = false;
    this.roomCode = null;
    this.peerId = null;

    this.lastUpdateTime = 0;
    this.updateInterval = 0.04; // send position ~25 times/sec

    // Unique username for this session
    this.username = 'Player_' + Math.floor(Math.random() * 900 + 100);

    // Setup room status HUD elements
    this.statusPanel = document.getElementById('room-status-badge');
    this.statusText = document.getElementById('room-status-text');
    this.copyBtn = document.getElementById('copy-room-link-btn');

    this._setupHUDListeners();
  }

  _setupHUDListeners() {
    this.copyBtn.addEventListener('click', () => {
      const inviteUrl = `${window.location.origin}/?room=${this.roomCode}`;
      navigator.clipboard.writeText(inviteUrl).then(() => {
        const origText = this.copyBtn.textContent;
        this.copyBtn.textContent = 'Copied!';
        setTimeout(() => this.copyBtn.textContent = origText, 1500);
      });
    });
  }

  /**
   * Initialize as host. Creates a room with a random 4-letter code.
   */
  hostRoom() {
    const code = this._generateCode();
    this.roomCode = code;
    this.isHost = true;
    this.peerId = `museum-room-${code}`;

    console.log(`Starting host peer with ID: ${this.peerId}`);
    
    // Check if Peer constructor is loaded from CDN
    const Peer = window.Peer || null;
    if (!Peer) {
      alert('Network error: PeerJS library failed to load.');
      return;
    }

    this.peer = new Peer(this.peerId);

    this.peer.on('open', (id) => {
      console.log(`Successfully hosting room! Code: ${code}`);
      this._showRoomHUD();
    });

    this.peer.on('connection', (conn) => {
      console.log(`Guest connected: ${conn.peer}`);
      this._setupConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      if (err.type === 'unavailable-id') {
        alert('Room code already in use. Please try hosting again.');
      }
    });
  }

  /**
   * Initialize as guest. Connects to the host.
   */
  joinRoom(code) {
    this.roomCode = code.toUpperCase();
    this.isHost = false;
    this.peerId = `museum-guest-${Math.floor(Math.random() * 10000)}`;

    const Peer = window.Peer || null;
    if (!Peer) {
      alert('Network error: PeerJS library failed to load.');
      return;
    }

    this.peer = new Peer(this.peerId);

    this.peer.on('open', (id) => {
      console.log(`Connecting to room ${this.roomCode}...`);
      const conn = this.peer.connect(`museum-room-${this.roomCode}`);
      this._setupConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS connection error:', err);
      alert(`Could not connect to room: ${this.roomCode}. Please check code and try again.`);
    });
  }

  _setupConnection(conn) {
    const peerId = conn.peer;
    this.connections[peerId] = conn;

    conn.on('open', () => {
      console.log(`Connection established with ${peerId}`);
      // Send initial handshake with our username
      conn.send({
        type: 'handshake',
        username: this.username,
      });

      if (!this.isHost) {
        this._showRoomHUD();
      }
    });

    conn.on('data', (data) => {
      this._handleNetworkMessage(peerId, data);
    });

    conn.on('close', () => {
      console.log(`Connection closed with ${peerId}`);
      this._removeRemotePlayer(peerId);
      delete this.connections[peerId];
    });

    conn.on('error', (err) => {
      console.error(`Connection error on ${peerId}:`, err);
      this._removeRemotePlayer(peerId);
      delete this.connections[peerId];
    });
  }

  _handleNetworkMessage(senderPeerId, data) {
    switch (data.type) {
      case 'handshake':
        // Store username and reply with ours
        if (!this.remotePlayers[senderPeerId]) {
          this._createRemotePlayer(senderPeerId, data.username);
        }
        if (this.isHost) {
          // Tell all guests about all other active connections
          Object.keys(this.connections).forEach((guestId) => {
            if (guestId !== senderPeerId) {
              this.connections[guestId].send({
                type: 'peer_joined',
                peerId: senderPeerId,
                username: data.username,
              });
            }
          });
        }
        break;

      case 'peer_joined':
        // A new guest joined (relayed by Host)
        this._createRemotePlayer(data.peerId, data.username);
        break;

      case 'pos':
        // Update peer position
        const rp = this.remotePlayers[senderPeerId];
        if (rp) {
          rp.targetPos.set(data.pos.x, data.pos.y, data.pos.z);
          rp.targetRot.set(data.rot.x, data.rot.y, data.rot.z);
          rp.isSprinting = data.sprint;
        }

        // Relay position if Host
        if (this.isHost) {
          Object.keys(this.connections).forEach((guestId) => {
            if (guestId !== senderPeerId) {
              this.connections[guestId].send({
                type: 'pos',
                peerId: senderPeerId,
                pos: data.pos,
                rot: data.rot,
                sprint: data.sprint,
              });
            }
          });
        }
        break;

      case 'video':
        // Update screen video source
        this.videoManager.changeVideoSource(data.index, data.url, data.title);
        
        // Sync tile title in video manager UI if it is active
        const tile = document.querySelector(`.screen-tile[data-index="${data.index}"]`);
        if (tile) {
          tile.classList.add('custom-src');
          const titleEl = tile.querySelector('.screen-tile-title');
          const statusEl = tile.querySelector('.screen-tile-status');
          if (titleEl) titleEl.textContent = data.title;
          if (statusEl) statusEl.textContent = 'Custom';
        }

        // Relay video if Host
        if (this.isHost) {
          Object.keys(this.connections).forEach((guestId) => {
            if (guestId !== senderPeerId) {
              this.connections[guestId].send(data);
            }
          });
        }
        break;
    }
  }

  /**
   * Broadcast a video source change to other players.
   */
  broadcastVideoChange(index, url, title) {
    const payload = {
      type: 'video',
      index,
      url,
      title,
    };

    Object.values(this.connections).forEach((conn) => {
      if (conn.open) conn.send(payload);
    });
  }

  /**
   * Main logic update loop (position sending and remote interpolation).
   */
  update(deltaTime) {
    // 1. Send our position to connected peers at throttled intervals
    this.lastUpdateTime += deltaTime;
    if (this.lastUpdateTime >= this.updateInterval) {
      this.lastUpdateTime = 0;
      this._broadcastLocalPosition();
    }

    // 2. Smoothly interpolate other player avatars in the 3D scene
    Object.values(this.remotePlayers).forEach((rp) => {
      // Lerp position (smooth slide)
      rp.mesh.position.lerp(rp.targetPos, 0.15);
      
      // Interpolate rotation (smooth spin)
      // Make avatar look direction match target rotation
      const rotSpeed = rp.isSprinting ? 22 : 12;
      rp.mesh.rotation.y += (rp.targetRot.y - rp.mesh.rotation.y) * 0.25;

      // Subtle bobbing when moving
      const isMoving = rp.mesh.position.distanceTo(rp.targetPos) > 0.05;
      if (isMoving) {
        rp.bobTimer = (rp.bobTimer || 0) + deltaTime * rotSpeed;
        rp.mesh.position.y += Math.sin(rp.bobTimer) * 0.015;
      }
    });
  }

  _broadcastLocalPosition() {
    if (Object.keys(this.connections).length === 0) return;

    const pos = this.playerController.getPosition();
    // Subtly offset Y to represent correct visual standing avatar feet on floor
    pos.y -= 1.0; 

    // We can extract camera rotation.y to align avatar facing direction
    const rot = {
      x: 0,
      y: this.playerController.camera.rotation.y,
      z: 0,
    };

    const payload = {
      type: 'pos',
      pos: { x: pos.x, y: pos.y, z: pos.z },
      rot: rot,
      sprint: this.playerController.keys.sprint,
    };

    Object.values(this.connections).forEach((conn) => {
      if (conn.open) {
        conn.send(payload);
      }
    });
  }

  _createRemotePlayer(peerId, name) {
    if (this.remotePlayers[peerId]) return;

    console.log(`Creating 3D avatar for player: ${name} (${peerId})`);

    // Create a stylish futuristic player avatar
    const group = new THREE.Group();

    // Body capsule/cylinder
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.4, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xd4a853,
      emissiveIntensity: 0.1,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.7;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Glowing futuristic goggles / visor
    const visorGeo = new THREE.BoxGeometry(0.42, 0.15, 0.3);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xd4a853,
      emissive: 0xd4a853,
      emissiveIntensity: 1.5,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 1.15, 0.2); // front head area
    group.add(visorMesh);

    // Head sphere
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.y = 1.15;
    group.add(headMesh);

    // Add player name tag floating above head
    const nameTag = this._createNameTag(name);
    nameTag.position.set(0, 1.7, 0);
    group.add(nameTag);

    this.scene.add(group);

    this.remotePlayers[peerId] = {
      mesh: group,
      sprite: nameTag,
      targetPos: new THREE.Vector3(0, 0, 0),
      targetRot: new THREE.Vector3(0, 0, 0),
      isSprinting: false,
      username: name,
      bobTimer: 0,
    };
  }

  _removeRemotePlayer(peerId) {
    const rp = this.remotePlayers[peerId];
    if (rp) {
      console.log(`Removing player: ${rp.username}`);
      this.scene.remove(rp.mesh);
      delete this.remotePlayers[peerId];
    }
  }

  _createNameTag(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Rounded rectangle background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(10, 5, 236, 50, 15);
    ctx.fill();

    // Golden border
    ctx.strokeStyle = '#d4a853';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 5, 236, 50, 15);
    ctx.stroke();

    // Text label
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = '#eeeef5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 30);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.5, 0.375, 1);
    return sprite;
  }

  _showRoomHUD() {
    this.statusPanel.classList.remove('hidden');
    this.statusText.textContent = `Room: ${this.roomCode}`;
  }

  _generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude confusing chars like I, O, 1, 0
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  dispose() {
    if (this.peer) {
      this.peer.destroy();
    }
    Object.values(this.remotePlayers).forEach((rp) => {
      this.scene.remove(rp.mesh);
    });
    this.remotePlayers = {};
    this.connections = {};
    this.statusPanel.classList.add('hidden');
  }
}
