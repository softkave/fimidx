import assert from "assert";
import { defineConfig } from "drizzle-kit";

const fimidxDbURL = process.env.FIMIDX_DB_TURSO_DATABASE_URL;
const fimidxDbAuthToken = process.env.FIMIDX_DB_TURSO_AUTH_TOKEN;
assert.ok(fimidxDbURL, "FIMIDX_DB_TURSO_DATABASE_URL is required");
assert.ok(fimidxDbAuthToken, "FIMIDX_DB_TURSO_AUTH_TOKEN is required");

export default defineConfig({
  out: "./drizzle/fimidx/sqlite",
  schema: "./src/db/fimidx.sqlite.ts",
  dialect: "turso",
  dbCredentials: {
    authToken: fimidxDbAuthToken,
    url: fimidxDbURL,
  },
});
