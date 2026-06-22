import * as THREE from 'three';

export class VideoManager {
  constructor(videoConfigs) {
    // videoConfigs: Array of { url: string, title: string }
    this.configs = videoConfigs;
    this.videos = [];    // HTMLVideoElement[]
    this.textures = [];  // THREE.VideoTexture[]
    this.ready = false;

    // Lazy-initialized canvas for average-color sampling
    this._sampleCanvas = null;
    this._sampleCtx = null;
  }

  /**
   * Create all <video> elements and corresponding VideoTextures.
   * Call once during setup.
   */
  init() {
    this.configs.forEach((config) => {
      const video = document.createElement('video');
      video.src = config.url;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.style.display = 'none';
      document.body.appendChild(video);

      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      this.videos.push(video);
      this.textures.push(texture);
    });

    this.ready = true;
  }

  /**
   * Dynamically change the source of a video screen.
   * @param {number} index - Index of the video configuration / screen.
   * @param {string} sourceUrl - The new source URL or Object URL.
   * @param {string} [title] - Optional new title.
   */
  changeVideoSource(index, sourceUrl, title) {
    const video = this.videos[index];
    if (!video) return;

    if (title && this.configs[index]) {
      this.configs[index].title = title;
    }

    video.srcObject = null; // Clear any active WebRTC streams
    video.src = sourceUrl;
    video.load();
    video.play().catch(() => {});
  }

  /**
   * Dynamically replace the screen video source with a live WebRTC MediaStream.
   */
  setVideoStream(index, stream, title) {
    const video = this.videos[index];
    if (!video) return;

    if (title && this.configs[index]) {
      this.configs[index].title = title;
    }

    video.removeAttribute('src'); // Clear regular source
    video.srcObject = stream;
    video.play().catch(() => {});
  }

  /**
   * Capture and return the MediaStream from a local video element.
   */
  getStream(index) {
    const video = this.videos[index];
    if (!video) return null;
    
    // Support standard and Firefox-specific methods
    if (typeof video.captureStream === 'function') {
      return video.captureStream();
    } else if (typeof video.mozCaptureStream === 'function') {
      return video.mozCaptureStream();
    }
    return null;
  }

  /**
   * Return the VideoTexture at the given index, or null.
   */
  getTexture(index) {
    return this.textures[index] || null;
  }

  /**
   * Return the HTMLVideoElement at the given index, or null.
   */
  getVideo(index) {
    return this.videos[index] || null;
  }

  /**
   * Start playback on every video (muted by default so autoplay is allowed).
   */
  playAll() {
    this.videos.forEach((v) => v.play().catch(() => {}));
  }

  /**
   * Pause every video.
   */
  pauseAll() {
    this.videos.forEach((v) => v.pause());
  }

  /**
   * Mute every video.
   */
  muteAll() {
    this.videos.forEach((v) => {
      v.muted = true;
    });
  }

  /**
   * Unmute every video.
   */
  unmuteAll() {
    this.videos.forEach((v) => {
      v.muted = false;
    });
  }

  /**
   * Toggle play/pause for a single video by index.
   */
  togglePlayPause(index) {
    const video = this.videos[index];
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  /**
   * Seek forward or backward by a number of seconds.
   */
  seekVideo(index, seconds) {
    const video = this.videos[index];
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime + seconds);
  }

  /**
   * Extract the current playback state of all videos (for Master Clock syncing).
   */
  getVideoStates() {
    return this.videos.map((v, i) => ({
      index: i,
      url: v.src,
      currentTime: v.currentTime,
      paused: v.paused,
      muted: v.muted,
      title: this.configs[i]?.title || 'Video',
      hasStream: !!v.srcObject
    }));
  }

  /**
   * Force local videos to match a provided remote state (for Master Clock syncing).
   */
  syncVideoState(states) {
    if (!states || !Array.isArray(states)) return;
    states.forEach(state => {
      const v = this.videos[state.index];
      if (!v) return;

      if (state.title && this.configs[state.index]) {
        this.configs[state.index].title = state.title;
      }

      // 1. Sync URL (only if it's a valid remote URL and not currently using a P2P stream)
      if (state.url && state.url.startsWith('http') && !v.srcObject && !state.hasStream) {
        // Simple check to avoid reloading the same video over and over
        if (v.src !== state.url && !v.src.endsWith(state.url)) {
          v.src = state.url;
          v.load();
        }
      }

      // 2. Sync Time (Anti-Drift): Snap time if off by more than 1 second
      if (typeof state.currentTime === 'number' && Math.abs(v.currentTime - state.currentTime) > 1.0) {
        v.currentTime = state.currentTime;
      }

      // 3. Sync Play/Pause
      if (state.paused === true && !v.paused) {
        v.pause();
      } else if (state.paused === false && v.paused) {
        v.play().catch(() => {});
      }

      // 4. Sync Mute
      if (state.muted !== undefined) {
        v.muted = state.muted;
      }
    });
  }

  /**
   * Toggle mute state for a single video.
   */
  toggleMute(index) {
    const video = this.videos[index];
    if (!video) return;
    video.muted = !video.muted;
  }

  /**
   * Adjust each video's volume based on the player's distance to its screen.
   * @param {THREE.Vector3} playerPosition - Current player position.
   * @param {THREE.Vector3[]} screenPositions - World positions of each screen, indexed to match videos.
   */
  updateProximityAudio(playerPosition, screenPositions) {
    const maxDist = 8; // start hearing at 8 m
    const minDist = 1; // full volume at 1 m

    screenPositions.forEach((pos, i) => {
      if (!this.videos[i] || !pos) return;

      const dist = playerPosition.distanceTo(pos);

      if (dist > maxDist) {
        this.videos[i].volume = 0;
      } else if (dist < minDist) {
        this.videos[i].volume = 1;
      } else {
        this.videos[i].volume = 1 - (dist - minDist) / (maxDist - minDist);
      }
    });
  }

  /**
   * Sample the current video frame and return the average colour as a THREE.Color.
   * Useful for driving dynamic room lighting in the theater.
   * @param {number} index - Video index to sample.
   * @returns {THREE.Color}
   */
  getAverageColor(index) {
    const video = this.videos[index];
    if (!video || video.readyState < 2) {
      return new THREE.Color(0.1, 0.1, 0.15);
    }

    // Lazy-create a tiny offscreen canvas for sampling
    if (!this._sampleCanvas) {
      this._sampleCanvas = document.createElement('canvas');
      this._sampleCanvas.width = 8;
      this._sampleCanvas.height = 8;
      this._sampleCtx = this._sampleCanvas.getContext('2d', {
        willReadFrequently: true,
      });
    }

    try {
      this._sampleCtx.drawImage(video, 0, 0, 8, 8);
      const data = this._sampleCtx.getImageData(0, 0, 8, 8).data;
      let r = 0;
      let g = 0;
      let b = 0;
      const pixelCount = 64; // 8×8
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      return new THREE.Color(
        r / pixelCount / 255,
        g / pixelCount / 255,
        b / pixelCount / 255
      );
    } catch {
      return new THREE.Color(0.1, 0.1, 0.15);
    }
  }

  /**
   * Clean up: pause all videos and remove them from the DOM.
   */
  dispose() {
    this.pauseAll();
    this.videos.forEach((v) => {
      if (v.parentNode) v.parentNode.removeChild(v);
    });
    this.textures.forEach((t) => t.dispose());
    this.videos = [];
    this.textures = [];
    this.ready = false;
  }
}
