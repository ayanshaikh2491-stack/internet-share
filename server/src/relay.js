/**
 * Relay — handles bidirectional traffic between paired peers.
 * Pipes binary and text data from sender ↔ receiver through the WebSocket tunnel.
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
    const { sender, receiver, id: roomId } = room;

    // Notify both peers they're connected
    sender.send(message(ServerMessage.PEER_CONNECTED, { role: 'sender' }));
    receiver.send(message(ServerMessage.PEER_CONNECTED, { role: 'receiver' }));

    console.log(`[Relay] Room ${room.code} paired — sender ↔ receiver connected`);
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

    // Relay the data to the peer
    peer.send(data, { binary: isBinary });

    // Update room activity timestamp
    const room = this.roomManager.getRoom(ws);
    if (room) {
      room.lastActivity = Date.now();
    }
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
        const { roomId, roomCode } = this.roomManager.createRoom(ws);
        ws.send(message(ServerMessage.ROOM_CREATED, { roomId, roomCode }));
        console.log(`[Room] Created — code: ${roomCode}, id: ${roomId.slice(0, 8)}...`);
        break;
      }

      case 'join_room': {
        const { room, error } = this.roomManager.joinRoom(parsed.roomCode, ws);
        if (error) {
          ws.send(message(ServerMessage.ERROR, { reason: error }));
          break;
        }
        ws.send(message(ServerMessage.ROOM_JOINED, {
          roomId: room.id,
          roomCode: room.code,
          role: 'receiver',
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
        ws.send(message(ServerMessage.ERROR, { reason: `Unknown message type: ${parsed.type}` }));
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
