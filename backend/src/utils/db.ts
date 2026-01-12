import Database from 'better-sqlite3';
import path from 'path';

// Database types
export interface User {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface MailAccount {
  id: number;
  name: string;
  type: string;
  email: string;
  imapHost: string | null;
  imapPort: number | null;
  password: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationFlow {
  id: number;
  name: string;
  sourceMailAccountId: number;
  sourceMailbox: string;
  targetMailAccountId: number;
  targetMailbox: string;
  enabled: number; // SQLite uses 0/1 for boolean
  intervalMinutes: number;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecution {
  id: number;
  flowId: number;
  status: string;
  movedCount: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

// Flow with joined accounts
export interface FlowWithAccounts extends AutomationFlow {
  sourceMailAccount: MailAccount;
  targetMailAccount: MailAccount;
}

// Initialize database
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/automail.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mail_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    email TEXT NOT NULL,
    imapHost TEXT,
    imapPort INTEGER,
    password TEXT,
    accessToken TEXT,
    refreshToken TEXT,
    tokenExpiry TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS automation_flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sourceMailAccountId INTEGER NOT NULL,
    sourceMailbox TEXT NOT NULL,
    targetMailAccountId INTEGER NOT NULL,
    targetMailbox TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    intervalMinutes INTEGER NOT NULL DEFAULT 60,
    lastRun TEXT,
    nextRun TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (sourceMailAccountId) REFERENCES mail_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (targetMailAccountId) REFERENCES mail_accounts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS automation_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flowId INTEGER NOT NULL,
    status TEXT NOT NULL,
    movedCount INTEGER NOT NULL DEFAULT 0,
    errorMessage TEXT,
    startedAt TEXT NOT NULL DEFAULT (datetime('now')),
    completedAt TEXT,
    FOREIGN KEY (flowId) REFERENCES automation_flows(id) ON DELETE CASCADE
  );
`);

export default db;
