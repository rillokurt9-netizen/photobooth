/**
 * AR filter renderers using MediaPipe Face Mesh landmarks.
 * Each filter receives canvas context, landmark array, and dimensions.
 */

/** Convert normalized landmark to pixel coordinates */
export function lm(landmark, w, h) {
  return { x: landmark.x * w, y: landmark.y * h, z: landmark.z || 0 };
}

/** Distance between two landmarks in pixels */
function dist(a, b, w, h) {
  const p = lm(a, w, h);
  const q = lm(b, w, h);
  return Math.hypot(p.x - q.x, p.y - q.y);
}

/** Angle of line between two landmarks */
function angle(a, b, w, h) {
  const p = lm(a, w, h);
  const q = lm(b, w, h);
  return Math.atan2(q.y - p.y, q.x - p.x);
}

/** Face bounding metrics derived from landmarks */
function faceMetrics(lmks, w, h) {
  const forehead = lm(lmks[10], w, h);
  const chin = lm(lmks[152], w, h);
  const leftCheek = lm(lmks[234], w, h);
  const rightCheek = lm(lmks[454], w, h);
  const nose = lm(lmks[1], w, h);
  const leftEye = lm(lmks[33], w, h);
  const rightEye = lm(lmks[263], w, h);
  const leftTemple = lm(lmks[127], w, h);
  const rightTemple = lm(lmks[356], w, h);

  const faceW = Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y);
  const faceH = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);
  const cx = (leftCheek.x + rightCheek.x) / 2;
  const cy = (forehead.y + chin.y) / 2;
  const roll = angle(lmks[33], lmks[263], w, h);

  return { forehead, chin, nose, leftEye, rightEye, leftCheek, rightCheek, leftTemple, rightTemple, faceW, faceH, cx, cy, roll };
}

