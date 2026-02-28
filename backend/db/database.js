const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'energy.db');
const db = new Database(dbPath);

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS consumers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      center_id TEXT NOT NULL,
      price_per_unit REAL NOT NULL,
      monthly_usage REAL NOT NULL,
      monthly_bill REAL NOT NULL,
      connection_cost REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS producers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      city TEXT NOT NULL,
      center_id TEXT NOT NULL,
      price_per_unit REAL NOT NULL,
      units_available REAL NOT NULL,
      earnings REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS energy_centers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      stored REAL NOT NULL,
      capacity REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      from_center TEXT NOT NULL,
      to_center TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
};

const seedEnergyCentersIfEmpty = () => {
  const row = db.prepare('SELECT COUNT(*) AS count FROM energy_centers').get();
  if (row.count > 0) {
    return;
  }

  const seedRows = [
    ['EC001', 'SolarHub North', 'Delhi', 4200, 6000],
    ['EC002', 'WindCore East', 'Kolkata', 2800, 5000],
    ['EC003', 'BioGreen South', 'Chennai', 3600, 4500],
    ['EC004', 'HydroBase West', 'Mumbai', 5100, 7000]
  ];

  const insert = db.prepare(
    'INSERT INTO energy_centers (id, name, city, stored, capacity) VALUES (?, ?, ?, ?, ?)'
  );

  const tx = db.transaction((rows) => {
    for (const r of rows) {
      insert.run(r[0], r[1], r[2], r[3], r[4]);
    }
  });

  tx(seedRows);
};

module.exports = {
  db,
  createTables,
  seedEnergyCentersIfEmpty
};