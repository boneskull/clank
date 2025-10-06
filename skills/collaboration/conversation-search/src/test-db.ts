import { initDatabase } from './db.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const dbDir = path.join(os.homedir(), '.clank', 'conversation-index');
fs.mkdirSync(dbDir, { recursive: true });

const db = initDatabase();
console.log('Database initialized successfully');

// Verify tables exist
const tables = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table'
`).all();

console.log('Tables:', tables);
db.close();
