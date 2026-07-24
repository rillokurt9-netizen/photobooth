/**
 * MediaPipe Face Mesh tracker – low-latency face landmark detection.
 */
import { applyFilter } from './filters.js';

export class FaceTracker {
  constructor(videoEl, canvasEl) {
    this.video = videoEl;
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d', { alpha: false });
    this.landmarks = null;
    this.currentFilter = 'none';
    this.running = false;
    this.faceMesh = null;
    this.onFrame = null;
  }

  setFilter(filterId) {
    this.currentFilter = filterId;
  }

  async init() {
    this.faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults((results) => {
      this.landmarks = results.multiFaceLandmarks?.[0] || null;
    });

    await this.startCamera();
    this.running = true;
    this.renderLoop();
  }

  async startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    this.video.srcObject = stream;
    await this.video.play();
  }

  getStream() {
    return this.canvas.captureStream(30);
  }

  getVideoStream() {
    return this.video.srcObject;
  }

  renderLoop() {
    if (!this.running) return;

    const { video, canvas, ctx } = this;
    if (video.readyState >= 2) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Send frame to MediaPipe (async, results arrive via onResults)
      this.faceMesh.send({ image: video });

      // Draw mirrored video
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Apply AR filter on top
      if (this.landmarks && this.currentFilter !== 'none') {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        applyFilter(ctx, this.currentFilter, this.landmarks, canvas.width, canvas.height);
        ctx.restore();
      }
    }

    if (this.onFrame) this.onFrame();

    requestAnimationFrame(() => this.renderLoop());
  }

  /** Capture current composited frame as data URL */
  captureFrame() {
    return this.canvas.toDataURL('image/png');
  }

  stop() {
    this.running = false;
    const stream = this.video.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (this.faceMesh) this.faceMesh.close();
  }
}
