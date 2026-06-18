/**
 * Relay — handles multi-peer data relay for internet sharing.
 * Donor sends → broadcast to all room peers.
 * Peer sends → forward to donor only.
 * Requires WebSocket auth via 'auth' message.
 */

import { message, ServerMessage } from './protocol.js';

export class Relay {
  constructor(roomManager, userManager) {
    this.roomManager = roomManager;
    this.userManager = userManager;
    this.bytesRelayed = 0;
    this.messagesRelayed = 0;
    this.fetchRequests = new Map(); // requestId → { requesterSid, roomCode }
    this.fetchCounter = 0;
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

    // ─── Auth message (no auth required) ─────────────────────────────────
    if (parsed.type === 'auth') {
      const token = parsed.token;
      const user = this.userManager.authenticate(token);
      if (!user) {
        ws.send(message(ServerMessage.ERROR, { reason: 'Invalid token' }));
        return;
      }
      ws._user = user;
      ws.send(message(ServerMessage.AUTH_OK, { userId: user.id, email: user.email }));
      console.log(`[WS] Auth OK — ${user.email}`);
      return;
    }

    // ─── All other messages require auth ─────────────────────────────────
    if (!ws._user) {
      ws.send(message(ServerMessage.ERROR, { reason: 'Not authenticated' }));
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
        console.log(`[Room] Created — code: ${roomCode} by ${ws._user.email}`);
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
        console.log(`[Room] Joined — code: ${room.code} by ${ws._user.email}`);
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

      case 'fetch_url': {
        // Receiver wants to browse a URL via the donor's connection
        const { url, roomCode } = parsed;
        if (!url || !roomCode) {
          ws.send(message(ServerMessage.ERROR, { reason: 'Missing url or roomCode' }));
          break;
        }

        // Find the room and verify sender is a peer
        let targetRoom = null;
        let sid = ws._sid;
        for (const room of this.roomManager.rooms.values()) {
          if (room.code === roomCode.toUpperCase() && (room.owner === ws || room.peers.has(sid))) {
            targetRoom = room;
            break;
          }
        }

        if (!targetRoom) {
          ws.send(message(ServerMessage.ERROR, { reason: 'Room not found or not a member' }));
          break;
        }

        // Only peers (receivers) can request fetches, not the owner
        if (targetRoom.owner === ws) {
          ws.send(message(ServerMessage.ERROR, { reason: 'Only receivers can request URL fetches' }));
          break;
        }

        if (!targetRoom.owner || targetRoom.owner.readyState !== 1) {
          ws.send(message(ServerMessage.ERROR, { reason: 'Donor is not connected' }));
          break;
        }

        // Generate a request ID and store it
        const requestId = `fetch_${++this.fetchCounter}_${Date.now()}`;
        this.fetchRequests.set(requestId, { requesterSid: sid, roomCode: targetRoom.code });

        // Relay the fetch request to the donor
        this.bytesRelayed += Buffer.byteLength(url);
        this.messagesRelayed++;
        targetRoom.owner.send(message(ServerMessage.FETCH_URL, {
          url,
          requestId,
          roomCode: targetRoom.code,
        }));
        break;
      }

      case 'fetch_response': {
        // Donor is sending back the fetched HTML
        const { url, html, requestId } = parsed;
        if (!requestId) {
          ws.send(message(ServerMessage.ERROR, { reason: 'Missing requestId' }));
          break;
        }

        const fetchReq = this.fetchRequests.get(requestId);
        if (!fetchReq) {
          ws.send(message(ServerMessage.ERROR, { reason: 'Unknown fetch request' }));
          break;
        }

        // Verify sender is the owner (donor) of the room
        let isOwner = false;
        for (const room of this.roomManager.rooms.values()) {
          if (room.code === fetchReq.roomCode && room.owner === ws) {
            isOwner = true;
            break;
          }
        }

        if (!isOwner) {
          ws.send(message(ServerMessage.ERROR, { reason: 'Only the donor can respond to fetches' }));
          break;
        }

        // Find the requester and send them the response
        const requesterInfo = this.roomManager.socketInfo.get(fetchReq.requesterSid);
        if (requesterInfo && requesterInfo.ws.readyState === 1) {
          this.bytesRelayed += Buffer.byteLength(html || '');
          this.messagesRelayed++;
          requesterInfo.ws.send(message(ServerMessage.FETCH_RESPONSE, {
            url,
            html,
            requestId,
          }));
        }

        // Clean up the stored request
        this.fetchRequests.delete(requestId);
        break;
      }

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
