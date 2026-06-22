export class LoadingScreen {
  constructor() {
    this.element = document.getElementById('loading-screen');
    this.progressBar = document.getElementById('progress-bar');
    this.percentageText = document.getElementById('loading-percentage');
    this._progress = 0;
  }

  setProgress(value) {
    // value: 0 to 100
    this._progress = Math.min(100, Math.max(0, value));
    this.progressBar.style.width = this._progress + '%';
    this.percentageText.textContent = Math.round(this._progress) + '%';
  }

  hide() {
    return new Promise(resolve => {
      this.setProgress(100);
      // Short delay then fade out
      setTimeout(() => {
        this.element.classList.add('hidden');
        // Wait for CSS transition to complete
        setTimeout(resolve, 800);
      }, 500);
    });
  }
}
