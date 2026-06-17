/**
 * Relay — handles bidirectional traffic between paired peers.
 * Pipes binary and text data through the WebSocket tunnel.
 * Enforces data limits and tracks usage.
 */

import { message, ServerMessage } from './protocol.js';

export class Relay {
  constructor(roomManager) {
    this.roomManager = roomManager;
    this.bytesRelayed = 0;
    this.messagesRelayed = 0;
  }

  /**
   * Called when a new pair is connected
   */
  onPairReady(room) {
    const { sender, receiver } = room;

    // Notify sender
    sender.send(message(ServerMessage.PEER_CONNECTED, {
      role: 'sender',
      maxDataMB: room.config.maxDataMB,
      maxTimeMinutes: room.config.maxTimeMinutes,
    }));

    // Notify receiver with room info
    receiver.send(message(ServerMessage.PEER_CONNECTED, {
      role: 'receiver',
      maxDataMB: room.config.maxDataMB,
      maxTimeMinutes: room.config.maxTimeMinutes,
      hasPassword: !!room.config.password,
    }));

    console.log(`[Relay] Room ${room.code} paired — sender ↔ receiver connected`);
    if (room.config.maxDataMB) console.log(`[Relay]   Max data: ${room.config.maxDataMB}MB`);
    if (room.config.maxTimeMinutes) console.log(`[Relay]   Max time: ${room.config.maxTimeMinutes}min`);
  }

  /**
   * Handle incoming data from a client and relay to peer
   * @param {import('ws').WebSocket} ws
   * @param {string | Buffer} data
   */
  relayData(ws, data) {
    const peer = this.roomManager.getPeer(ws);
    if (!peer) return;

    if (peer.readyState !== 1) {
      ws.send(message(ServerMessage.ERROR, { reason: 'Peer disconnected' }));
      return;
    }

    const isBinary = data instanceof Buffer;
    const dataSize = isBinary ? data.length : Buffer.byteLength(data);
    this.bytesRelayed += dataSize;
    this.messagesRelayed++;

    // Track data usage and enforce limits
    const withinLimits = this.roomManager.trackData(ws, dataSize);
    if (!withinLimits) {
      ws.send(message(ServerMessage.ERROR, { reason: 'Data limit reached. Room closed.' }));
      return;
    }

    // Relay the data to the peer
    peer.send(data, { binary: isBinary });
  }

  /**
   * Handle text messages (JSON protocol commands)
   * @param {import('ws').WebSocket} ws
   * @param {string} rawMessage
   */
  handleMessage(ws, rawMessage) {
    let parsed;
    try {
      parsed = JSON.parse(rawMessage);
    } catch {
      ws.send(message(ServerMessage.ERROR, { reason: 'Invalid JSON' }));
      return;
    }

    const room = this.roomManager.getRoom(ws);
    if (room) {
      room.lastActivity = Date.now();
    }

    switch (parsed.type) {
      case 'create_room': {
        const settings = {
          password: parsed.password || null,
          maxDataMB: parsed.maxDataMB || null,
          maxTimeMinutes: parsed.maxTimeMinutes || null,
        };
        const { roomId, roomCode, config } = this.roomManager.createRoom(ws, settings);
        ws.send(message(ServerMessage.ROOM_CREATED, {
          roomId,
          roomCode,
          config,
        }));
        console.log(`[Room] Created — code: ${roomCode}, id: ${roomId.slice(0, 8)}...`);
        if (config.password) console.log(`[Room]   Password protected`);
        if (config.maxDataMB) console.log(`[Room]   Data limit: ${config.maxDataMB}MB`);
        if (config.maxTimeMinutes) console.log(`[Room]   Time limit: ${config.maxTimeMinutes}min`);
        break;
      }

      case 'join_room': {
        const options = {
          password: parsed.password || null,
        };
        const { room, error, needPassword } = this.roomManager.joinRoom(
          parsed.roomCode, ws, options
        );

        if (error) {
          if (needPassword) {
            ws.send(message(ServerMessage.ERROR, { reason: error, needPassword: true }));
          } else {
            ws.send(message(ServerMessage.ERROR, { reason: error }));
          }
          break;
        }

        ws.send(message(ServerMessage.ROOM_JOINED, {
          roomId: room.id,
          roomCode: room.code,
          role: 'receiver',
          config: room.config,
        }));
        console.log(`[Room] Joined — code: ${room.code}, id: ${room.id.slice(0, 8)}...`);
        break;
      }

      case 'ping':
        ws.send(message(ServerMessage.PONG, { ts: Date.now() }));
        break;

      case 'leave_room':
        this.roomManager.leaveRoom(ws);
        break;

      case 'data':
        // JSON-wrapped data (for text-based proxy requests)
        this.relayData(ws, rawMessage);
        break;

      default:
        ws.send(message(ServerMessage.ERROR, {
          reason: `Unknown message type: ${parsed.type}`,
        }));
        break;
    }
  }

  /**
   * Handle WebSocket connection close
   * @param {import('ws').WebSocket} ws
   */
  handleDisconnect(ws) {
    this.roomManager.leaveRoom(ws);
  }

  /**
   * Get relay statistics
   */
  getStats() {
    return {
      bytesRelayed: this.bytesRelayed,
      messagesRelayed: this.messagesRelayed,
      rooms: this.roomManager.getStats(),
    };
  }
}
