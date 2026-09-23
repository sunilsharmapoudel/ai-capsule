import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DATABASE_FILE = process.env.DATABASE_FILE || './data/capsules.db';

fs.mkdirSync(path.dirname(path.resolve(DATABASE_FILE)), { recursive: true });

const db = new Database(DATABASE_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

export function deleteCapsule(id, userId) {
  return statements.deleteOwned.run(id, userId).changes > 0;
}

export default db;
