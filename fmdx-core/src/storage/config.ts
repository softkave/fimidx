import { getObjModel } from "../db/mongo.js";
import { StorageFactory } from "./StorageFactory.js";
import type { IObjStorage } from "./types.js";

export interface StorageOptions {
  type: "mongo" | "postgres";
}

export function createStorage(options: StorageOptions): IObjStorage {
  switch (options.type) {
    case "mongo":
      return StorageFactory.createStorage({
        type: "mongo",
        mongoModel: getObjModel(),
      });

    case "postgres":
      return StorageFactory.createStorage({
        type: "postgres",
      });

    default:
      throw new Error(`Unsupported storage type: ${options.type}`);
  }
}

// Default storage configuration from environment variables
export function createDefaultStorage(): IObjStorage {
  const storageType = process.env.FMDX_STORAGE_TYPE || "mongo";

  return createStorage({
    type: storageType as "mongo" | "postgres",
  });
}
