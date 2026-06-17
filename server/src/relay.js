/**
 * Relay — handles multi-peer data relay for internet sharing.
 * Donor sends → broadcast to all room peers.
 * Peer sends → forward to donor only.
 */

import { message, ServerMessage } from './protocol.js';

export class Relay {
  constructor(roomManager) {
    this.roomManager = roomManager;
    this.bytesRelayed = 0;
    this.messagesRelayed = 0;
  }

  getOwnerRooms(ownerWs) {
    return this.roomManager.getOwnerRooms(ownerWs);
  }

  relayData(ws, data) {
    const sid = ws._sid;
    const isBinary = data instanceof Buffer;
    const dataSize = isBinary ? data.length : Buffer.byteLength(data);

    // Track data usage
    const withinLimits = this.roomManager.trackData(ws, dataSize);
    if (!withinLimits) return;

    // Find which room and determine where to send
    for (const room of this.roomManager.rooms.values()) {
      if (room.owner === ws) {
        // Owner sending → broadcast to ALL peers
        this.bytesRelayed += dataSize * room.peers.size;
        this.messagesRelayed += room.peers.size;
        for (const peer of room.peers.values()) {
          if (peer.ws.readyState === 1) {
            peer.dataReceived += dataSize;
            peer.ws.send(data, { binary: isBinary });
          }
        }
        return;
      }
      if (room.peers.has(sid)) {
        // Peer sending → forward to owner only
        this.bytesRelayed += dataSize;
        this.messagesRelayed++;
        if (room.owner && room.owner.readyState === 1) {
          room.owner.send(data, { binary: isBinary });
        }
        return;
      }
    }
  }

  handleMessage(ws, rawMessage) {
    let parsed;
    try { parsed = JSON.parse(rawMessage); } catch {
      ws.send(message(ServerMessage.ERROR, { reason: 'Invalid JSON' }));
      return;
    }

    switch (parsed.type) {
      case 'create_room': {
        const settings = {
          password: parsed.password || null,
          maxDataMB: parsed.maxDataMB || null,
          maxTimeMinutes: parsed.maxTimeMinutes || null,
        };
        const { roomId, roomCode, config } = this.roomManager.createRoom(ws, settings);
        ws.send(message(ServerMessage.ROOM_CREATED, { roomId, roomCode, config }));
        console.log(`[Room] Created — code: ${roomCode}`);
        break;
      }

      case 'join_room': {
        const { room, error, needPassword } = this.roomManager.joinRoom(parsed.roomCode, ws, { password: parsed.password });
        if (error) {
          ws.send(message(ServerMessage.ERROR, { reason: error, ...(needPassword ? { needPassword: true } : {}) }));
          break;
        }
        ws.send(message(ServerMessage.ROOM_JOINED, {
          roomId: room.id, roomCode: room.code, role: 'receiver', config: room.config,
        }));
        console.log(`[Room] Joined — code: ${room.code}`);
        break;
      }

      case 'get_rooms': {
        const rooms = this.getOwnerRooms(ws).map(r => ({
          code: r.code, status: r.status, peerCount: r.peers.size,
          dataMBUsed: Math.round(r.stats.dataMBUsed * 100) / 100,
          duration: r.stats.duration,
          config: r.config,
        }));
        ws.send(message(ServerMessage.ROOM_LIST, { rooms }));
        break;
      }

      case 'list_rooms': {
        const publicRooms = this.roomManager.listPublicRooms();
        ws.send(message(ServerMessage.ROOM_LIST, { rooms: publicRooms }));
        break;
      }

      case 'get_peers': {
        const roomId = parsed.roomId;
        const room = this.roomManager.rooms.get(roomId);
        if (!room || room.owner !== ws) {
          ws.send(message(ServerMessage.ERROR, { reason: 'Room not found' }));
          break;
        }
        const peers = [...room.peers.values()].map(p => ({
          sid: p.ws._sid,
          dataReceived: Math.round((p.dataReceived / (1024 * 1024)) * 100) / 100,
          connectedAt: p.connectedAt,
        }));
        ws.send(message(ServerMessage.PEER_LIST, { roomCode: room.code, peers }));
        break;
      }

      case 'ping':
        ws.send(message(ServerMessage.PONG, { ts: Date.now() }));
        break;

      case 'leave_room': {
        this.roomManager.leaveRoom(ws);
        ws.send(message(ServerMessage.ROOM_LEFT, { reason: 'Left room' }));
        break;
      }

      case 'leave_all':
        this.roomManager.leaveRoom(ws);
        break;

      case 'data':
        this.relayData(ws, rawMessage);
        break;

      default:
        ws.send(message(ServerMessage.ERROR, { reason: `Unknown type: ${parsed.type}` }));
    }
  }

  handleDisconnect(ws) {
    this.roomManager.unregisterSocket(ws);
  }

  getStats() {
    return {
      bytesRelayed: this.bytesRelayed,
      messagesRelayed: this.messagesRelayed,
      rooms: this.roomManager.getStats(),
    };
  }
}
