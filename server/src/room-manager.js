/**
 * Room Manager — manages room creation, pairing, and cleanup.
 * Rooms are stored in memory (Map). Auto-cleanup on timeout/disconnect.
 * Supports password, data limits, and time limits per room.
 */

import { generateRoomId, generateRoomCode, message, ServerMessage, DEFAULT_ROOM_SETTINGS } from './protocol.js';

export class RoomManager {
  constructor(options = {}) {
    this.rooms = new Map();
    this.codeIndex = new Map(); // code → roomId lookup
    this.timeoutMs = options.timeoutMs ?? 30 * 60 * 1000; // 30 min default
    this.onPairReady = options.onPairReady ?? null;
  }

  /**
   * Create a new room with a sender
   * @param {import('ws').WebSocket} senderWs
   * @param {object} [settings]
   * @param {string|null} [settings.password]
   * @param {number|null} [settings.maxDataMB]
   * @param {number|null} [settings.maxTimeMinutes]
   * @returns {{ roomId: string, roomCode: string, config: object }}
   */
  createRoom(senderWs, settings = {}) {
    const roomId = generateRoomId();
    const roomCode = generateRoomCode();
    const config = {
      password: settings.password || null,
      maxDataMB: settings.maxDataMB || null,
      maxTimeMinutes: settings.maxTimeMinutes || null,
    };

    const room = {
      id: roomId,
      code: roomCode,
      sender: senderWs,
      receiver: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'waiting',            // 'waiting' | 'paired' | 'closed'
      config,                       // room settings (password, limits)
      stats: {
        bytesSent: 0,               // total bytes relayed
        dataMBUsed: 0,              // converted to MB
        duration: 0,                // paired duration in seconds
        pairedAt: null,             // timestamp when pairing started
      },
    };

    this.rooms.set(roomId, room);
    this.codeIndex.set(roomCode, roomId);

    // Set up sender disconnect handler
    senderWs._roomId = roomId;
    senderWs._role = 'sender';

    return { roomId, roomCode, config };
  }

  /**
   * Join a room as receiver
   * @param {string} roomCode
   * @param {import('ws').WebSocket} receiverWs
   * @param {object} [options]
   * @param {string} [options.password]
   * @returns {{ room: object | null, error: string | null, needPassword: boolean }}
   */
  joinRoom(roomCode, receiverWs, options = {}) {
    const roomId = this.codeIndex.get(roomCode.toUpperCase());
    if (!roomId) {
      return { room: null, error: 'Room not found', needPassword: false };
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      this.codeIndex.delete(roomCode.toUpperCase());
      return { room: null, error: 'Room expired', needPassword: false };
    }

    if (room.status === 'closed') {
      return { room: null, error: 'Room is closed', needPassword: false };
    }

    if (room.receiver) {
      return { room: null, error: 'Room is full', needPassword: false };
    }

    // Check password
    if (room.config.password) {
      if (!options.password) {
        return { room: null, error: 'Password required', needPassword: true };
      }
      if (options.password !== room.config.password) {
        return { room: null, error: 'Incorrect password', needPassword: false };
      }
    }

    // Check limits before joining
    if (room.config.maxDataMB !== null && room.stats.dataMBUsed >= room.config.maxDataMB) {
      return { room: null, error: 'Room data limit reached', needPassword: false };
    }

    room.receiver = receiverWs;
    room.status = 'paired';
    room.lastActivity = Date.now();
    room.stats.pairedAt = Date.now();

    receiverWs._roomId = roomId;
    receiverWs._role = 'receiver';

    // Notify callback that pairing is ready
    if (this.onPairReady) {
      this.onPairReady(room);
    }

    return { room, error: null, needPassword: false };
  }

  /**
   * Leave a room
   * @param {import('ws').WebSocket} ws
   */
  leaveRoom(ws) {
    const roomId = ws._roomId;
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const role = ws._role;
    const otherWs = role === 'sender' ? room.receiver : room.sender;

    // Clean up
    if (role === 'sender') {
      room.sender = null;
    } else {
      room.receiver = null;
    }

    // Notify the other peer
    if (otherWs && otherWs.readyState === 1) {
      otherWs.send(message(ServerMessage.PEER_DISCONNECTED, {
        reason: `${role === 'sender' ? 'Sender' : 'Receiver'} disconnected`,
      }));
    }

    // If room is empty, remove it
    if (!room.sender && !room.receiver) {
      this.rooms.delete(roomId);
      this.codeIndex.delete(room.code);
    }

    delete ws._roomId;
    delete ws._role;
  }

