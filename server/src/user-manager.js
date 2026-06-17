/**
 * User Manager — handles user registration, login, and token-based auth.
 * Uses SQLite via better-sqlite3 for persistent storage.
 * Password hashing via built-in Node.js crypto (pbkdf2Sync, SHA-512).
 */

import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HASH_ITERATIONS = 100000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';
const TOKEN_BYTES = 32;

export class UserManager {
  constructor(dbPath) {
    const finalPath = dbPath || path.join(__dirname, '..', 'data', 'users.db');
	this.db = new Database(finalPath);
	this.db.pragma('journal_mode = WAL');
	this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user_id);
    `);
  }

  register(email, password) {
	if (!email || !password) return { error: 'Email and password required' };
    if (typeof email !== 'string' || email.length < 3) return { error: 'Invalid email' };
    if (typeof password !== 'string' || password.length < 4) return { error: 'Password must be at least 4 characters' };
    const emailNorm = email.toLowerCase().trim();
	
	const existing = this.db.prepare('SELECT id FROM users WHERE email = ?').get(emailNorm);
	if (existing) return { error: 'Email already registered' };
	
	const id = crypto.randomUUID();
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');
	
	this.db.prepare('INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)').run(id, emailNorm, hash, salt, Date.now());
	
	const token = this._createToken(id);
	return { user: { id, email: emailNorm }, token };
  }

  login(email, password) {
    if (!email || !password) return { error: 'Email and password required' };
    const emailNorm = email.toLowerCase().trim();
    const user = this.db.prepare('SELECT * FROM users WHERE email = ?').get(emailNorm);
    if (!user) return { error: 'Invalid email or password' };
	
	const hash = crypto.pbkdf2Sync(password, user.salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');
	if (hash !== user.password_hash) return { error: 'Invalid email or password' };
	
	const token = this._createToken(user.id);
	return { user: { id: user.id, email: user.email }, token };
  }

  authenticate(token) {
    if (!token) return null;
    const row = this.db.prepare('SELECT user_id FROM tokens WHERE token = ?').get(token);
    if (!row) return null;
    return this.db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(row.user_id) || null;
  }

  getById(id) {
    return this.db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(id) || null;
  }

  logout(token) {
    this.db.prepare('DELETE FROM tokens WHERE token = ?').run(token);
  }

  _createToken(userId) {
    // Remove old tokens for this user (one session per user)
    this.db.prepare('DELETE FROM tokens WHERE user_id = ?').run(userId);
    const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    this.db.prepare('INSERT INTO tokens (token, user_id, created_at) VALUES (?, ?, ?)').run(token, userId, Date.now());
    return token;
  }

  close() {
    this.db.close();
  }
}
