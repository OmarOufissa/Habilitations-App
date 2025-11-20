import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import initSqlJs from "sql.js";

let db: any = null;
let SQL: any = null;
let dbPromise: Promise<void> | null = null;

const DB_PATH = path.join(process.cwd(), "habilitations.db");

// Save database to file
function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

// Lazy load database
async function getDatabase() {
  if (db) return db;
  if (dbPromise) {
    await dbPromise;
    return db;
  }

  dbPromise = (async () => {
    try {
      // Initialize sql.js
      SQL = await initSqlJs();

      // Load existing database or create new one
      if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
        console.log("Loaded existing SQLite database from:", DB_PATH);
      } else {
        db = new SQL.Database();
        console.log("Created new SQLite database at:", DB_PATH);
      }

      await initializeDatabase();
      saveDatabase();
    } catch (err) {
      console.error("Failed to initialize database:", err);
      throw err;
    }
  })();

  await dbPromise;
  return db;
}

export { getDatabase };

// Synchronous wrapper functions
function ensureDb() {
  if (!db) {
    throw new Error("Database not initialized. Call getDatabase() first.");
  }
  return db;
}

export function dbRun(sql: string, params?: any[]): any {
  try {
    const database = ensureDb();
    const stmt = database.prepare(sql);
    if (params) {
      stmt.bind(params);
    }
    stmt.step();
    stmt.free();
    saveDatabase();

    // Get last insert rowid for INSERT statements
    const lastIdStmt = database.prepare("SELECT last_insert_rowid() as lastInsertRowid");
    lastIdStmt.step();
    const result = lastIdStmt.getAsObject();
    lastIdStmt.free();

    return {
      changes: database.getRowsModified(),
      lastInsertRowid: result.lastInsertRowid
    };
  } catch (err) {
    console.error("Database run error:", err);
    throw err;
  }
}

export function dbGet(sql: string, params?: any[]): any {
  try {
    const database = ensureDb();
    const stmt = database.prepare(sql);
    if (params) {
      stmt.bind(params);
    }
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (err) {
    console.error("Database get error:", err);
    throw err;
  }
}

export function dbAll(sql: string, params?: any[]): any[] {
  try {
    const database = ensureDb();
    const stmt = database.prepare(sql);
    if (params) {
      stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error("Database all error:", err);
    throw err;
  }
}

async function initializeDatabase() {
  try {
    // Users table
    dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Divisions table
    dbRun(`
      CREATE TABLE IF NOT EXISTS divisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services table
    dbRun(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        division_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
        UNIQUE(name, division_id)
      )
    `);

    // Sections table
    dbRun(`
      CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        service_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        UNIQUE(name, service_id)
      )
    `);

    // Equipes table
    dbRun(`
      CREATE TABLE IF NOT EXISTS equipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        section_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
        UNIQUE(name, section_id)
      )
    `);

    // Employees table
    dbRun(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matricule TEXT UNIQUE NOT NULL,
        prenom TEXT NOT NULL,
        nom TEXT NOT NULL,
        division_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        equipe_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (division_id) REFERENCES divisions(id),
        FOREIGN KEY (service_id) REFERENCES services(id),
        FOREIGN KEY (section_id) REFERENCES sections(id),
        FOREIGN KEY (equipe_id) REFERENCES equipes(id)
      )
    `);

    // Habilitations table
    dbRun(`
      CREATE TABLE IF NOT EXISTS habilitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('HT', 'ST')),
        codes TEXT NOT NULL,
        numero TEXT,
        date_validation TEXT NOT NULL,
        date_expiration TEXT NOT NULL,
        pdf_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    dbRun(`CREATE INDEX IF NOT EXISTS idx_employees_matricule ON employees(matricule)`);
    dbRun(`CREATE INDEX IF NOT EXISTS idx_employees_division_id ON employees(division_id)`);
    dbRun(`CREATE INDEX IF NOT EXISTS idx_employees_service_id ON employees(service_id)`);
    dbRun(`CREATE INDEX IF NOT EXISTS idx_services_division_id ON services(division_id)`);
    dbRun(`CREATE INDEX IF NOT EXISTS idx_sections_service_id ON sections(service_id)`);
    dbRun(`CREATE INDEX IF NOT EXISTS idx_equipes_section_id ON equipes(section_id)`);
    dbRun(`CREATE INDEX IF NOT EXISTS idx_habilitations_employee_id ON habilitations(employee_id)`);
    dbRun(`CREATE INDEX IF NOT EXISTS idx_habilitations_type ON habilitations(type)`);
    dbRun(`CREATE INDEX IF NOT EXISTS idx_habilitations_expiration ON habilitations(date_expiration)`);

    // Check if demo user exists
    const user = dbGet(
      `SELECT id FROM users WHERE email = ?`,
      ["admin@example.com"]
    );

    if (!user) {
      // Create demo user (password: admin123)
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      dbRun(`INSERT INTO users (email, password) VALUES (?, ?)`, [
        "admin@example.com",
        hashedPassword,
      ]);
      console.log("Demo user created: admin@example.com / admin123");
    }

    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

export default {
  initialize: getDatabase,
  getDatabase,
};
