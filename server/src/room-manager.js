/**
 * Room Manager — multi-room per donor, multi-peer per room.
 * Donor creates rooms. Multiple receivers can join each room.
 * Data from donor broadcasts to all peers; peer data goes to donor only.
 */

import { generateRoomId, generateRoomCode, message, ServerMessage } from './protocol.js';

let sidCounter = 0;
function nextSid() { return `s${++sidCounter}`; }

export class RoomManager {
  constructor(options = {}) {
    this.rooms = new Map();
    this.codeIndex = new Map();
    this.socketRooms = new Map();  // sid → Set<roomId>
    this.socketInfo = new Map();   // sid → { ws, ip }
    this.timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
    this.onPeerJoin = options.onPeerJoin ?? null;
    this.onPeerLeave = options.onPeerLeave ?? null;
    this.onOwnerDisconnect = options.onOwnerDisconnect ?? null;
  }

  registerSocket(ws, ip) {
    const sid = nextSid();
    ws._sid = sid;
    ws._ownerRooms = new Set();
    this.socketInfo.set(sid, { ws, ip });
    this.socketRooms.set(sid, new Set());
    return sid;
  }

  unregisterSocket(ws) {
    const sid = ws._sid;
    if (!sid) return;
    // Close all rooms owned by this socket
    if (ws._ownerRooms && ws._ownerRooms.size > 0) {
      for (const roomId of [...ws._ownerRooms]) {
        const room = this.rooms.get(roomId);
        if (room && room.owner === ws) {
          this._destroyRoom(room, 'Owner disconnected');
        }
      }
    }
    // Leave all rooms this socket is a peer in
    const joinedRooms = this.socketRooms.get(sid);
    if (joinedRooms) {
      for (const roomId of [...joinedRooms]) {
        this._removePeer(roomId, ws);
      }
    }
    this.socketRooms.delete(sid);
    this.socketInfo.delete(sid);
    delete ws._sid;
    delete ws._ownerRooms;
  }

  createRoom(ownerWs, settings = {}) {
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
      owner: ownerWs,
      ownerSid: ownerWs._sid,
      config,
      peers: new Map(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'waiting',
      stats: { bytesSent: 0, dataMBUsed: 0, duration: 0, activatedAt: null },
    };

    this.rooms.set(roomId, room);
    this.codeIndex.set(roomCode, roomId);
    ownerWs._ownerRooms.add(roomId);

    return { roomId, roomCode, config };
  }

  joinRoom(roomCode, ws, options = {}) {
    const roomId = this.codeIndex.get(roomCode.toUpperCase());
    if (!roomId) return { room: null, error: 'Room not found', needPassword: false };

    const room = this.rooms.get(roomId);
    if (!room) { this.codeIndex.delete(roomCode.toUpperCase()); return { room: null, error: 'Room expired', needPassword: false }; }
    if (room.status === 'closed') return { room: null, error: 'Room is closed', needPassword: false };

    if (room.config.password) {
      if (!options.password) return { room: null, error: 'Password required', needPassword: true };
      if (options.password !== room.config.password) return { room: null, error: 'Incorrect password', needPassword: false };
    }

    if (room.config.maxDataMB !== null && room.stats.dataMBUsed >= room.config.maxDataMB) {
      return { room: null, error: 'Room data limit reached', needPassword: false };
    }

    const peerSid = ws._sid;
    room.peers.set(peerSid, { ws, dataReceived: 0, connectedAt: Date.now() });
    room.lastActivity = Date.now();

    if (room.status === 'waiting') {
      room.status = 'active';
      room.stats.activatedAt = Date.now();
    }

    this.socketRooms.get(peerSid).add(roomId);

    // Notify owner
    if (room.owner && room.owner.readyState === 1) {
      room.owner.send(message(ServerMessage.PEER_JOINED, {
        roomCode: room.code,
        peerCount: room.peers.size,
        sid: peerSid,
      }));
    }

    if (this.onPeerJoin) this.onPeerJoin(room, ws);

    return { room, error: null, needPassword: false };
  }

  _removePeer(roomId, ws) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const sid = ws._sid;
    const wasRemoved = room.peers.delete(sid);
    this.socketRooms.get(sid)?.delete(roomId);

    if (wasRemoved && room.owner && room.owner.readyState === 1) {
      room.owner.send(message(ServerMessage.PEER_LEFT, {
        roomCode: room.code,
        peerCount: room.peers.size,
        sid,
      }));
    }

    if (room.peers.size === 0 && (!room.owner || room.owner.readyState !== 1)) {
      this._destroyRoom(room, 'All peers disconnected');
    }

