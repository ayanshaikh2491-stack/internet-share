const API_URL = import.meta.env.VITE_SERVER_URL?.replace(/^ws/, 'http') || 'http://localhost:3001';

export interface AuthUser {
  id: string;
  email: string;
  createdAt?: number;
}

export class AuthService {
  private token: string | null = null;
  private user: AuthUser | null = null;

  constructor() {
    this.token = localStorage.getItem('sharenet_token');
    this._loadUser();
  }

  async register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Registration failed' };
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('sharenet_token', this.token!);
      localStorage.setItem('sharenet_user', JSON.stringify(this.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Login failed' };
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('sharenet_token', this.token!);
      localStorage.setItem('sharenet_user', JSON.stringify(this.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('sharenet_token');
    localStorage.removeItem('sharenet_user');
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  private _loadUser() {
    try {
      const raw = localStorage.getItem('sharenet_user');
      if (raw) this.user = JSON.parse(raw);
    } catch {}
  }
}

export const auth = new AuthService();
