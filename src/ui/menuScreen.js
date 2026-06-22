export class MenuScreen {
  constructor() {
    this.startScreen = document.getElementById('start-screen');
    this.pauseMenu = document.getElementById('pause-menu');
    this.startButton = document.getElementById('start-button');
    this.resumeBtn = document.getElementById('resume-btn');
    this.muteAllBtn = document.getElementById('mute-all-btn');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');

    // Video manager elements
    this.manageVideosBtn = document.getElementById('manage-videos-btn');
    this.videoManagerPanel = document.getElementById('video-manager-panel');
    this.pauseMainContent = document.getElementById('pause-main-content');
    this.videoManagerBackBtn = document.getElementById('video-manager-back-btn');

    // Screen Editor popup elements
    this.screenEditorModal = document.getElementById('screen-editor-modal');
    this.editorScreenTitle = document.getElementById('editor-screen-title');
    this.editorVideoUrl = document.getElementById('editor-video-url');
    this.editorVideoFile = document.getElementById('editor-video-file');
    this.editorFileStatus = document.getElementById('editor-file-status');
    this.editorApplyBtn = document.getElementById('editor-apply-btn');
    this.editorCancelBtn = document.getElementById('editor-cancel-btn');

    // Multiplayer elements
    this.mpHostBtn = document.getElementById('mp-host-btn');
    this.mpJoinBtn = document.getElementById('mp-join-btn');
    this.mpRoomInput = document.getElementById('mp-room-input');

    this._onStart = null;
    this._onResume = null;
    this._onMuteAll = null;
    this._onVideoChange = null;
    
    // Multiplayer callbacks
    this._onHostRoom = null;
    this._onJoinRoom = null;

    this._isMuted = false;
    this._activeEditIndex = -1;
    this._pendingFile = null;

    this._setupListeners();
  }

  _setupListeners() {
    this.startButton.addEventListener('click', () => {
      if (this._onStart) this._onStart();
    });

    // Multiplayer Buttons
    this.mpHostBtn.addEventListener('click', () => {
      if (this._onHostRoom) this._onHostRoom();
    });

    this.mpJoinBtn.addEventListener('click', () => {
      const code = this.mpRoomInput.value.trim().toUpperCase();
      if (code && this._onJoinRoom) {
        this._onJoinRoom(code);
      } else if (!code) {
        this.mpRoomInput.style.borderColor = 'rgba(255,0,0,0.5)';
        setTimeout(() => this.mpRoomInput.style.borderColor = 'var(--color-glass-border)', 1500);
      }
    });

    this.resumeBtn.addEventListener('click', () => {
      if (this._onResume) this._onResume();
    });

    this.muteAllBtn.addEventListener('click', () => {
      this._isMuted = !this._isMuted;
      this.muteAllBtn.textContent = this._isMuted ? 'Unmute All Videos' : 'Mute All Videos';
      if (this._onMuteAll) this._onMuteAll(this._isMuted);
    });

    this.fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Toggle manager panels
    this.manageVideosBtn.addEventListener('click', () => {
      this.pauseMainContent.classList.add('hidden');
      this.videoManagerPanel.classList.remove('hidden');
    });

    this.videoManagerBackBtn.addEventListener('click', () => {
      this.videoManagerPanel.classList.add('hidden');
      this.pauseMainContent.classList.remove('hidden');
    });

    // Handle screen tile clicks to configure a specific screen
    const tiles = this.videoManagerPanel.querySelectorAll('.screen-tile');
    tiles.forEach((tile) => {
      tile.addEventListener('click', (e) => {
        // Prevent trigger if clicking configure button directly or anything inside
        const index = parseInt(tile.getAttribute('data-index'), 10);
        this._openEditor(index, tile);
      });
    });

    // Editor Modal actions
    this.editorVideoFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this._pendingFile = file;
        this.editorFileStatus.textContent = `Selected: ${file.name}`;
        this.editorVideoUrl.value = ''; // Clear URL if file selected
      }
    });

    this.editorApplyBtn.addEventListener('click', () => {
      console.log('Apply clicked. Active index:', this._activeEditIndex);
      if (this._activeEditIndex === -1) {
        console.warn('No active screen index selected for edit.');
        return;
      }

      const urlVal = this.editorVideoUrl.value.trim();
      const fileVal = this._pendingFile;
      console.log('Values to apply:', { urlVal, fileVal });

      try {
        if (urlVal || fileVal) {
          // Trigger callback
          if (this._onVideoChange) {
            console.log('Triggering onVideoChange callback...');
            this._onVideoChange(this._activeEditIndex, urlVal || null, fileVal || null);
          }

          // Update UI state in the tile
          const tile = this.videoManagerPanel.querySelector(`.screen-tile[data-index="${this._activeEditIndex}"]`);
          if (tile) {
            tile.classList.add('custom-src');
            const titleEl = tile.querySelector('.screen-tile-title');
            const statusEl = tile.querySelector('.screen-tile-status');
            
            if (titleEl) titleEl.textContent = fileVal ? fileVal.name : urlVal.split('/').pop() || 'Custom';
            if (statusEl) statusEl.textContent = 'Custom';
          }
        }
      } catch (err) {
        console.error('Error applying video change:', err);
      } finally {
        this._closeEditor();
      }
    });

    this.editorCancelBtn.addEventListener('click', () => {
      console.log('Cancel clicked.');
      this._closeEditor();
    });
  }

  _openEditor(index, tile) {
    this._activeEditIndex = index;
    this._pendingFile = null;
    this.editorVideoUrl.value = '';
    this.editorVideoFile.value = '';
    this.editorFileStatus.textContent = 'No file selected';

    const numText = tile.querySelector('.screen-tile-num')?.textContent || `Screen ${index + 1}`;
    this.editorScreenTitle.textContent = `Configure ${numText}`;
    
    // Show modal and dim list
    this.screenEditorModal.classList.remove('hidden');
    this.videoManagerPanel.style.opacity = '0.3';
    this.videoManagerPanel.style.pointerEvents = 'none';
  }

  _closeEditor() {
    this._activeEditIndex = -1;
    this._pendingFile = null;
    this.screenEditorModal.classList.add('hidden');
    this.videoManagerPanel.style.opacity = '1';
    this.videoManagerPanel.style.pointerEvents = 'auto';
  }

  showStart(onStart) {
    this._onStart = onStart;
    this.startScreen.classList.remove('hidden');
  }

  hideStart() {
    this.startScreen.classList.add('hidden');
  }

  showPause() {
    this.pauseMenu.classList.remove('hidden');
    this._closeEditor();
    this.videoManagerPanel.classList.add('hidden');
    this.pauseMainContent.classList.remove('hidden');
  }

  hidePause() {
    this.pauseMenu.classList.add('hidden');
    this._closeEditor();
  }

  onResume(callback) {
    this._onResume = callback;
  }

  onMuteAll(callback) {
    this._onMuteAll = callback;
  }

  onVideoChange(callback) {
    this._onVideoChange = callback;
  }

  onHostRoom(callback) {
    this._onHostRoom = callback;
  }

  onJoinRoom(callback) {
    this._onJoinRoom = callback;
  }
}
