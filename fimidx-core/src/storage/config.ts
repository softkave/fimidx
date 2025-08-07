import { getCoreConfig } from "../common/getCoreConfig.js";
import { getObjModel } from "../db/fimidx.mongo.js";
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

export function getDefaultStorageType(): "mongo" | "postgres" {
  const { storage } = getCoreConfig();
  if (!storage?.type) {
    return "mongo";
  }
  if (storage.type === "mongo") {
    return "mongo";
  } else if (storage.type === "postgres") {
    return "postgres";
  }
  throw new Error(`Unsupported storage type: ${storage.type}`);
}

// Default storage configuration from environment variables
export function createDefaultStorage(): IObjStorage {
  const { storage } = getCoreConfig();

  return createStorage({
    type: storage?.type || "postgres",
  });
}
