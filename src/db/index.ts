import { Database } from "bun:sqlite";
const db = new Database("@/data/mydb.sqlite", { create: true, strict: true });
db.run("PRAGMA journal_mode = WAL;");

export { db };
