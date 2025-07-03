import { exec } from "child_process";
import { Pool } from "pg";
import { promisify } from "util";
import { fmdxPostgresDb as postgresDb } from "./src/db/fmdx.postgres.js";
import { db as sqliteDb } from "./src/db/fmdx.sqlite.js";

const promisifiedExec = promisify(exec);

async function deleteAllSQLiteTables() {
  console.log("Deleting all SQLite tables");
  const tables = await sqliteDb.all<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table'`
  );
  for (const table of tables) {
    await sqliteDb.run(`DROP TABLE IF EXISTS ${table.name}`);
  }
  console.log("Done deleting all SQLite tables");
}

async function deleteAllPostgresTables() {
  console.log("Deleting all Postgres tables");
  const result = await postgresDb.execute<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  for (const table of result.rows) {
    await postgresDb.execute(`DROP TABLE IF EXISTS ${table.table_name}`);
  }
  console.log("Done deleting all Postgres tables");
}

async function runMigrationsForPostgresUsingShell() {
  const postgresMigrationCommand = "pnpm db:migrate:postgres:test";
  const sqliteMigrationCommand = "pnpm db:migrate:sqlite:test";
  const commands = [postgresMigrationCommand, sqliteMigrationCommand];
  for (const command of commands) {
    console.log(`Running ${command}`);
    const result = await promisifiedExec(command);
    if (result.stderr) {
      console.error(result.stderr);
    }
    console.log(result.stdout);
    console.log(`Done running ${command}`);
  }
}

export async function setup() {
  await runMigrationsForPostgresUsingShell();
}

export async function teardown() {
  await deleteAllSQLiteTables();
  await deleteAllPostgresTables();

  if (postgresDb.$client instanceof Pool) {
    await postgresDb.$client.end();
  }
}
