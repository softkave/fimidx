import assert from "assert";
import { defineConfig } from "drizzle-kit";

const dbURL = process.env.FIMIDX_DB_POSTGRES_DATABASE_URL;
assert.ok(dbURL, "FIMIDX_DB_POSTGRES_DATABASE_URL is required");

export default defineConfig({
  out: "./drizzle/fimidx/postgres",
  schema: "./src/db/fimidx.postgres.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbURL,
  },
  migrations: {
    table: "__drizzle_migrations", // `__drizzle_migrations` by default
    schema: "public", // used in PostgreSQL only, `drizzle` by default
  },
});
