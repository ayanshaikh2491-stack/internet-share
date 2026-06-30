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
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { RoomManager } from './room-manager.js';
import { Relay } from './relay.js';
import { UserManager } from './user-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Render-only Enforcement ───────────────────────────────────────────────
// This server is designed to run ONLY on Render's infrastructure.
// It checks for Render's specific environment variables.
const IS_RENDER = !!(process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID);
const IS_DEV = process.env.NODE_ENV === 'development';

if (!IS_RENDER && !IS_DEV) {
  console.error('⛔ This server can only run on Render or in development mode.');
  console.error('   Set NODE_ENV=development for local testing.');
  process.exit(1);
}

// ─── Security: Input Sanitization ──────────────────────────────────────────
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"'&]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'
  })[c]);
}

function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// ── Rate Limiting (Anti-brute-force) ──────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Rate limit exceeded.' },
});

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PORT = process.env.PORT || 3001;

const userManager = new UserManager(path.join(DATA_DIR, 'users.db'));
const ROOM_TIMEOUT = parseInt(process.env.ROOM_TIMEOUT || '1800000', 10); // 30 min

// ─── Express (HTTP API) ───────────────────────────────────────────────────
const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disabled for WebSocket compatibility
}));

app.use(express.json({ limit: '1mb' })); // Limit request body size

// ─── CORS (Lock to Vercel frontend only) ──────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://client-inky-iota.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || IS_DEV) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Apply rate limiting
app.use('/api/', authLimiter);
app.use('/', apiLimiter);

// ─── Public Endpoints ──────────────────────────────────────────────────────
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

// ─── Auth API (Rate-limited + Validated) ───────────────────────────────────
app.post('/api/register', (req, res) => {
  const { email, password } = req.body || {};

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (password.length > 128) {
    return res.status(400).json({ error: 'Password too long' });
  }

  // Sanitize inputs
  const cleanEmail = sanitize(email.toLowerCase().trim());

  const result = userManager.register(cleanEmail, password);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ user: result.user, token: result.token });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const cleanEmail = sanitize(email.toLowerCase().trim());
  const result = userManager.login(cleanEmail, password);
  if (result.error) {
    return res.status(401).json({ error: result.error });
  }
  res.json({ user: result.user, token: result.token });
});

app.post('/api/profile', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = auth.slice(7);
  const user = userManager.authenticate(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  res.json({ user: { id: user.id, email: user.email, createdAt: user.createdAt } });
});

// ─── Self-Keepalive ────────────────────────────────────────────────────────
// Pings the server's own public URL every 10 minutes to prevent
// Render free tier from spinning down after 15 min of inactivity.
const SELF_HOST = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL || 'internet-share-relay.onrender.com';
const SELF_URL = `https://${SELF_HOST.replace(/^https?:\/\//, '')}`;
const KEEPALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes

function startKeepalive() {
  if (!process.env.RENDER_EXTERNAL_URL) {
    console.log('[Keepalive] Skipping (not on Render)');
    return;
  }
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

const relay = new Relay(roomManager, userManager);

// Periodic cleanup of stale rooms + stats tick
setInterval(() => roomManager.cleanup(), 60 * 1000);
setInterval(() => roomManager.tickStats(), 1000); // 1-second tick for live stats

// ─── WebSocket Server ──────────────────────────────────────────────────────
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[WS] New connection from ${ip}`);
  roomManager.registerSocket(ws, ip);

  // Handle text messages (protocol commands)
  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      relay.relayData(ws, data);
    } else {
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
