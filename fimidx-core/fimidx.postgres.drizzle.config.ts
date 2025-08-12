import { defineConfig } from "drizzle-kit";
import { getCoreConfig } from "./src/common/getCoreConfig.js";

const { postgres } = getCoreConfig();

export default defineConfig({
  out: "./drizzle/fimidx/postgres",
  schema: "./src/db/fimidx.postgres.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: postgres.url,
  },
  migrations: {
    table: "__drizzle_migrations", // `__drizzle_migrations` by default
    schema: "public", // used in PostgreSQL only, `drizzle` by default
  },
});
