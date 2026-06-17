/**
 * Message protocol definitions for WebSocket communication.
 * All messages are JSON strings with a "type" field.
 */

/**
 * Client → Server message types
 */
export const ClientMessage = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PING: 'ping',
  DATA: 'data',
};

/**
 * Server → Client message types
 */
export const ServerMessage = {
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  PONG: 'pong',
  DATA: 'data',
  ERROR: 'error',
  PEER_CONNECTED: 'peer_connected',
  PEER_DISCONNECTED: 'peer_disconnected',
};

/**
 * Generate a short room code (4 alphanumeric chars)
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Generate a unique room ID
 */
export function generateRoomId() {
  return crypto.randomUUID();
}

/**
 * Create a protocol message
 */
export function message(type, data = {}) {
  return JSON.stringify({ type, ...data });
}