  /**
   * Get room by WebSocket connection
   */
  getRoom(ws) {
    const roomId = ws._roomId;
    return roomId ? this.rooms.get(roomId) : null;
  }

  /**
   * Get the other peer in a room
   */
  getPeer(ws) {
    const room = this.getRoom(ws);
    if (!room) return null;
    return ws._role === 'sender' ? room.receiver : room.sender;
  }

  /**
   * Track data usage. Returns false if limit exceeded.
   * @param {import('ws').WebSocket} ws
   * @param {number} bytes
   * @returns {boolean} true if data is within limits, false if limit exceeded
   */
  trackData(ws, bytes) {
    const room = this.getRoom(ws);
    if (!room) return false;

    room.stats.bytesSent += bytes;
    room.stats.dataMBUsed = room.stats.bytesSent / (1024 * 1024);
    room.lastActivity = Date.now();

    // Check data limit
    if (room.config.maxDataMB !== null && room.stats.dataMBUsed >= room.config.maxDataMB) {
      this._closeRoom(room, 'Data limit reached');
      return false;
    }

    return true;
  }

  /**
   * Update room stats duration
   */
  tickStats() {
    const now = Date.now();
    for (const room of this.rooms.values()) {
      if (room.status === 'paired' && room.stats.pairedAt) {
        room.stats.duration = Math.floor((now - room.stats.pairedAt) / 1000);

        // Check time limit
        if (room.config.maxTimeMinutes !== null) {
          const maxMs = room.config.maxTimeMinutes * 60 * 1000;
          if (now - room.stats.pairedAt >= maxMs) {
            this._closeRoom(room, 'Time limit reached');
          }
        }

        // Send room update to both peers
        this._sendRoomUpdate(room);
      }
    }
  }

  /**
   * Send current room stats to both peers
   */
  _sendRoomUpdate(room) {
    const update = message(ServerMessage.ROOM_UPDATE, {
      status: room.status,
      dataMBUsed: Math.round(room.stats.dataMBUsed * 100) / 100,
      duration: room.stats.duration,
      maxDataMB: room.config.maxDataMB,
      maxTimeMinutes: room.config.maxTimeMinutes,
    });

    const peers = [room.sender, room.receiver].filter(Boolean);
    for (const ws of peers) {
      if (ws.readyState === 1) {
        ws.send(update);
      }
    }
  }

  /**
   * Close a room due to limit reached
   */
  _closeRoom(room, reason) {
    room.status = 'closed';

    const msg = message(ServerMessage.ROOM_LEFT, { reason, closed: true });
    const peers = [room.sender, room.receiver].filter(Boolean);

    for (const ws of peers) {
      if (ws.readyState === 1) {
        ws.send(msg);
      }
    }

    // Clean up after a short delay
    setTimeout(() => {
      this.rooms.delete(room.id);
      this.codeIndex.delete(room.code);
    }, 5000);
  }

  /**
   * Clean up stale rooms
   */
  cleanup() {
    const now = Date.now();
    for (const [id, room] of this.rooms) {
      if (room.status === 'closed') continue;
      if (now - room.lastActivity > this.timeoutMs) {
        this._destroyRoom(id);
      }
    }
  }

  /**
   * Destroy a room completely
   */
  _destroyRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const msg = message(ServerMessage.ROOM_LEFT, { reason: 'Room expired due to inactivity' });
    const peers = [room.sender, room.receiver].filter(Boolean);
    for (const ws of peers) {
      if (ws.readyState === 1) {
        ws.send(msg);
      }
      delete ws._roomId;
      delete ws._role;
    }

    this.rooms.delete(roomId);
    this.codeIndex.delete(room.code);
  }

  /**
   * Get stats
   */
  getStats() {
    let waiting = 0;
    let paired = 0;
    let closed = 0;
    for (const room of this.rooms.values()) {
      if (room.status === 'waiting') waiting++;
      if (room.status === 'paired') paired++;
      if (room.status === 'closed') closed++;
    }
    return { total: this.rooms.size, waiting, paired, closed };
  }
}