const FILTERS = {
  none: () => {},

  spiderman(ctx, lmks, w, h) {
    const m = faceMetrics(lmks, w, h);
    const scale = m.faceW * 1.15;

    ctx.save();
    ctx.translate(m.cx, m.cy);
    ctx.rotate(m.roll);

    // Mask base – red
    ctx.beginPath();
    ctx.ellipse(0, scale * 0.05, scale * 0.62, scale * 0.72, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#c41e1e';
    ctx.fill();

    // Blue side panels
    ctx.fillStyle = '#1a3a8a';
    ctx.beginPath();
    ctx.moveTo(-scale * 0.15, -scale * 0.3);
    ctx.lineTo(-scale * 0.62, -scale * 0.1);
    ctx.lineTo(-scale * 0.55, scale * 0.5);
    ctx.lineTo(-scale * 0.1, scale * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(scale * 0.15, -scale * 0.3);
    ctx.lineTo(scale * 0.62, -scale * 0.1);
    ctx.lineTo(scale * 0.55, scale * 0.5);
    ctx.lineTo(scale * 0.1, scale * 0.35);
    ctx.closePath();
    ctx.fill();

    // White eye holes
    const eyeY = -scale * 0.08;
    const eyeSpacing = scale * 0.22;
    const eyeR = scale * 0.13;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY, eyeR, eyeR * 0.85, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(eyeSpacing, eyeY, eyeR, eyeR * 0.85, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Web pattern
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * scale * 0.08, -scale * 0.45);
      ctx.quadraticCurveTo(i * scale * 0.04, 0, i * scale * 0.06, scale * 0.45);
      ctx.stroke();
    }
    for (let r = 0.15; r <= 0.55; r += 0.12) {
      ctx.beginPath();
      ctx.ellipse(0, scale * 0.05, scale * r, scale * r * 0.9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  },

  mario(ctx, lmks, w, h) {
    const m = faceMetrics(lmks, w, h);
    const capW = m.faceW * 1.3;
    const capH = m.faceW * 0.55;

    ctx.save();
    ctx.translate(m.forehead.x, m.forehead.y - capH * 0.15);
    ctx.rotate(m.roll);

    // Cap brim
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.ellipse(0, capH * 0.35, capW * 0.75, capH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cap dome
    ctx.beginPath();
    ctx.ellipse(0, 0, capW * 0.45, capH * 0.55, 0, Math.PI, 0);
    ctx.fill();

    // White circle + M
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -capH * 0.05, capW * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b71c1c';
    ctx.font = `bold ${capW * 0.22}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', 0, -capH * 0.05);

    ctx.restore();

    // Mustache
    ctx.save();
    ctx.translate(m.nose.x, m.nose.y + m.faceH * 0.12);
    ctx.rotate(m.roll);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-m.faceW * 0.28, 0);
    ctx.quadraticCurveTo(-m.faceW * 0.14, m.faceH * 0.08, 0, m.faceH * 0.02);
    ctx.quadraticCurveTo(m.faceW * 0.14, m.faceH * 0.08, m.faceW * 0.28, 0);
    ctx.quadraticCurveTo(m.faceW * 0.14, -m.faceH * 0.04, 0, -m.faceH * 0.02);
    ctx.quadraticCurveTo(-m.faceW * 0.14, -m.faceH * 0.04, -m.faceW * 0.28, 0);
    ctx.fill();
    ctx.restore();
  },

  clown(ctx, lmks, w, h) {
    const m = faceMetrics(lmks, w, h);

    // Curly wig
    ctx.save();
    ctx.translate(m.forehead.x, m.forehead.y - m.faceH * 0.15);
    ctx.rotate(m.roll);
    const colors = ['#ff1744', '#ffea00', '#00e676', '#2979ff', '#d500f9'];
    for (let i = -4; i <= 4; i++) {
      const angleOff = (i / 4) * 0.8;
      const r = m.faceW * 0.12;
      const wx = Math.sin(angleOff) * m.faceW * 0.55;
      const wy = -Math.cos(angleOff) * m.faceH * 0.25 - m.faceH * 0.05;
      ctx.fillStyle = colors[(i + 4) % colors.length];
      ctx.beginPath();
      ctx.arc(wx, wy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx + r * 0.3, wy + r * 0.5, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Rosy cheeks
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#ff6090';
    ctx.beginPath();
    ctx.ellipse(m.leftCheek.x, m.leftCheek.y, m.faceW * 0.12, m.faceH * 0.07, m.roll, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(m.rightCheek.x, m.rightCheek.y, m.faceW * 0.12, m.faceH * 0.07, m.roll, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Red nose
    ctx.save();
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(m.nose.x, m.nose.y, m.faceW * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(m.nose.x - m.faceW * 0.025, m.nose.y - m.faceW * 0.025, m.faceW * 0.025, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  batman(ctx, lmks, w, h) {
    const m = faceMetrics(lmks, w, h);
    const scale = m.faceW * 1.2;

    ctx.save();
    ctx.translate(m.cx, m.cy - scale * 0.08);
    ctx.rotate(m.roll);

    // Cowl
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(0, -scale * 0.75);
    ctx.lineTo(-scale * 0.12, -scale * 0.55);
    ctx.lineTo(-scale * 0.65, -scale * 0.35);
    ctx.quadraticCurveTo(-scale * 0.7, scale * 0.05, -scale * 0.45, scale * 0.25);
    ctx.lineTo(-scale * 0.15, scale * 0.15);
    ctx.lineTo(0, scale * 0.05);
    ctx.lineTo(scale * 0.15, scale * 0.15);
    ctx.lineTo(scale * 0.45, scale * 0.25);
    ctx.quadraticCurveTo(scale * 0.7, scale * 0.05, scale * 0.65, -scale * 0.35);
    ctx.lineTo(scale * 0.12, -scale * 0.55);
    ctx.closePath();
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(-scale * 0.35, -scale * 0.45);
    ctx.lineTo(-scale * 0.55, -scale * 0.85);
    ctx.lineTo(-scale * 0.15, -scale * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(scale * 0.35, -scale * 0.45);
    ctx.lineTo(scale * 0.55, -scale * 0.85);
    ctx.lineTo(scale * 0.15, -scale * 0.55);
    ctx.closePath();
    ctx.fill();

    // Eye slits
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(-scale * 0.22, -scale * 0.05, scale * 0.14, scale * 0.06, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(scale * 0.22, -scale * 0.05, scale * 0.14, scale * 0.06, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  luigi(ctx, lmks, w, h) {
    const m = faceMetrics(lmks, w, h);
    const capW = m.faceW * 1.3;
    const capH = m.faceW * 0.55;

    ctx.save();
    ctx.translate(m.forehead.x, m.forehead.y - capH * 0.15);
    ctx.rotate(m.roll);

    // Green cap
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(0, capH * 0.35, capW * 0.75, capH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, capW * 0.45, capH * 0.55, 0, Math.PI, 0);
    ctx.fill();

    // L logo
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -capH * 0.05, capW * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.font = `bold ${capW * 0.22}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', 0, -capH * 0.05);

    ctx.restore();

    // Bushy mustache (slightly wider than Mario)
    ctx.save();
    ctx.translate(m.nose.x, m.nose.y + m.faceH * 0.12);
    ctx.rotate(m.roll);
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.moveTo(-m.faceW * 0.32, m.faceH * 0.01);
    ctx.quadraticCurveTo(-m.faceW * 0.16, m.faceH * 0.1, 0, m.faceH * 0.03);
    ctx.quadraticCurveTo(m.faceW * 0.16, m.faceH * 0.1, m.faceW * 0.32, m.faceH * 0.01);
    ctx.quadraticCurveTo(m.faceW * 0.16, -m.faceH * 0.05, 0, -m.faceH * 0.03);
    ctx.quadraticCurveTo(-m.faceW * 0.16, -m.faceH * 0.05, -m.faceW * 0.32, m.faceH * 0.01);
    ctx.fill();
    ctx.restore();
  },

  viking(ctx, lmks, w, h) {
    const m = faceMetrics(lmks, w, h);
    const hw = m.faceW * 1.35;

    ctx.save();
    ctx.translate(m.forehead.x, m.forehead.y - m.faceH * 0.05);
    ctx.rotate(m.roll);

    // Helmet bowl
    const grad = ctx.createLinearGradient(-hw, -hw, hw, hw);
    grad.addColorStop(0, '#b0b0b0');
    grad.addColorStop(0.5, '#e8e8e8');
    grad.addColorStop(1, '#888');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, hw * 0.55, hw * 0.35, 0, Math.PI, 0);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#f5f0e1';
    ctx.beginPath();
    ctx.moveTo(-hw * 0.45, -hw * 0.05);
    ctx.quadraticCurveTo(-hw * 0.75, -hw * 0.55, -hw * 0.35, -hw * 0.65);
    ctx.quadraticCurveTo(-hw * 0.55, -hw * 0.35, -hw * 0.45, -hw * 0.05);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hw * 0.45, -hw * 0.05);
    ctx.quadraticCurveTo(hw * 0.75, -hw * 0.55, hw * 0.35, -hw * 0.65);
    ctx.quadraticCurveTo(hw * 0.55, -hw * 0.35, hw * 0.45, -hw * 0.05);
    ctx.fill();

    // Nose guard
    ctx.fillStyle = '#999';
    ctx.fillRect(-hw * 0.04, 0, hw * 0.08, hw * 0.25);

    ctx.restore();
  },

  y2k(ctx, lmks, w, h) {
    const m = faceMetrics(lmks, w, h);
    const gw = m.faceW * 1.1;
    const gh = m.faceH * 0.22;
    const eyeMidY = (m.leftEye.y + m.rightEye.y) / 2;
    const eyeMidX = (m.leftEye.x + m.rightEye.x) / 2;

    ctx.save();
    ctx.translate(eyeMidX, eyeMidY);
    ctx.rotate(m.roll);

    // Neon gradient lenses
    const lensGrad = ctx.createLinearGradient(-gw / 2, 0, gw / 2, 0);
    lensGrad.addColorStop(0, '#ff00ff');
    lensGrad.addColorStop(0.3, '#00ffff');
    lensGrad.addColorStop(0.7, '#ff00aa');
    lensGrad.addColorStop(1, '#ffff00');

    // Left lens
    ctx.fillStyle = lensGrad;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.roundRect(-gw * 0.48, -gh * 0.5, gw * 0.42, gh, 8);
    ctx.fill();

    // Right lens
    ctx.beginPath();
    ctx.roundRect(gw * 0.06, -gh * 0.5, gw * 0.42, gh, 8);
    ctx.fill();

    // Reflective shine
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-gw * 0.28, -gh * 0.15, gw * 0.1, gh * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(gw * 0.26, -gh * 0.15, gw * 0.1, gh * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Frame
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-gw * 0.48, -gh * 0.5, gw * 0.42, gh, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(gw * 0.06, -gh * 0.5, gw * 0.42, gh, 8);
    ctx.stroke();

    // Bridge
    ctx.beginPath();
    ctx.moveTo(-gw * 0.06, -gh * 0.1);
    ctx.lineTo(gw * 0.06, -gh * 0.1);
    ctx.stroke();

    // Temple arms
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-gw * 0.48, -gh * 0.1);
    ctx.lineTo(-gw * 0.65, -gh * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gw * 0.48, -gh * 0.1);
    ctx.lineTo(gw * 0.65, -gh * 0.05);
    ctx.stroke();

    ctx.restore();
  },
};

export function getFilterNames() {
  return Object.keys(FILTERS).filter((k) => k !== 'none');
}

export function applyFilter(ctx, filterId, landmarks, width, height) {
  const fn = FILTERS[filterId] || FILTERS.none;
  fn(ctx, landmarks, width, height);
}

export { FILTERS };
