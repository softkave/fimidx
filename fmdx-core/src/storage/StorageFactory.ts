import { MongoObjStorage } from "./mongo/MongoObjStorage.js";
import { PostgresObjStorage } from "./postgresql/PostgresObjStorage.js";
import type { IObjStorage, StorageConfig } from "./types.js";

export class StorageFactory {
  static createStorage(config: StorageConfig): IObjStorage {
    switch (config.type) {
      case "mongo":
        if (!config.mongoModel) {
          throw new Error("MongoDB model is required for MongoDB storage");
        }
        return new MongoObjStorage(config.mongoModel);

      case "postgres":
        return new PostgresObjStorage();

      default:
        throw new Error(`Unsupported storage type: ${config.type}`);
    }
  }
}
