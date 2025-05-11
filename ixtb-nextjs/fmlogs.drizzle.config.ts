import assert from "assert";
import { defineConfig } from "drizzle-kit";

const fmlogsDbURL = process.env.FMLOGS_DB_TURSO_DATABASE_URL;
const fmlogsDbAuthToken = process.env.FMLOGS_DB_TURSO_AUTH_TOKEN;
assert.ok(fmlogsDbURL, "FMLOGS_DB_TURSO_DATABASE_URL is required");
assert.ok(fmlogsDbAuthToken, "FMLOGS_DB_TURSO_AUTH_TOKEN is required");

export default defineConfig({
  out: "./drizzle/fmlogs",
  schema: "./src/db/fmlogs-schema.ts",
  dialect: "turso",
  dbCredentials: {
    authToken: fmlogsDbAuthToken,
    url: fmlogsDbURL,
  },
});
