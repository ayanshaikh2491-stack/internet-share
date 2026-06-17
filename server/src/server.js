/**
 * Internet Share — Relay Server
 * WebSocket-based relay for peer-to-peer internet sharing.
 *
 * Sender creates a room → gets a 4-char code
 * Receiver enters the code → gets paired with sender
 * All traffic is relayed through the server
 */

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { WebSocketServer } from 'ws';
import { RoomManager } from './room-manager.js';
import { Relay } from './relay.js';
import { message, ServerMessage, ClientMessage } from './protocol.js';

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
const ROOM_TIMEOUT = parseInt(process.env.ROOM_TIMEOUT || '1800000', 10); // 30 min

// ─── Express (HTTP API) ────────────────────────────────────────────────────
const app = express();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    rooms: relay.getStats(),
  });
});

app.get('/stats', (req, res) => {
  res.json(relay.getStats());
});

// ─── Self-Keepalive ─────────────────────────────────────────────────────────
// Pings the server's own public URL every 10 minutes to prevent
// Render free tier from spinning down after 15 min of inactivity.
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL || 'https://internet-share-relay.onrender.com';
const KEEPALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes

function startKeepalive() {
  console.log(`[Keepalive] Starting self-ping every 10min → ${SELF_URL}/health`);
  const ping = () => {
    fetch(`${SELF_URL}/health`)
      .then((res) => res.json())
      .then((data) => console.log(`[Keepalive] ✓ ${data.status} (${data.rooms?.rooms ?? '?'} rooms, uptime: ${Math.round(data.uptime)}s)`))
      .catch((err) => console.error(`[Keepalive] ✗ ${err.message}`));
  };
  // First ping after 30s (give server time to boot), then every 10min
  setTimeout(() => { ping(); setInterval(ping, KEEPALIVE_INTERVAL); }, 30_000);
}

// ─── Room Manager & Relay ──────────────────────────────────────────────────
const roomManager = new RoomManager({
  timeoutMs: ROOM_TIMEOUT,
  onPairReady: (room) => relay.onPairReady(room),
});

const relay = new Relay(roomManager);

// Periodic cleanup of stale rooms
setInterval(() => roomManager.cleanup(), 60 * 1000);

// ─── WebSocket Server ──────────────────────────────────────────────────────
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[WS] New connection from ${ip}`);

  // Handle text messages (protocol commands)
  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      // Binary data — relay directly to peer
      relay.relayData(ws, data);
    } else {
      // Text — parse as JSON protocol message
      relay.handleMessage(ws, data.toString());
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    relay.handleDisconnect(ws);
    console.log(`[WS] Connection closed from ${ip}`);
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error(`[WS] Error from ${ip}:`, err.message);
    relay.handleDisconnect(ws);
  });
});

// ─── HTTP Upgrade (attach WS to Express server) ────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  🌐 Internet Share Relay Server                         ║
║  HTTP: http://localhost:${PORT}                         ║
║  WS:   ws://localhost:${PORT}                           ║
║  Health: http://localhost:${PORT}/health                 ║
╚══════════════════════════════════════════════════════════╝
  `);
  startKeepalive();
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});
