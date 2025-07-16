import { and, eq } from "drizzle-orm";
import { db, objFields as objFieldsTable } from "../../../db/fmdx.sqlite.js";
import { kObjTags } from "../../../definitions/obj.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";

// Global test counter to ensure uniqueness across all test files
let globalTestCounter = 0;

export function getUniqueTestId(): string {
  globalTestCounter++;
  return `${globalTestCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
}

export function makeUniqueAppId(prefix: string): string {
  return `${prefix}_${getUniqueTestId()}`;
}

// Comprehensive cleanup function that cleans all related log data
export async function cleanupTestData(params: {
  storage: IObjStorage;
  appIds: string[];
  by: string;
  byType: string;
}): Promise<void> {
  const { storage, appIds, by, byType } = params;

  try {
    for (const appId of appIds) {
      // Clean up logs
      await storage.bulkDelete({
        query: { appId },
        tag: kObjTags.log,
        deletedBy: by,
        deletedByType: byType,
        deleteMany: true,
        hardDelete: true, // Use hard delete for complete test isolation
      });
      // Clean up objFields for this appId/tag
      try {
        await db
          .delete(objFieldsTable)
          .where(
            and(
              eq(objFieldsTable.appId, appId),
              eq(objFieldsTable.tag, kObjTags.log)
            )
          )
          .execute();
      } catch (error) {
        // Ignore errors in cleanup
      }
    }
  } catch (error) {
    // Log but don't throw - cleanup errors shouldn't fail tests
    console.warn("Cleanup warning:", error);
  }
}

// Test setup helper that creates isolated storage and cleanup functions
export function createTestSetup(params: {
  testName: string;
  defaultBy?: string;
  defaultByType?: string;
}) {
  const { testName, defaultBy = "tester", defaultByType = "user" } = params;

  // Create unique identifiers for this test suite
  const uniqueId = getUniqueTestId();
  const appId = makeUniqueAppId(testName);

  // Create storage instance
  const storage = createDefaultStorage();

  // Create cleanup function
  const cleanup = async () => {
    await cleanupTestData({
      storage,
      appIds: [appId],
      by: defaultBy,
      byType: defaultByType,
    });
  };

  return {
    storage,
    cleanup,
    testData: {
      appId,
      by: defaultBy,
      byType: defaultByType,
      uniqueId,
    },
  };
}

// Helper to create test data with unique identifiers
export function makeTestData(params: {
  testName: string;
  overrides?: Record<string, any>;
}) {
  const { testName, overrides = {} } = params;
  const uniqueId = getUniqueTestId();

  return {
    appId: makeUniqueAppId(testName),
    ...overrides,
  };
}
