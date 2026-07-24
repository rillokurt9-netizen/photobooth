# Our Couple's Photobooth 📸

A real-time, interactive AR photobooth web app built for long-distance couples. Face-tracked filters, dual video panels, PeerJS WebRTC sync, and synchronized photo capture.

## Features

- **7 AR Filters** — Spider-Man, Mario, Clown, Batman, Luigi, Viking, Y2K Cyber Glasses
- **Dual Panels** — "Me" (local + AR) and "Partner" (remote feed)
- **Independent Filters** — Each person picks their own mask; selections don't affect the partner
- **PeerJS Connection** — Share a Room ID to connect via WebRTC
- **Synchronized Shutter** — 3-2-1 countdown synced across both screens
- **Photobooth Strip** — 2×2 grid (2 Me + 2 Partner frames) downloadable as PNG

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Face Tracking | [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh) |
| AR Rendering | Canvas 2D (landmark-positioned overlays) |
| Video Sync | [PeerJS](https://peerjs.com/) (WebRTC) |
| UI | HTML5 + Tailwind CSS |

## Quick Start

ES modules and camera access require a local HTTP server (opening `index.html` directly won't work).

```bash
# Option 1: Python
cd couples-photobooth
python -m http.server 8080

# Option 2: npx
npx serve . -p 8080
```

Open **http://localhost:8080** in Chrome or Edge (best camera + WebRTC support).

## How to Use

1. **Allow camera** when prompted — your feed appears in the "Me" panel.
2. **Pick a filter** from the AR Filter dropdown (local only).
3. **Connect with your partner:**
   - Both enter the same Room ID (e.g. `love2024`).
   - Person A clicks **Connect** first (becomes host).
   - Person B clicks **Connect** second (joins as guest).
4. **Snap Photo!** — Either person triggers a synced 3-2-1 countdown. On capture, a 4-frame strip is generated.
5. **Download** the photobooth strip as PNG.

## Solo Mode

You can use the photobooth alone — partner frames show a placeholder until someone connects.

## Browser Requirements

- Chrome 90+ or Edge 90+ recommended
- HTTPS or localhost (required for camera + WebRTC)
- Webcam access

## Project Structure

```
couples-photobooth/
├── index.html          # Main UI
├── css/styles.css      # Custom animations & overlays
└── js/
    ├── app.js          # App orchestrator
    ├── faceTracker.js  # MediaPipe integration
    ├── filters.js      # 7 AR filter renderers
    ├── peerConnection.js  # PeerJS WebRTC
    └── photobooth.js   # Countdown, capture, strip
```

## Notes

- AR filters are rendered locally and composited onto your outgoing video stream, so your partner sees you with your chosen filter.
- Filter selection is **not** synced — you and your partner can wear different masks.
- PeerJS uses its free public signaling server; for production, configure your own [PeerServer](https://github.com/peers/peerjs-server).
