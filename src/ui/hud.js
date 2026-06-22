export class HUD {
  constructor() {
    this.container = document.getElementById('hud');
    this.prompt = document.getElementById('interaction-prompt');
    this.roomName = document.getElementById('room-name-display');
    this.controlsHelp = document.getElementById('controls-help');
    this._roomNameTimeout = null;
    this._currentRoom = null;
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }

  showPrompt(text) {
    this.prompt.textContent = text;
    this.prompt.classList.add('visible');
  }

  hidePrompt() {
    this.prompt.classList.remove('visible');
  }

  showRoomName(name) {
    // Only show if room changed
    if (name === this._currentRoom) return;
    this._currentRoom = name;

    // Clear any existing timeout
    if (this._roomNameTimeout) clearTimeout(this._roomNameTimeout);

    // Show room name
    this.roomName.textContent = name;
    this.roomName.classList.add('visible');

    // Auto-hide after 3 seconds
    this._roomNameTimeout = setTimeout(() => {
      this.roomName.classList.remove('visible');
    }, 3000);
  }

  hideRoomName() {
    this.roomName.classList.remove('visible');
    this._currentRoom = null;
  }

  toggleHelp() {
    this.controlsHelp.classList.toggle('hidden');
  }
}
