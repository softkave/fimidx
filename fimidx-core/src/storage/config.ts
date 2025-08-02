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
  const storageType = process.env.FIMIDX_STORAGE_TYPE;
  if (!storageType) {
    return "mongo";
  }
  if (storageType === "mongo") {
    return "mongo";
  } else if (storageType === "postgres") {
    return "postgres";
  }
  throw new Error(`Unsupported storage type: ${storageType}`);
}

// Default storage configuration from environment variables
export function createDefaultStorage(): IObjStorage {
  const storageType = process.env.FIMIDX_STORAGE_TYPE || "postgres";

  return createStorage({
    type: storageType as "mongo" | "postgres",
  });
}
