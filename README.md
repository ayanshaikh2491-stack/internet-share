# 🌐 Internet Share

Web app jahan ek user apna internet share kar sake aur dusra user use kar sake — pure internet-based, koi local WiFi nahi.

## How It Works

```
Sender (Browser) ──WebSocket──► Relay Server ◄──WebSocket── Receiver (Browser)
```

1. **Sender** → "Share Internet" dabata hai → Room code milta hai (e.g., `X7K9`)
2. **Receiver** → Code daalta hai → Sender ke internet se connect ho jaata hai
3. Sab traffic relay server ke through pipe hota hai

## Project Structure

```
├── server/          # Node.js + WebSocket relay server
│   ├── src/
│   │   ├── server.js       # Main server (Express + WS)
│   │   ├── room-manager.js # Room creation & pairing
│   │   ├── relay.js        # Traffic relay logic
│   │   └── protocol.js     # Message protocol
│   └── package.json
├── client/          # Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx         # Main app with all screens
│   │   ├── services/
│   │   │   └── tunnel.ts   # WebSocket client
│   │   └── index.css       # Tailwind + custom styles
│   └── package.json
└── README.md
```

## Getting Started

### Server
```bash
cd server
npm install
npm run dev          # Starts on port 3001
```

### Client
```bash
cd client
npm install
npm run dev          # Starts on port 5173
```

### Environment Variables

**Server** (`server/.env`):
```
PORT=3001
ROOM_TIMEOUT=1800000
```

**Client** (`client/.env`):
```
VITE_SERVER_URL=ws://localhost:3001
```

## Deploy

- **Server** → Railway / Render (free tier)
- **Client** → Vercel (free tier)

Update `VITE_SERVER_URL` in client `.env` with your deployed server URL.

## Tech Stack

- **Backend:** Node.js, Express, WebSocket (`ws`)
- **Frontend:** Vite, React, TypeScript, Tailwind CSS
- **Protocol:** JSON messages over WebSocket, binary relay
