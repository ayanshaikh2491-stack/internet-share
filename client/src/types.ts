export interface UserProfile {
  email: string;
  joinedAt: string;
  totalEarnings: number;
  totalSharedBytes: number;
  totalDownloadedBytes: number;
}

export type ActiveView = 'auth' | 'home' | 'donor' | 'receiver';

export interface PeerSession {
  id: string;
  ip: string;
  location: string;
  connectedAt: string;
  dataTransferred: number;
  speed: number;
  status: 'active' | 'idle' | 'payout_pending';
}

export interface RegionOption {
  id: string;
  name: string;
  flag: string;
  latency: number;
  bandwidthCap: string;
}

export interface ChartDataPoint {
  time: string;
  speed: number;
}

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

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'paired';