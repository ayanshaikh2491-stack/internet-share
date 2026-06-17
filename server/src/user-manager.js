/**
 * User Manager — handles user registration, login, and token-based auth.
 * Uses built-in Node.js crypto (no external deps).
 * Persists users to a JSON file for restart survival.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, '..', 'users.json');

const HASH_ITERATIONS = 100000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';
const TOKEN_BYTES = 32;

export class UserManager {
  constructor() {
    this.users = new Map();   // id → user object
    this.byEmail = new Map(); // email → user
    this.tokens = new Map();  // token → userId
    this._load();
  }

  register(email, password) {
    if (!email || !password) return { error: 'Email and password required' };
    if (typeof email !== 'string' || email.length < 3) return { error: 'Invalid email' };
    if (typeof password !== 'string' || password.length < 4) return { error: 'Password must be at least 4 characters' };
    const emailNorm = email.toLowerCase().trim();
    if (this.byEmail.has(emailNorm)) return { error: 'Email already registered' };

    const id = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');

    const user = { id, email: emailNorm, salt, hash, createdAt: Date.now() };
    this.users.set(id, user);
    this.byEmail.set(emailNorm, user);
    this._save();

    const token = this._createToken(id);
    return { user: { id: user.id, email: user.email }, token };
  }

  login(email, password) {
    if (!email || !password) return { error: 'Email and password required' };
    const emailNorm = email.toLowerCase().trim();
    const user = this.byEmail.get(emailNorm);
    if (!user) return { error: 'Invalid email or password' };

    const hash = crypto.pbkdf2Sync(password, user.salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');
    if (hash !== user.hash) return { error: 'Invalid email or password' };

    const token = this._createToken(user.id);
    return { user: { id: user.id, email: user.email }, token };
  }

  authenticate(token) {
    if (!token) return null;
    const userId = this.tokens.get(token);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  getById(id) {
    return this.users.get(id) || null;
  }

  logout(token) {
    this.tokens.delete(token);
  }

  _createToken(userId) {
    // Remove old tokens for this user (one session per user)
    for (const [t, uid] of this.tokens) {
      if (uid === userId) this.tokens.delete(t);
    }
    const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    this.tokens.set(token, userId);
    this._save();
    return token;
  }

  _save() {
    try {
      const data = {
        users: [...this.users.values()].map(u => ({
          id: u.id, email: u.email, salt: u.salt, hash: u.hash, createdAt: u.createdAt,
        })),
        tokens: [...this.tokens.entries()].map(([token, userId]) => ({ token, userId })),
      };
      fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('[UserManager] Save failed:', err.message);
    }
  }

  _load() {
    try {
      if (!fs.existsSync(USERS_FILE)) return;
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.users) {
        for (const u of data.users) {
          this.users.set(u.id, u);
          this.byEmail.set(u.email, u);
        }
      }
      if (data.tokens) {
        for (const t of data.tokens) {
          this.tokens.set(t.token, t.userId);
        }
      }
      console.log(`[UserManager] Loaded ${this.users.size} users, ${this.tokens.size} active tokens`);
    } catch (err) {
      console.error('[UserManager] Load failed:', err.message);
    }
  }
}
