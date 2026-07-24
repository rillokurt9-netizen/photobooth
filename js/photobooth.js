/**
 * Synchronized countdown, capture, and photobooth strip generation.
 */

const COUNTDOWN_SECONDS = 3;
const SYNC_BUFFER_MS = 600;
const DOUBLE_CAPTURE_GAP_MS = 400;

export class Photobooth {
  constructor({ meCanvas, partnerVideo, partnerCanvas }) {
    this.meCanvas = meCanvas;
    this.partnerVideo = partnerVideo;
    this.partnerCanvas = partnerCanvas;
    this.partnerCtx = partnerCanvas.getContext('2d');
    this.isCapturing = false;
    this.onSendSync = null;
    this.onCaptureComplete = null;
  }

  /** Initiate a synchronized snap (called by either user) */
  requestSnap() {
    if (this.isCapturing) return;
    const startAt = Date.now() + SYNC_BUFFER_MS;
    this._beginCountdown(startAt);
    if (this.onSendSync) {
      this.onSendSync({ type: 'SNAP', startAt });
    }
  }

  /** Handle incoming sync message from partner */
  handleSyncMessage(data) {
    if (data.type === 'SNAP' && !this.isCapturing) {
      this._beginCountdown(data.startAt);
    }
  }

  _beginCountdown(startAt) {
    this.isCapturing = true;
    const meOverlay = document.getElementById('meCountdown');
    const partnerOverlay = document.getElementById('partnerCountdown');

    const tick = () => {
      const remaining = startAt - Date.now();
      const secondsLeft = Math.ceil(remaining / 1000);

      if (secondsLeft > COUNTDOWN_SECONDS) {
        requestAnimationFrame(tick);
        return;
      }

      if (secondsLeft > 0) {
        this._showCountdown(meOverlay, partnerOverlay, secondsLeft);
        requestAnimationFrame(tick);
      } else {
        this._showCountdown(meOverlay, partnerOverlay, '📸');
        setTimeout(() => this._captureSequence(meOverlay, partnerOverlay), 200);
      }
    };

    requestAnimationFrame(tick);
  }

  _showCountdown(meOverlay, partnerOverlay, num) {
    [meOverlay, partnerOverlay].forEach((el) => {
      el.classList.remove('hidden');
      el.innerHTML = `<span class="countdown-number">${num}</span>`;
    });
  }

  _hideCountdown(meOverlay, partnerOverlay) {
    [meOverlay, partnerOverlay].forEach((el) => {
      el.classList.add('hidden');
      el.innerHTML = '';
    });
  }

  _flash() {
    ['meFlash', 'partnerFlash'].forEach((id) => {
      const el = document.getElementById(id);
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 350);
    });
  }

  async _captureSequence(meOverlay, partnerOverlay) {
    this._flash();
    this._hideCountdown(meOverlay, partnerOverlay);

    const meFrames = [];
    const partnerFrames = [];

    for (let i = 0; i < 2; i++) {
      meFrames.push(this._captureMe());
      partnerFrames.push(this._capturePartner());
      if (i === 0) await this._wait(DOUBLE_CAPTURE_GAP_MS);
    }

    const stripDataUrl = await this._buildStrip(meFrames, partnerFrames);
    this.isCapturing = false;
    if (this.onCaptureComplete) this.onCaptureComplete(stripDataUrl);
  }

  _captureMe() {
    return this.meCanvas.toDataURL('image/png');
  }

  _capturePartner() {
    const video = this.partnerVideo;
    const canvas = this.partnerCanvas;

    if (!video.srcObject || video.readyState < 2) {
      return this._placeholderImage('Partner offline');
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    this.partnerCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }

  _placeholderImage(text) {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 480;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1229';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#ffffff55';
    ctx.font = '24px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 320, 240);
    return c.toDataURL('image/png');
  }

  /**
   * Build a 2×2 photobooth strip:
   *   [ Me #1 ]  [ Partner #1 ]
   *   [ Me #2 ]  [ Partner #2 ]
   */
  async _buildStrip(meFrames, partnerFrames) {
    const cellW = 400;
    const cellH = 300;
    const pad = 16;
    const labelH = 36;
    const stripW = cellW * 2 + pad * 3;
    const stripH = cellH * 2 + pad * 3 + labelH;

    const strip = document.createElement('canvas');
    strip.width = stripW;
    strip.height = stripH;
    const ctx = strip.getContext('2d');

    ctx.fillStyle = '#0f0a1a';
    ctx.fillRect(0, 0, stripW, stripH);

    ctx.fillStyle = '#ff6b9d';
    ctx.font = 'bold 20px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Our Couple's Photobooth 📸", stripW / 2, 28);

    const loadImg = (src) =>
      new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });

    const imgs = await Promise.all([
      loadImg(meFrames[0]),
      loadImg(partnerFrames[0]),
      loadImg(meFrames[1]),
      loadImg(partnerFrames[1]),
    ]);

    const positions = [
      { img: imgs[0], x: pad, y: pad + labelH },
      { img: imgs[1], x: pad * 2 + cellW, y: pad + labelH },
      { img: imgs[2], x: pad, y: pad * 2 + cellH + labelH },
      { img: imgs[3], x: pad * 2 + cellW, y: pad * 2 + cellH + labelH },
    ];
    const labels = ['Me #1', 'Partner #1', 'Me #2', 'Partner #2'];

    positions.forEach(({ img, x, y }, i) => {
      ctx.fillStyle = '#1a1229';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.drawImage(img, x, y, cellW, cellH);
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellW, cellH);
      ctx.fillStyle = '#ffffffaa';
      ctx.font = '14px Fredoka, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(labels[i], x + 8, y + cellH - 10);
    });

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, stripW - 4, stripH - 4);

    return strip.toDataURL('image/png');
  }

  _wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
