import assert from "assert";
import { defineConfig } from "drizzle-kit";

const fmdxDbURL = process.env.FMDX_DB_TURSO_DATABASE_URL;
const fmdxDbAuthToken = process.env.FMDX_DB_TURSO_AUTH_TOKEN;
assert.ok(fmdxDbURL, "FMDX_DB_TURSO_DATABASE_URL is required");
assert.ok(fmdxDbAuthToken, "FMDX_DB_TURSO_AUTH_TOKEN is required");

export default defineConfig({
  out: "./drizzle/fmdx/sqlite",
  schema: "./src/db/fmdx.sqlite.ts",
  dialect: "turso",
  dbCredentials: {
    authToken: fmdxDbAuthToken,
    url: fmdxDbURL,
  },
});
