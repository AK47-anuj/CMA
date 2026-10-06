/**
 * DataStore — Safe JSON file store with atomic writes and a write queue.
 * 
 * Features:
 * - Atomic writes: write to temp file, then rename
 * - Single in-process write queue to prevent corruption
 * - Schema version field for data migrations
 * - Thread-safe save operations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DB_FILE = path.join(__dirname, 'db.json');
const SCHEMA_VERSION = 2;

class DataStore {
  constructor() {
    this.data = null;
    this._writeQueue = Promise.resolve();
    this._dirty = false;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        this._migrate();
      } else {
        this.loadSeed();
      }
    } catch (err) {
      console.error('Error loading db.json, will regenerate from seed:', err.message);
      this.loadSeed();
    }
  }

  /**
   * Load seed data. If DEMO_MODE, generates relative-date data.
   */
  loadSeed() {
    const generateSeed = require('./seed');
    this.data = generateSeed();
    this.data._schemaVersion = SCHEMA_VERSION;
    this.saveSync();
  }

  /**
   * Migrate data from older schema versions.
   */
  _migrate() {
    const currentVersion = this.data._schemaVersion || 1;
    
    if (currentVersion < 2) {
      // V1 -> V2: Add new collections
      if (!this.data.events) this.data.events = [];
      if (!this.data.reminders) this.data.reminders = [];
      if (!this.data.notifications) this.data.notifications = [];
      if (!this.data.resetTokens) this.data.resetTokens = [];
      
      // Add auth fields to users
      if (this.data.users) {
        this.data.users.forEach(u => {
          if (!u.authProvider) u.authProvider = 'local';
          if (!u.failedLogins) u.failedLogins = 0;
          if (!u.lockedUntil) u.lockedUntil = null;
          if (!u.lastLoginAt) u.lastLoginAt = null;
        });
      }

      // Migrate eventReports to include new fields
      if (this.data.eventReports) {
        this.data.eventReports.forEach(r => {
          if (!r.version) r.version = 1;
          if (!r.history) r.history = [];
          if (!r.createdAt) r.createdAt = r.date || new Date().toISOString();
        });
      }

      // Migrate meetings
      if (this.data.meetings) {
        this.data.meetings.forEach(m => {
          if (!m.scheduleStatus) m.scheduleStatus = m.status === 'APPROVED' ? 'HELD' : 'SCHEDULED';
          if (!m.agendaItems) m.agendaItems = [];
          if (!m.invitees) m.invitees = [];
          if (!m.momStatus) m.momStatus = m.status === 'APPROVED' ? 'APPROVED' : 'NOT_STARTED';
        });
      }

      // Migrate calendar entries
      if (this.data.calendarEvents) {
        this.data.calendarEvents.forEach(c => {
          if (!c.source) c.source = 'MANUAL';
          if (!c.refId) c.refId = null;
          if (c.archived === undefined) c.archived = false;
        });
      }

      this.data._schemaVersion = SCHEMA_VERSION;
      this.saveSync();
      console.log('[Store] Migrated data from schema v1 to v2');
    }
  }

  get() {
    return this.data;
  }

  /**
   * Enqueue a save operation (async, atomic).
   * Writes are serialized through a promise queue.
   */
  save() {
    this._writeQueue = this._writeQueue.then(() => this._atomicWrite()).catch(err => {
      console.error('Error in atomic save:', err.message);
    });
    return this._writeQueue;
  }

  /**
   * Synchronous save — used only during init/seed.
   */
  saveSync() {
    try {
      const tmpFile = DB_FILE + '.tmp.' + process.pid;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error in sync save:', err.message);
      // Fallback: direct write
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (e) {
        console.error('Fallback write also failed:', e.message);
      }
    }
  }

  /**
   * Atomic write: write to temp file, then rename.
   */
  async _atomicWrite() {
    const tmpFile = DB_FILE + '.tmp.' + process.pid;
    const content = JSON.stringify(this.data, null, 2);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(tmpFile, content, 'utf-8', (err) => {
        if (err) {
          console.error('Error writing temp file:', err.message);
          return reject(err);
        }
        fs.rename(tmpFile, DB_FILE, (renameErr) => {
          if (renameErr) {
            console.error('Error renaming temp file:', renameErr.message);
            // Fallback: try direct write
            fs.writeFile(DB_FILE, content, 'utf-8', (fallbackErr) => {
              if (fallbackErr) return reject(fallbackErr);
              resolve();
            });
            return;
          }
          resolve();
        });
      });
    });
  }

  /**
   * Reset to seed data.
   */
  reset() {
    this.loadSeed();
    return this.data;
  }

  /**
   * Generate a unique ID with a prefix.
   */
  generateId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }
}

const storeInstance = new DataStore();
module.exports = storeInstance;
