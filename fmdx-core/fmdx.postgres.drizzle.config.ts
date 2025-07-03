import assert from "assert";
import { defineConfig } from "drizzle-kit";

const dbURL = process.env.FMDX_DB_POSTGRES_DATABASE_URL;
assert.ok(dbURL, "FMDX_DB_POSTGRES_DATABASE_URL is required");

export default defineConfig({
  out: "./drizzle/fmdx/postgres",
  schema: "./src/db/fmdx.postgres.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbURL,
  },
  migrations: {
    table: "__drizzle_migrations", // `__drizzle_migrations` by default
    schema: "public", // used in PostgreSQL only, `drizzle` by default
  },
});
