export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'paired';

export interface RoomConfig {
  password?: string | null;
  maxDataMB?: number | null;
  maxTimeMinutes?: number | null;
}

export interface RoomUpdate {
  roomCode: string;
  status: string;
  dataMBUsed: number;
  duration: number;
  peerCount: number;
  maxDataMB?: number | null;
  maxTimeMinutes?: number | null;
}

export interface ServerMessage {
  type: string;
  [key: string]: any;
}

export class TunnelClient {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  public onMessage: (msg: ServerMessage) => void;
  private onStateChange: (cs: ConnectionState) => void;
  private state: ConnectionState = 'disconnected';
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(serverUrl: string, handlers: {
    onMessage: (msg: ServerMessage) => void;
    onStateChange: (cs: ConnectionState) => void;
  }) {
    this.serverUrl = serverUrl;
    this.onMessage = handlers.onMessage;
    this.onStateChange = handlers.onStateChange;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.setState('connecting');

    const url = this.serverUrl.startsWith('ws') || this.serverUrl.startsWith('wss')
      ? this.serverUrl
      : `ws://${this.serverUrl}`;

    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      this.setState('disconnected');
      this.onMessage({ type: 'error', reason: 'Connection failed' });
      return;
    }

    this.ws.onopen = () => {
      this.setState('connected');
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'pong') return;
        this.onMessage(msg);
      } catch {
        // Binary data — handled separately
      }
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.setState('disconnected');
    };

    this.ws.onerror = () => {
      // onclose will follow
    };
  }

  disconnect() {
    this.stopPing();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.setState('disconnected');
  }

  getState() { return this.state; }

  send(type: string, data: Record<string, any> = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  sendRaw(data: ArrayBuffer) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  createRoom(config?: RoomConfig) {
    this.send('create_room', config || {});
  }

  joinRoom(code: string, password?: string) {
    const msg: any = { roomCode: code.toUpperCase() };
    if (password) msg.password = password;
    this.send('join_room', msg);
  }

  leaveRoom() {
    this.send('leave_room');
  }

  leaveAll() {
    this.send('leave_all');
  }

  getRooms() {
    this.send('get_rooms');
  }

  getPeers(roomId: string) {
    this.send('get_peers', { roomId });
  }

  ping() {
    this.send('ping');
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.onStateChange(state);
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => this.ping(), 30000);
  }

  private stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }
}
