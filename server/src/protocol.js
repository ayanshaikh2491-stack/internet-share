/**
 * Message protocol definitions for WebSocket communication.
 */

export const ClientMessage = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  LEAVE_ALL: 'leave_all',
  PING: 'ping',
  DATA: 'data',
};

export const ServerMessage = {
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_LIST: 'room_list',
  PEER_LIST: 'peer_list',
  PEER_JOINED: 'peer_joined',
  PEER_LEFT: 'peer_left',
  OWNER_DISCONNECTED: 'owner_disconnected',
  ROOM_LEFT: 'room_left',
  ROOM_UPDATE: 'room_update',
  PONG: 'pong',
  DATA: 'data',
  ERROR: 'error',
  AUTH_OK: 'auth_ok',
  FETCH_URL: 'fetch_url',
  FETCH_RESPONSE: 'fetch_response',
};

export const DEFAULT_ROOM_SETTINGS = {
  password: null,
  maxDataMB: null,
  maxTimeMinutes: null,
};

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function generateRoomId() {
  return crypto.randomUUID();
}

export function message(type, data = {}) {
  return JSON.stringify({ type, ...data });
}
