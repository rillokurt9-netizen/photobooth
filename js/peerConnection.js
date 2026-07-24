/**
 * PeerJS WebRTC connection manager for video + data sync.
 */
export class PeerConnectionManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.call = null;
    this.isHost = false;
    this.connected = false;
    this.onRemoteStream = null;
    this.onData = null;
    this.onStatusChange = null;
    this.roomId = '';
  }

  _setStatus(status, connected = false) {
    this.connected = connected;
    if (this.onStatusChange) this.onStatusChange(status, connected);
  }

  /**
   * Connect to a room. First person to use a room ID becomes host.
   * Second person joins as guest.
   */
  async connect(roomId, localStream) {
    this.roomId = roomId.trim();
    if (!this.roomId) throw new Error('Room ID is required');

    this._setStatus('Connecting…');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timed out. Try a different Room ID.'));
      }, 15000);

      // Try to become host with the room ID as peer ID
      this.peer = new Peer(this.roomId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      this.peer.on('open', (id) => {
        clearTimeout(timeout);
        this.isHost = true;
        this._setStatus(`Hosting room "${id}"`, false);
        this._setupHostHandlers(localStream);
        resolve({ role: 'host', id });
      });

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // Room ID taken → join as guest
          this.isHost = false;
          this.peer.destroy();
          this._joinAsGuest(this.roomId, localStream, resolve, reject, timeout);
        } else if (err.type !== 'disconnected') {
          clearTimeout(timeout);
          this._setStatus('Error: ' + err.message);
          reject(err);
        }
      });
    });
  }

  _joinAsGuest(roomId, localStream, resolve, reject, timeout) {
    this.peer = new Peer(undefined, {
      debug: 0,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    this.peer.on('open', (id) => {
      clearTimeout(timeout);
      this._setStatus('Joining room…');

      // Data connection
      this.conn = this.peer.connect(roomId, { reliable: true });
      this._wireDataConn();

      // Video call
      this.call = this.peer.call(roomId, localStream);
      this._wireCall();

      this._setStatus(`Connected to "${roomId}"`, true);
      resolve({ role: 'guest', id });
    });

    this.peer.on('error', (err) => {
      clearTimeout(timeout);
      this._setStatus('Error: ' + err.message);
      reject(err);
    });
  }

  _setupHostHandlers(localStream) {
    this.peer.on('connection', (conn) => {
      this.conn = conn;
      this._wireDataConn();
      this._setStatus(`Partner joined "${this.roomId}"`, true);
    });

    this.peer.on('call', (call) => {
      this.call = call;
      call.answer(localStream);
      this._wireCall();
    });
  }

  _wireDataConn() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      if (this.isHost) this._setStatus(`Connected in "${this.roomId}"`, true);
    });

    this.conn.on('data', (data) => {
      if (this.onData) this.onData(data);
    });

    this.conn.on('close', () => {
      this._setStatus('Partner disconnected', false);
    });
  }

  _wireCall() {
    if (!this.call) return;

    this.call.on('stream', (remoteStream) => {
      if (this.onRemoteStream) this.onRemoteStream(remoteStream);
    });

    this.call.on('close', () => {
      this._setStatus('Call ended', false);
    });
  }

  send(data) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  disconnect() {
    if (this.conn) this.conn.close();
    if (this.call) this.call.close();
    if (this.peer) this.peer.destroy();
    this.conn = null;
    this.call = null;
    this.peer = null;
    this.connected = false;
    this._setStatus('Offline', false);
  }
}
