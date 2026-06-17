/**
 * Room Manager — manages room creation, pairing, and cleanup.
 * Rooms are stored in memory (Map). Auto-cleanup on timeout/disconnect.
 */

import { generateRoomId, generateRoomCode } from './protocol.js';

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
   * @returns {{ roomId: string, roomCode: string }}
   */
  createRoom(senderWs) {
    const roomId = generateRoomId();
    const roomCode = generateRoomCode();

    const room = {
      id: roomId,
      code: roomCode,
      sender: senderWs,
      receiver: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'waiting', // 'waiting' | 'paired'
    };

    this.rooms.set(roomId, room);
    this.codeIndex.set(roomCode, roomId);

    // Set up sender disconnect handler
    senderWs._roomId = roomId;
    senderWs._role = 'sender';

    return { roomId, roomCode };
  }

  /**
   * Join a room as receiver
   * @param {string} roomCode
   * @param {import('ws').WebSocket} receiverWs
   * @returns {{ room: object | null, error: string | null }}
   */
  joinRoom(roomCode, receiverWs) {
    const roomId = this.codeIndex.get(roomCode.toUpperCase());
    if (!roomId) {
      return { room: null, error: 'Room not found' };
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return { room: null, error: 'Room expired' };
    }

    if (room.receiver) {
      return { room: null, error: 'Room is full' };
    }

    room.receiver = receiverWs;
    room.status = 'paired';
    room.lastActivity = Date.now();

    receiverWs._roomId = roomId;
    receiverWs._role = 'receiver';

    // Notify callback that pairing is ready
    if (this.onPairReady) {
      this.onPairReady(room);
    }

    return { room, error: null };
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
      otherWs.send(JSON.stringify({
        type: 'peer_disconnected',
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
   * Clean up stale rooms
   */
  cleanup() {
    const now = Date.now();
    for (const [id, room] of this.rooms) {
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

    const peers = [room.sender, room.receiver].filter(Boolean);
    for (const ws of peers) {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'room_left',
          reason: 'Room expired due to inactivity',
        }));
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
    for (const room of this.rooms.values()) {
      if (room.status === 'waiting') waiting++;
      if (room.status === 'paired') paired++;
    }
    return { total: this.rooms.size, waiting, paired };
  }
}
