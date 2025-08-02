import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { db, objFields as objFieldsTable } from "../../../db/fimidx.sqlite.js";
import { kObjTags } from "../../../definitions/obj.js";
import type { DeletePermissionsEndpointArgs } from "../../../definitions/permission.js";
import { createDefaultStorage } from "../../../storage/config.js";
import type { IObjStorage } from "../../../storage/types.js";
import { addPermissions } from "../addPermissions.js";
import { deletePermissions } from "../deletePermissions.js";
import { getPermissions } from "../getPermissions.js";

const defaultAppId = "test-app-deletePermissions";
const defaultGroupId = "test-group";
const defaultBy = "tester";
const defaultByType = "user";

// Test counter to ensure unique permissions
let testCounter = 0;

function makeAddPermissionsArgs(overrides: any = {}): any {
  testCounter++;
  const uniqueId = `${testCounter}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  return {
    appId: defaultAppId,
    permissions: [
      {
        entity: "user",
        action: "read",
        target: "document",
        description: "Test permission",
        meta: { key: "value" },
      },
    ],
    ...overrides,
  };
}

function makeDeletePermissionsArgs(
  overrides: Partial<DeletePermissionsEndpointArgs> = {}
): DeletePermissionsEndpointArgs {
  return {
    query: {
      appId: defaultAppId,
      ...overrides.query,
    },
    deleteMany: overrides.deleteMany,
  };
}

// Helper function to insert objFields for the "action" field for sorting
async function insertActionFieldForSorting(params: {
  groupId: string;
  tag: string;
}) {
  const { groupId, tag } = params;
  const now = new Date();

  const actionField = {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
    appId: defaultAppId,
    groupId,
    tag,
    field: "action",
    path: "action",
    type: "string",
    arrayTypes: [],
    isArrayCompressed: false,
    fieldKeys: ["action"],
    fieldKeyTypes: ["string"],
    valueTypes: ["string"],
  };

  // Insert the field definition
  await db.insert(objFieldsTable).values(actionField);

  return actionField;
}

describe("deletePermissions integration", () => {
  let storage: IObjStorage;
  let cleanup: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    storage = createDefaultStorage();

    if (
      process.env.FIMIDX_STORAGE_TYPE === "mongo" ||
      !process.env.FIMIDX_STORAGE_TYPE
    ) {
      cleanup = async () => {
        // Cleanup will be handled by the storage interface
      };
    }
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  beforeEach(async () => {
    try {
      await storage.bulkDelete({
        query: { appId: defaultAppId },
        tag: kObjTags.permission,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true,
      });

      // Clean up objFields for test group
      await db
        .delete(objFieldsTable)
        .where(
          and(
            eq(objFieldsTable.appId, defaultAppId),
            eq(objFieldsTable.groupId, defaultGroupId),
            eq(objFieldsTable.tag, kObjTags.permission)
          )
        );
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  afterEach(async () => {
    try {
      await storage.bulkDelete({
        query: { appId: defaultAppId },
        tag: kObjTags.permission,
        deletedBy: defaultBy,
        deletedByType: defaultByType,
        deleteMany: true,
        hardDelete: true,
      });

      // Clean up objFields for test group
      await db
        .delete(objFieldsTable)
        .where(
          and(
            eq(objFieldsTable.appId, defaultAppId),
            eq(objFieldsTable.groupId, defaultGroupId),
            eq(objFieldsTable.tag, kObjTags.permission)
          )
        );
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  it("deletes a single permission by entity", async () => {
    // Create test permission
    const addArgs = makeAddPermissionsArgs({
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
          description: "Test permission",
        },
      ],
    });

    await addPermissions({
      args: addArgs,
      groupId: defaultGroupId,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify permission exists
    const getArgsBefore = {
      query: {
        appId: defaultAppId,
        entity: { eq: "user" },
      },
    };

    const resultBefore = await getPermissions({
      args: getArgsBefore,
      storage,
    });

    expect(resultBefore.permissions).toHaveLength(1);

    // Delete the permission
    const deleteArgs = makeDeletePermissionsArgs({
      query: {
        appId: defaultAppId,
        entity: { eq: "user" },
      },
      deleteMany: false,
    });

    await deletePermissions({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify permission is deleted
    const getArgsAfter = {
      query: {
        appId: defaultAppId,
        entity: { eq: "user" },
      },
    };

    const resultAfter = await getPermissions({
      args: getArgsAfter,
      storage,
    });

    expect(resultAfter.permissions).toHaveLength(0);
  });

  it("deletes a single permission by action", async () => {
    // Create test permission
    const addArgs = makeAddPermissionsArgs({
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
          description: "Test permission",
        },
      ],
    });

    await addPermissions({
      args: addArgs,
      groupId: defaultGroupId,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Delete the permission
    const deleteArgs = makeDeletePermissionsArgs({
      query: {
        appId: defaultAppId,
        action: { eq: "read" },
      },
      deleteMany: false,
    });

    await deletePermissions({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify permission is deleted
    const getArgsAfter = {
      query: {
        appId: defaultAppId,
        action: { eq: "read" },
      },
    };

    const resultAfter = await getPermissions({
      args: getArgsAfter,
      storage,
    });

    expect(resultAfter.permissions).toHaveLength(0);
  });

  it("deletes a single permission by target", async () => {
    // Create test permission
    const addArgs = makeAddPermissionsArgs({
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
          description: "Test permission",
        },
      ],
    });

    await addPermissions({
      args: addArgs,
      groupId: defaultGroupId,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Delete the permission
    const deleteArgs = makeDeletePermissionsArgs({
      query: {
        appId: defaultAppId,
        target: { eq: "document" },
      },
      deleteMany: false,
    });

    await deletePermissions({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify permission is deleted
    const getArgsAfter = {
      query: {
        appId: defaultAppId,
        target: { eq: "document" },
      },
    };

    const resultAfter = await getPermissions({
      args: getArgsAfter,
      storage,
    });

    expect(resultAfter.permissions).toHaveLength(0);
  });

  it("deletes multiple permissions when deleteMany is true", async () => {
    // Create multiple test permissions
    const addArgs = makeAddPermissionsArgs({
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
          description: "User read permission",
        },
        {
          entity: "user",
          action: "write",
          target: "document",
          description: "User write permission",
        },
        {
          entity: "admin",
          action: "delete",
          target: "document",
          description: "Admin delete permission",
        },
      ],
    });

    await addPermissions({
      args: addArgs,
      groupId: defaultGroupId,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify all permissions exist
    const getArgsBefore = {
      query: {
        appId: defaultAppId,
      },
    };

    const resultBefore = await getPermissions({
      args: getArgsBefore,
      storage,
    });

    expect(resultBefore.permissions).toHaveLength(3);

    // Delete all user permissions
    const deleteArgs = makeDeletePermissionsArgs({
      query: {
        appId: defaultAppId,
        entity: { eq: "user" },
      },
      deleteMany: true,
    });

    await deletePermissions({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only admin permission remains
    const getArgsAfter = {
      query: {
        appId: defaultAppId,
      },
    };

    const resultAfter = await getPermissions({
      args: getArgsAfter,
      storage,
    });

    expect(resultAfter.permissions).toHaveLength(1);
    expect(resultAfter.permissions[0].entity).toBe("admin");
    expect(resultAfter.permissions[0].action).toBe("delete");
  });

  it("deletes only one permission when deleteMany is false", async () => {
    // Create multiple test permissions
    const addArgs = makeAddPermissionsArgs({
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
          description: "User read permission",
        },
        {
          entity: "user",
          action: "write",
          target: "document",
          description: "User write permission",
        },
      ],
    });

    await addPermissions({
      args: addArgs,
      groupId: defaultGroupId,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify both permissions exist
    const getArgsBefore = {
      query: {
        appId: defaultAppId,
        entity: { eq: "user" },
      },
    };

    const resultBefore = await getPermissions({
      args: getArgsBefore,
      storage,
    });

    expect(resultBefore.permissions).toHaveLength(2);

    // Delete only one permission
    const deleteArgs = makeDeletePermissionsArgs({
      query: {
        appId: defaultAppId,
        entity: { eq: "user" },
      },
      deleteMany: false,
    });

    await deletePermissions({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify only one permission remains
    const getArgsAfter = {
      query: {
        appId: defaultAppId,
        entity: { eq: "user" },
      },
    };

    const resultAfter = await getPermissions({
      args: getArgsAfter,
      storage,
    });

    expect(resultAfter.permissions).toHaveLength(1);
  });

  it("deletes permissions by createdBy", async () => {
    // Create test permission
    const addArgs = makeAddPermissionsArgs({
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
          description: "Test permission",
        },
      ],
    });

    await addPermissions({
      args: addArgs,
      groupId: defaultGroupId,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Delete by createdBy
    const deleteArgs = makeDeletePermissionsArgs({
      query: {
        appId: defaultAppId,
        createdBy: { eq: defaultBy },
      },
      deleteMany: true,
    });

    await deletePermissions({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify permission is deleted
    const getArgsAfter = {
      query: {
        appId: defaultAppId,
        createdBy: { eq: defaultBy },
      },
    };

    const resultAfter = await getPermissions({
      args: getArgsAfter,
      storage,
    });

    expect(resultAfter.permissions).toHaveLength(0);
  });

  it("deletes permissions with complex entity objects", async () => {
    // Create test permission with complex entity
    const addArgs = makeAddPermissionsArgs({
      permissions: [
        {
          entity: { type: "user", id: "123" },
          action: "read",
          target: "document",
          description: "Complex permission",
        },
      ],
    });

    await addPermissions({
      args: addArgs,
      groupId: defaultGroupId,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Delete by complex entity query
    const deleteArgs = makeDeletePermissionsArgs({
      query: {
        appId: defaultAppId,
        entity: [{ op: "eq" as const, field: "type", value: "user" }],
      },
      deleteMany: true,
    });

    await deletePermissions({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify permission is deleted
    const getArgsAfter = {
      query: {
        appId: defaultAppId,
        entity: [{ op: "eq" as const, field: "type", value: "user" }],
      },
    };

    const resultAfter = await getPermissions({
      args: getArgsAfter,
      storage,
    });

    expect(resultAfter.permissions).toHaveLength(0);
  });

  it("handles deletion of non-existent permissions gracefully", async () => {
    // Try to delete non-existent permission
    const deleteArgs = makeDeletePermissionsArgs({
      query: {
        appId: defaultAppId,
        entity: { eq: "non-existent" },
      },
      deleteMany: false,
    });

    // This should not throw an error
    await expect(
      deletePermissions({
        ...deleteArgs,
        by: defaultBy,
        byType: defaultByType,
        storage,
      })
    ).resolves.not.toThrow();
  });

  it("deletes all permissions for an app", async () => {
    // Create multiple test permissions
    const addArgs = makeAddPermissionsArgs({
      permissions: [
        {
          entity: "user",
          action: "read",
          target: "document",
        },
        {
          entity: "admin",
          action: "delete",
          target: "document",
        },
        {
          entity: "guest",
          action: "view",
          target: "document",
        },
      ],
    });

    await addPermissions({
      args: addArgs,
      groupId: defaultGroupId,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify all permissions exist
    const getArgsBefore = {
      query: {
        appId: defaultAppId,
      },
    };

    const resultBefore = await getPermissions({
      args: getArgsBefore,
      storage,
    });

    expect(resultBefore.permissions).toHaveLength(3);

    // Delete all permissions for the app
    const deleteArgs = makeDeletePermissionsArgs({
      query: {
        appId: defaultAppId,
      },
      deleteMany: true,
    });

    await deletePermissions({
      ...deleteArgs,
      by: defaultBy,
      byType: defaultByType,
      storage,
    });

    // Verify all permissions are deleted
    const getArgsAfter = {
      query: {
        appId: defaultAppId,
      },
    };

    const resultAfter = await getPermissions({
      args: getArgsAfter,
      storage,
    });

    expect(resultAfter.permissions).toHaveLength(0);
  });
});
