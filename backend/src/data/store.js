const fs = require('fs');
const path = require('path');
const initialData = require('./initialData');

const DB_FILE = path.join(__dirname, 'db.json');

class DataStore {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        // Deep clone initial data
        this.data = JSON.parse(JSON.stringify(initialData));
        this.save();
      }
    } catch (err) {
      console.error('Error loading db.json, falling back to initial seed data:', err.message);
      this.data = JSON.parse(JSON.stringify(initialData));
    }
  }

  get() {
    return this.data;
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data to db.json:', err.message);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(initialData));
    this.save();
    return this.data;
  }
}

const storeInstance = new DataStore();
module.exports = storeInstance;
