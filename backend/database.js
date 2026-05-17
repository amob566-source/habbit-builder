const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'growth.db'));

// Create tables
db.serialize(() => {
  // Goals table (for Goal Tree)
  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT,
      status TEXT DEFAULT 'active',
      icon TEXT,
      color TEXT,
      children TEXT DEFAULT '[]',
      pct INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // If the table existed before we added children/pct/icon/color, try to add them safely.
  // ALTER TABLE will error if the column already exists; ignore the error.
  db.run("ALTER TABLE goals ADD COLUMN children TEXT DEFAULT '[]'", () => {});
  db.run("ALTER TABLE goals ADD COLUMN pct INTEGER DEFAULT 0", () => {});
  db.run("ALTER TABLE goals ADD COLUMN icon TEXT", () => {});
  db.run("ALTER TABLE goals ADD COLUMN color TEXT", () => {});

  // Habits table
  db.run(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      frequency TEXT,
      goalId INTEGER,
      status TEXT DEFAULT 'active',
      icon TEXT,
      color TEXT,
      target TEXT,
      time TEXT,
      category TEXT,
      streak INTEGER DEFAULT 0,
      pct INTEGER DEFAULT 0,
      done INTEGER DEFAULT 0,
      lastCompletedAt TEXT DEFAULT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goalId) REFERENCES goals(id)
    )
  `);

  // Add new habit columns if missing in existing DB
  db.run("ALTER TABLE habits ADD COLUMN icon TEXT", () => {});
  db.run("ALTER TABLE habits ADD COLUMN color TEXT", () => {});
  db.run("ALTER TABLE habits ADD COLUMN target TEXT", () => {});
  db.run("ALTER TABLE habits ADD COLUMN time TEXT", () => {});
  db.run("ALTER TABLE habits ADD COLUMN category TEXT", () => {});
  db.run("ALTER TABLE habits ADD COLUMN streak INTEGER DEFAULT 0", () => {});
  db.run("ALTER TABLE habits ADD COLUMN pct INTEGER DEFAULT 0", () => {});
  db.run("ALTER TABLE habits ADD COLUMN done INTEGER DEFAULT 0", () => {});
  db.run("ALTER TABLE habits ADD COLUMN lastCompletedAt TEXT", () => {});

  // Tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      habitId INTEGER,
      goalId INTEGER,
      status TEXT DEFAULT 'pending',
      dueDate TEXT,
      sequence INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habitId) REFERENCES habits(id),
      FOREIGN KEY (goalId) REFERENCES goals(id)
    )
  `);

  // Habit completion history for weekly tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habitId INTEGER NOT NULL,
      completedAt DATETIME NOT NULL,
      FOREIGN KEY (habitId) REFERENCES habits(id)
    )
  `);
  db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_completions_habit_day ON habit_completions(habitId, DATE(completedAt))", () => {});

  // Task completions (for analytics)
  db.run(`
    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    )
  `);

  // AI Recommendations (cache)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      taskSequence TEXT,
      generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;