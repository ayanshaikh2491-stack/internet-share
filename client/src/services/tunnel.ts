/**
 * WebSocket client for the Internet Share relay server.
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'paired';

export interface ServerMessage {
  type: string;
  [key: string]: any;
}

export interface RoomInfo {
  roomId: string;
  roomCode: string;
}

export class TunnelClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: (msg: ServerMessage) => void;
  private onStateChange: (state: ConnectionState) => void;
  private state: ConnectionState = 'disconnected';

  constructor(
    serverUrl: string,
    handlers: {
      onMessage: (msg: ServerMessage) => void;
      onStateChange: (state: ConnectionState) => void;
    }
  ) {
    this.url = serverUrl;
    this.onMessage = handlers.onMessage;
    this.onStateChange = handlers.onStateChange;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.setState('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.setState('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        this.onMessage(msg);
      } catch {
        // Binary message — pass as-is
        this.onMessage({ type: 'data', payload: event.data });
      }
    };

    this.ws.onclose = () => {
      this.setState('disconnected');
    };

    this.ws.onerror = () => {
      this.setState('disconnected');
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.setState('disconnected');
    }
  }

  createRoom() {
    this.send({ type: 'create_room' });
  }

  joinRoom(roomCode: string) {
    this.send({ type: 'join_room', roomCode });
  }

  leaveRoom() {
    this.send({ type: 'leave_room' });
  }

  sendData(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'data', ...data }));
  }

  ping() {
    this.send({ type: 'ping' });
  }

  getState() {
    return this.state;
  }

  private send(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[Tunnel] Not connected, cannot send');
      return;
    }
    this.ws.send(JSON.stringify(data));
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.onStateChange(state);
  }
}
