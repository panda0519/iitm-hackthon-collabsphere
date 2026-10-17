// SQLite connection. Uses the Node standard-library `node:sqlite` driver, so the
// skeleton has no native build step. The file lives under backend/data/ (gitignored).

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DB_PATH } from "../config/index.js";
import { seed } from "./seed.js";

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, "..", "..");
const schemaPath = join(here, "schema.sql");

let instance = null;

function resolveDbPath() {
  if (DB_PATH === ":memory:") return ":memory:";
  const file = isAbsolute(DB_PATH) ? DB_PATH : join(backendRoot, DB_PATH);
  mkdirSync(dirname(file), { recursive: true });
  return file;
}

export function getDb() {
  if (instance) return instance;
  instance = new DatabaseSync(resolveDbPath());
  instance.exec(readFileSync(schemaPath, "utf8"));
  migrate(instance);
  const { n } = instance.prepare("SELECT COUNT(*) AS n FROM users").get();
  if (!n) seed(instance);
  return instance;
}

/**
 * Additive migrations for databases created before a column existed. `node:sqlite`
 * has no migration tool, so each step is guarded by a column-existence check and is
 * safe to run on every boot.
 */
function migrate(db) {
  const cols = new Set(db.prepare("PRAGMA table_info(users)").all().map((c) => c.name));
  const add = (name, ddl) => {
    if (!cols.has(name)) db.exec(`ALTER TABLE users ADD COLUMN ${ddl}`);
  };
  add("password_salt", "password_salt TEXT");
  add("password_hash", "password_hash TEXT");
  add("password_iters", "password_iters INTEGER");
  add("is_secretary", "is_secretary INTEGER NOT NULL DEFAULT 0");
}
