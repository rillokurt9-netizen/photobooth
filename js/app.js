/**
 * Main application orchestrator.
 */
import { FaceTracker } from './faceTracker.js';
import { PeerConnectionManager } from './peerConnection.js';
import { Photobooth } from './photobooth.js';

const els = {
  meCanvas: document.getElementById('meCanvas'),
  webcamVideo: document.getElementById('webcamVideo'),
  partnerVideo: document.getElementById('partnerVideo'),
  partnerCanvas: document.getElementById('partnerCanvas'),
  partnerPlaceholder: document.getElementById('partnerPlaceholder'),
  filterSelect: document.getElementById('filterSelect'),
  roomIdInput: document.getElementById('roomIdInput'),
  connectBtn: document.getElementById('connectBtn'),
  connDot: document.getElementById('connDot'),
  connLabel: document.getElementById('connLabel'),
  partnerStatusDot: document.getElementById('partnerStatusDot'),
  partnerStatusText: document.getElementById('partnerStatusText'),
  snapBtn: document.getElementById('snapBtn'),
  stripModal: document.getElementById('stripModal'),
  stripCanvas: document.getElementById('stripCanvas'),
  downloadBtn: document.getElementById('downloadBtn'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  retakeBtn: document.getElementById('retakeBtn'),
};

let tracker;
let peer;
let photobooth;

async function init() {
  tracker = new FaceTracker(els.webcamVideo, els.meCanvas);
  peer = new PeerConnectionManager();
  photobooth = new Photobooth({
    meCanvas: els.meCanvas,
    partnerVideo: els.partnerVideo,
    partnerCanvas: els.partnerCanvas,
  });

  // Wire photobooth sync
  photobooth.onSendSync = (data) => peer.send(data);
  photobooth.onCaptureComplete = showStripModal;

  peer.onData = (data) => photobooth.handleSyncMessage(data);
  peer.onRemoteStream = (stream) => {
    els.partnerVideo.srcObject = stream;
    els.partnerVideo.classList.add('connected');
    els.partnerPlaceholder.classList.add('hidden');
    els.partnerVideo.play().catch(() => {});
    setPartnerStatus(true);
  };
  peer.onStatusChange = updateConnectionUI;

  // Filter selector – local only, does NOT sync to partner
  els.filterSelect.addEventListener('change', (e) => {
    tracker.setFilter(e.target.value);
  });

  // Connect button
  els.connectBtn.addEventListener('click', handleConnect);

  // Snap button – works solo or connected
  els.snapBtn.addEventListener('click', () => photobooth.requestSnap());

  // Modal controls
  els.closeModalBtn.addEventListener('click', closeModal);
  els.retakeBtn.addEventListener('click', closeModal);

  // Start face tracking
  try {
    await tracker.init();
    els.snapBtn.disabled = false;
  } catch (err) {
    alert('Camera access is required for the photobooth. Please allow camera permissions and reload.');
    console.error(err);
  }
}

async function handleConnect() {
  if (peer.connected) {
    peer.disconnect();
    els.partnerVideo.srcObject = null;
    els.partnerPlaceholder.classList.remove('hidden');
    setPartnerStatus(false);
    els.connectBtn.textContent = 'Connect';
    return;
  }

  const roomId = els.roomIdInput.value.trim();
  if (!roomId) {
    alert('Please enter a Room ID to connect with your partner.');
    return;
  }

  els.connectBtn.disabled = true;
  els.connectBtn.textContent = 'Connecting…';

  try {
    const stream = tracker.getStream();
    const result = await peer.connect(roomId, stream);
    els.connectBtn.textContent = 'Disconnect';
    console.log(`Connected as ${result.role} (${result.id})`);
  } catch (err) {
    alert(err.message || 'Could not connect. Please try again.');
    els.connectBtn.textContent = 'Connect';
  } finally {
    els.connectBtn.disabled = false;
  }
}

function updateConnectionUI(status, connected) {
  els.connLabel.textContent = status;
  els.connDot.className = `w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-500'}`;
  if (connected) {
    els.connectBtn.textContent = 'Disconnect';
  }
}

function setPartnerStatus(connected) {
  els.partnerStatusDot.className = `w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`;
  els.partnerStatusText.textContent = connected ? 'Live' : 'Not connected';
}

function showStripModal(stripDataUrl) {
  const img = new Image();
  img.onload = () => {
    els.stripCanvas.width = img.width;
    els.stripCanvas.height = img.height;
    els.stripCanvas.getContext('2d').drawImage(img, 0, 0);
    els.downloadBtn.href = stripDataUrl;
    els.stripModal.classList.remove('hidden');
  };
  img.src = stripDataUrl;
}

function closeModal() {
  els.stripModal.classList.add('hidden');
}

init();