    if (this.onPeerLeave) this.onPeerLeave(room, ws);
    room.lastActivity = Date.now();
  }

  leaveRoom(ws) {
    const sid = ws._sid;
    const joinedRooms = this.socketRooms.get(sid);
    if (!joinedRooms) return;

    for (const roomId of [...joinedRooms]) {
      const room = this.rooms.get(roomId);
      if (room && room.owner === ws) {
        // Owner leaving: destroy the room
        this._destroyRoom(room, 'Owner left');
      } else {
        this._removePeer(roomId, ws);
      }
    }
  }

  _destroyRoom(room, reason) {
    room.status = 'closed';
    const peers = [...room.peers.values()].filter(p => p.ws.readyState === 1);

    for (const peer of peers) {
      peer.ws.send(message(ServerMessage.OWNER_DISCONNECTED, { reason, roomCode: room.code }));
      this.socketRooms.get(peer.ws._sid)?.delete(room.id);
    }

    if (room.owner && room.owner.readyState === 1) {
      room.owner.send(message(ServerMessage.ROOM_LEFT, { roomCode: room.code, reason, closed: true }));
    }

    room.owner?._ownerRooms?.delete(room.id);
    room.peers.clear();

    setTimeout(() => {
      this.rooms.delete(room.id);
      this.codeIndex.delete(room.code);
    }, 3000);
  }

  getRoom(ws) {
    // If ws is an owner, return first room (for backwards compat)
    const sid = ws._sid;
    const joinedRooms = this.socketRooms.get(sid);
    if (!joinedRooms || joinedRooms.size === 0) return null;
    const roomId = joinedRooms.values().next().value;
    return this.rooms.get(roomId) || null;
  }

  getOwner(ws) {
    const room = this.getRoom(ws);
    return room?.owner && room.owner.readyState === 1 ? room.owner : null;
  }

  getPeers(ws) {
    const room = this.getRoom(ws);
    if (!room) return [];
    return [...room.peers.values()].filter(p => p.ws.readyState === 1).map(p => p.ws);
  }

  getOwnerRooms(ownerWs) {
    const rooms = [];
    for (const roomId of ownerWs._ownerRooms || []) {
      const room = this.rooms.get(roomId);
      if (room) rooms.push(room);
    }
    return rooms;
  }

  trackData(fromWs, bytes) {
    const sid = fromWs._sid;
    // Find which room this belongs to
    // If sender is owner, relay to all peers; track total
    for (const room of this.rooms.values()) {
      if (room.owner === fromWs) {
        room.stats.bytesSent += bytes;
        room.stats.dataMBUsed = room.stats.bytesSent / (1024 * 1024);
        room.lastActivity = Date.now();

        if (room.config.maxDataMB !== null && room.stats.dataMBUsed >= room.config.maxDataMB) {
          this._destroyRoom(room, 'Data limit reached');
          return false;
        }
        return true;
      }
      if (room.peers.has(sid)) {
        // Peer is sending to owner — just relay, don't track
        return true;
      }
    }
    return false;
  }

  tickStats() {
    const now = Date.now();
    for (const room of this.rooms.values()) {
      if (room.status === 'active' && room.stats.activatedAt) {
        room.stats.duration = Math.floor((now - room.stats.activatedAt) / 1000);

        if (room.config.maxTimeMinutes !== null) {
          const maxMs = room.config.maxTimeMinutes * 60 * 1000;
          if (now - room.stats.activatedAt >= maxMs) {
            this._destroyRoom(room, 'Time limit reached');
            continue;
          }
        }

        this._sendRoomUpdate(room);
      }
    }
  }

  _sendRoomUpdate(room) {
    const update = message(ServerMessage.ROOM_UPDATE, {
      roomCode: room.code,
      status: room.status,
      dataMBUsed: Math.round(room.stats.dataMBUsed * 100) / 100,
      duration: room.stats.duration,
      peerCount: room.peers.size,
      maxDataMB: room.config.maxDataMB,
      maxTimeMinutes: room.config.maxTimeMinutes,
    });

    // Send to owner
    if (room.owner && room.owner.readyState === 1) {
      room.owner.send(update);
    }

    // Send to all peers
    for (const peer of room.peers.values()) {
      if (peer.ws.readyState === 1) {
        peer.ws.send(update);
      }
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [id, room] of this.rooms) {
      if (room.status === 'closed') continue;
      if (now - room.lastActivity > this.timeoutMs) {
        this._destroyRoom(room, 'Room expired due to inactivity');
      }
    }
  }

  getStats() {
    let waiting = 0, active = 0, closed = 0;
    let totalPeers = 0;
    for (const room of this.rooms.values()) {
      if (room.status === 'waiting') waiting++;
      if (room.status === 'active') active++;
      if (room.status === 'closed') closed++;
      totalPeers += room.peers.size;
    }
    return { total: this.rooms.size, waiting, active, closed, totalPeers };
  }
}
