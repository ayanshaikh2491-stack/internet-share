# 🌐 Internet Share

> Open-source peer-to-peer internet relay — share your connection securely through encrypted tunnels.

```
Sender (Browser) ──WebSocket──► Relay Server ──WebSocket── Receiver (Browser)
```

## Features

- 🔐 **User Auth** — Register/login with JWT token auth (SQLite backend)
-  **Room System** — Create rooms with 4-char codes, password protection
- 📊 **Live Stats** — Data transfer tracking, peer count, duration with progress bars
-  **URL Browsing** — Receiver can browse web through donor's connection
-  **Dark Gaming UI** — Among Us-inspired aesthetic with Orbitron + Inter fonts
-  **Responsive** — Works on desktop, tablet, and mobile

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd internet-share

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Environment Setup

**Server** (`server/.env`):
```
PORT=3001
ROOM_TIMEOUT=1800000
```

**Client** (`client/.env`):
```
VITE_SERVER_URL=ws://localhost:3001
```

### 3. Run Locally

```bash
# Terminal 1: Start server
cd server && npm run dev

# Terminal 2: Start client
cd client && npm run dev
```

- Server: http://localhost:3001
- Client: http://localhost:5173

## How It Works

1. **Sender** → "Share Internet" dabata hai → Room code milta hai (e.g., `X7K9`)
2. **Receiver** → Code daalta hai → Sender ke internet se connect ho jaata hai
3. Sab traffic relay server ke through pipe hota hai

## Deploy

### Server → Render

```yaml
# render.yaml
services:
  - type: web
    name: internet-share-relay
    env: node
    region: oregon
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && node src/server.js
```

### Client → Vercel

```bash
cd client
vercel --prod
```

Set `VITE_SERVER_URL` in Vercel env vars to your deployed server URL.

## Tech Stack

| Layer | Tech |
|-------|------|
| **Backend** | Node.js, Express, WebSocket (`ws`) |
| **Database** | SQLite (`better-sqlite3`) |
| **Auth** | PBKDF2-SHA512 + JWT tokens |
| **Frontend** | Vite, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, CSS custom properties |
| **Fonts** | Orbitron (headings), Inter (body), JetBrains Mono (codes) |
| **Icons** | Lucide React |

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── server.js        # Express + WebSocket server
│   │   ├── room-manager.js  # Multi-room management
│   │   ├── relay.js         # Traffic relay logic
│   │   ├── user-manager.js  # SQLite auth + token management
│   │   └── protocol.js      # Message protocol definitions
│   ── data/                # SQLite database (gitignored)
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthScreen.tsx      # Login/Register
│   │   │   ├── HomeScreen.tsx      # Role selection
│   │   │   ├── DonorDashboard.tsx  # Share internet UI
│   │   │   └── ReceiverJoin.tsx    # Join & browse UI
│   │   ├── services/
│   │   │   ├── auth.ts     # HTTP auth client
│   │   │   └── tunnel.ts   # WebSocket tunnel client
│   │   ├── App.tsx         # Main app router
│   │   └── index.css       # Tailwind + dark theme tokens
│   └── public/
── DESIGN.md               # Design system specification
```

## Design

Dark gaming aesthetic — see `DESIGN.md` for full design system:
- **Colors**: Purple (share), Pink (join), Cyan (info), Green (success)
- **Fonts**: Orbitron for headings, Inter for body, JetBrains Mono for codes
- **Effects**: Ambient glow blobs, neon hover states, staggered animations

## License

MIT — Open source. Use it, fork it, break it, fix it.
