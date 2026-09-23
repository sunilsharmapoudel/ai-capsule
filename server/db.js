// ---------------------------------------------------------------------------
// Database setup.
//
// SQLite is used as the datastore (the minimum required by the assignment).
// The schema is created on start-up if it does not already exist, so the app
// initialises its own database on a fresh deployment with no manual steps.
// ---------------------------------------------------------------------------
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DATABASE_FILE = process.env.DATABASE_FILE || './data/capsules.db';

// Make sure the directory holding the database file exists before opening it.
fs.mkdirSync(path.dirname(path.resolve(DATABASE_FILE)), { recursive: true });

const db = new Database(DATABASE_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// The CHECK constraints are defence in depth. Every value is already validated
// in server/validate.js before it reaches this layer, but the database refuses
// to store a malformed row even if a query were ever written incorrectly.
db.exec(`
  CREATE TABLE IF NOT EXISTS capsules (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           TEXT    NOT NULL,
    project_name      TEXT    NOT NULL CHECK (length(trim(project_name)) > 0),
    prompt_title      TEXT    NOT NULL CHECK (length(trim(prompt_title)) > 0),
    prompt_version    TEXT,
    prompt_text       TEXT    NOT NULL CHECK (length(trim(prompt_text)) > 0),
    response_summary  TEXT,
    category          TEXT,
    usefulness        TEXT,
    reviewed          INTEGER NOT NULL DEFAULT 0 CHECK (reviewed IN (0, 1)),
    improved          INTEGER NOT NULL DEFAULT 0 CHECK (improved IN (0, 1)),
    screenshot_url    TEXT,
    notes             TEXT,
    created_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Every read is scoped by user_id, so index it.
  CREATE INDEX IF NOT EXISTS idx_capsules_user_id ON capsules (user_id);
`);

// --- Prepared statements -----------------------------------------------------
// Every statement that touches an existing row is scoped by user_id, so a user
// can only ever read, change or remove their own records.

const columns = `
  id, user_id, project_name, prompt_title, prompt_version, prompt_text,
  response_summary, category, usefulness, reviewed, improved,
  screenshot_url, notes, created_at
`;

const statements = {
  listByUser: db.prepare(
    `SELECT ${columns} FROM capsules WHERE user_id = ? ORDER BY id DESC`
  ),
  getOwnedById: db.prepare(
    `SELECT ${columns} FROM capsules WHERE id = ? AND user_id = ?`
  ),
  insert: db.prepare(`
    INSERT INTO capsules (
      user_id, project_name, prompt_title, prompt_version, prompt_text,
      response_summary, category, usefulness, reviewed, improved,
      screenshot_url, notes, created_at
    ) VALUES (
      @user_id, @project_name, @prompt_title, @prompt_version, @prompt_text,
      @response_summary, @category, @usefulness, @reviewed, @improved,
      @screenshot_url, @notes, @created_at
    )
  `),
  updateOwned: db.prepare(`
    UPDATE capsules SET
      project_name     = @project_name,
      prompt_title     = @prompt_title,
      prompt_version   = @prompt_version,
      prompt_text      = @prompt_text,
      response_summary = @response_summary,
      category         = @category,
      usefulness       = @usefulness,
      reviewed         = @reviewed,
      improved         = @improved,
      screenshot_url   = @screenshot_url,
      notes            = @notes
    WHERE id = @id AND user_id = @user_id
  `),
  deleteOwned: db.prepare(`DELETE FROM capsules WHERE id = ? AND user_id = ?`)
};

// SQLite has no boolean type, so reviewed/improved are stored as 0/1 and
// converted back to real JSON booleans on the way out to the client.
function toApi(row) {
  if (!row) return null;
  return { ...row, reviewed: row.reviewed === 1, improved: row.improved === 1 };
}

export function listCapsules(userId) {
  return statements.listByUser.all(userId).map(toApi);
}

export function getCapsule(id, userId) {
  return toApi(statements.getOwnedById.get(id, userId));
}

export function createCapsule(userId, data) {
  const result = statements.insert.run({
    ...data,
    user_id: userId,
    reviewed: data.reviewed ? 1 : 0,
    improved: data.improved ? 1 : 0,
    created_at: new Date().toISOString()
  });
  return getCapsule(result.lastInsertRowid, userId);
}

// Returns the updated record, or null when the id does not exist OR belongs to
// another user. The caller turns null into 404 so record existence is never
// leaked across accounts.
export function updateCapsule(id, userId, data) {
  const result = statements.updateOwned.run({
    ...data,
    id,
    user_id: userId,
    reviewed: data.reviewed ? 1 : 0,
    improved: data.improved ? 1 : 0
  });
  return result.changes === 0 ? null : getCapsule(id, userId);
}

// Returns true only when a row owned by this user was actually removed.
export function deleteCapsule(id, userId) {
  return statements.deleteOwned.run(id, userId).changes > 0;
}

export default db;
