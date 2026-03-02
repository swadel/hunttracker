const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'hunts.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS hunts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL,
    location    TEXT NOT NULL,
    temperature REAL,
    weather     TEXT,
    notes       TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS animal_sightings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    hunt_id     INTEGER NOT NULL,
    animal_type TEXT NOT NULL,
    count       INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (hunt_id) REFERENCES hunts(id) ON DELETE CASCADE
  );
`);

module.exports = db;
