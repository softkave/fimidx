import { defineConfig } from "drizzle-kit";
import { getCoreConfig } from "./src/common/getCoreConfig.js";

const { turso } = getCoreConfig();

export default defineConfig({
  out: "./drizzle/fimidx/sqlite",
  schema: "./src/db/fimidx.sqlite.ts",
  dialect: "turso",
  dbCredentials: {
    authToken: turso.authToken,
    url: turso.url,
  },
});
