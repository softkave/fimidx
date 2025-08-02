import { and, eq, inArray, isNull, not, sql } from "drizzle-orm";
import { get } from "lodash-es";
import { mergeObjects, type AnyObject } from "softkave-js-utils";
import { v7 as uuidv7 } from "uuid";
import { fimidxPostgresDb, objs } from "../../db/fimidx.postgres.js";
import type { IInputObjRecord, IObj } from "../../definitions/obj.js";
import { PostgresQueryTransformer } from "../query/PostgresQueryTransformer.js";
import { mapFieldToDbColumn } from "../query/fieldMapping.js";
import type {
  BulkDeleteParams,
  BulkDeleteResult,
  BulkUpdateParams,
  BulkUpdateResult,
  BulkUpsertParams,
  BulkUpsertResult,
  CleanupDeletedObjsParams,
  CleanupResult,
  CreateObjsParams,
  CreateObjsResult,
  DeleteObjsParams,
  DeleteObjsResult,
  IObjStorage,
  ReadObjsParams,
  ReadObjsResult,
  UpdateObjsParams,
  UpdateObjsResult,
} from "../types.js";

// Do not use. It's currently untested.

export class PostgresObjStorage implements IObjStorage {
  private queryTransformer: PostgresQueryTransformer;
  private db: any;

  constructor(dbClient?: any) {
    this.queryTransformer = new PostgresQueryTransformer();
    this.db = dbClient || fimidxPostgresDb;
  }

  async create(params: CreateObjsParams): Promise<CreateObjsResult> {
    const objsToInsert = params.objs.map((obj) => ({
      id: obj.id,
      createdAt: obj.createdAt,
      createdBy: obj.createdBy,
      createdByType: obj.createdByType,
      appId: obj.appId,
      groupId: obj.groupId,
      updatedAt: obj.updatedAt,
      updatedBy: obj.updatedBy,
      updatedByType: obj.updatedByType,
      tag: obj.tag,
      objRecord: obj.objRecord,
      deletedAt: obj.deletedAt,
      deletedBy: obj.deletedBy,
      deletedByType: obj.deletedByType,
      shouldIndex: obj.shouldIndex,
      fieldsToIndex: obj.fieldsToIndex,
    }));

    const insertedObjs = await this.db
      .insert(objs)
      .values(objsToInsert)
      .returning();

    // Convert back to IObj format
    const resultObjs: IObj[] = insertedObjs.map((obj: any) => ({
      id: obj.id,
      createdAt: obj.createdAt,
      createdBy: obj.createdBy,
      createdByType: obj.createdByType,
      appId: obj.appId,
      groupId: obj.groupId,
      updatedAt: obj.updatedAt,
      updatedBy: obj.updatedBy,
      updatedByType: obj.updatedByType,
      tag: obj.tag,
      objRecord: obj.objRecord as AnyObject,
      deletedAt: obj.deletedAt,
      deletedBy: obj.deletedBy,
      deletedByType: obj.deletedByType,
      shouldIndex: obj.shouldIndex,
      fieldsToIndex: obj.fieldsToIndex,
    }));

    return { objs: resultObjs };
  }

  async read(params: ReadObjsParams): Promise<ReadObjsResult> {
    const date = params.date || new Date();
    const page = params.page || 0;
    const limit = params.limit || 100;

    // Build conditions array
    const conditions = [];

    // Add appId filter if provided
    if (params.query.appId) {
      conditions.push(eq(objs.appId, params.query.appId));
    }

    // Add tag filter if provided
    if (params.tag) {
      conditions.push(eq(objs.tag, params.tag));
    }

    // Add deleted filter if not including deleted
    if (!params.includeDeleted) {
      conditions.push(isNull(objs.deletedAt));
    }

    // Add query transformer filters
    if (
      params.query.partQuery ||
      params.query.metaQuery ||
      params.query.topLevelFields
    ) {
      // Note: For pure array fields, empty arrays are now excluded from query results (see PostgresQueryTransformer)
      const filterCondition = this.queryTransformer.transformFilter(
        params.query,
        date,
        params.fields
      );
      conditions.push(filterCondition);
    }

    // Build the complete query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderByClause = params.sort
      ? this.queryTransformer.transformSort(
          params.sort,
          params.fields ? Array.from(params.fields.values()) : undefined
        )
      : sql`${sql.identifier(mapFieldToDbColumn("createdAt"))} DESC`;

    console.log(
      "sql",
      this.db
        .select()
        .from(objs)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(page * limit)
        .toSQL()
    );

    const result = await this.db
      .select()
      .from(objs)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(page * limit);

    // Convert to IObj format
    const objsResult: IObj[] = result.map((obj: any) => ({
      id: obj.id,
      createdAt: obj.createdAt,
      createdBy: obj.createdBy,
      createdByType: obj.createdByType,
      appId: obj.appId,
      groupId: obj.groupId,
      updatedAt: obj.updatedAt,
      updatedBy: obj.updatedBy,
      updatedByType: obj.updatedByType,
      tag: obj.tag,
      objRecord: obj.objRecord as AnyObject,
      deletedAt: obj.deletedAt,
      deletedBy: obj.deletedBy,
      deletedByType: obj.deletedByType,
      shouldIndex: obj.shouldIndex,
      fieldsToIndex: obj.fieldsToIndex,
    }));

    return {
      objs: objsResult,
      page,
      limit,
      hasMore: objsResult.length === limit,
    };
  }

  async update(params: UpdateObjsParams): Promise<UpdateObjsResult> {
    const date = new Date();
    const conditions = [];
    if (params.query.appId) {
      conditions.push(eq(objs.appId, params.query.appId));
    }
    if (params.tag) {
      conditions.push(eq(objs.tag, params.tag));
    }
    conditions.push(isNull(objs.deletedAt));
    if (
      params.query.partQuery ||
      params.query.metaQuery ||
      params.query.topLevelFields
    ) {
      const filterCondition = this.queryTransformer.transformFilter(
        params.query,
        date,
        params.fields
      );
      conditions.push(filterCondition);
    }
    const whereClause = and(...conditions);
    const objsToUpdate = await this.db.select().from(objs).where(whereClause);
    if (objsToUpdate.length === 0) {
      return {
        updatedCount: 0,
        updatedObjs: [],
      };
    }
    // Prepare update data for each object
    const updateWay = params.updateWay || "replace";
    const updatedObjs: IObj[] = [];
    for (const obj of objsToUpdate as any[]) {
      const updatedObjRecord = this.applyMergeStrategy(
        obj.objRecord as AnyObject,
        params.update,
        updateWay
      );
      const updateData = {
        objRecord: updatedObjRecord,
        updatedAt: date,
        updatedBy: params.by,
        updatedByType: params.byType,
        shouldIndex: params.shouldIndex ?? obj.shouldIndex,
        fieldsToIndex:
          params.fieldsToIndex !== undefined
            ? Array.from(new Set(params.fieldsToIndex || []))
            : obj.fieldsToIndex,
      };
      const result = await this.db
        .update(objs)
        .set(updateData)
        .where(eq(objs.id, obj.id))
        .returning();
      if (result.length > 0) {
        const updatedObj = result[0];
        updatedObjs.push({
          id: updatedObj.id,
          createdAt: updatedObj.createdAt,
          createdBy: updatedObj.createdBy,
          createdByType: updatedObj.createdByType,
          appId: updatedObj.appId,
          groupId: updatedObj.groupId,
          updatedAt: updatedObj.updatedAt,
          updatedBy: updatedObj.updatedBy,
          updatedByType: updatedObj.updatedByType,
          tag: updatedObj.tag,
          objRecord: updatedObj.objRecord as AnyObject,
          deletedAt: updatedObj.deletedAt,
          deletedBy: updatedObj.deletedBy,
          deletedByType: updatedObj.deletedByType,
          shouldIndex: updatedObj.shouldIndex,
          fieldsToIndex: updatedObj.fieldsToIndex,
        });
      }
    }
    return {
      updatedCount: updatedObjs.length,
      updatedObjs,
    };
  }

  async delete(params: DeleteObjsParams): Promise<DeleteObjsResult> {
    const date = params.date || new Date();

    // Build conditions array
    const conditions = [];

    // Add appId filter if provided
    if (params.query.appId) {
      conditions.push(eq(objs.appId, params.query.appId));
    }

    // Add tag filter if provided
    if (params.tag) {
      conditions.push(eq(objs.tag, params.tag));
    }

    // Add deleted filter
    conditions.push(isNull(objs.deletedAt));

    // Add query transformer filters
    if (
      params.query.partQuery ||
      params.query.metaQuery ||
      params.query.topLevelFields
    ) {
      const filterCondition = this.queryTransformer.transformFilter(
        params.query,
        date,
        params.fields
      );
      conditions.push(filterCondition);
    }

    // Get the objects to delete first
    const whereClause = and(...conditions);
    const objsToDelete = await this.db.select().from(objs).where(whereClause);

    if (objsToDelete.length === 0) {
      return {
        deletedCount: 0,
      };
    }

    // Soft delete the objects
    const deleteConditions = objsToDelete.map((obj: IObj) =>
      eq(objs.id, obj.id)
    );
    const deleteData = {
      deletedAt: date,
      deletedBy: params.deletedBy,
      deletedByType: params.deletedByType,
    };

    const deleteResult = await this.db
      .update(objs)
      .set(deleteData)
      .where(and(...deleteConditions))
      .returning();

    return {
      deletedCount: deleteResult.length,
    };
  }

  // Phase 3: Bulk/Batch Operations Implementation

  async bulkUpsert(params: BulkUpsertParams): Promise<BulkUpsertResult> {
    const {
      items,
      conflictOnKeys = [],
      onConflict = "replace",
      tag,
      appId,
      groupId,
      createdBy,
      createdByType,
      shouldIndex = true,
      fieldsToIndex,
      batchSize = 20,
    } = params;

    const date = new Date();
    const newObjs: IObj[] = [];
    const updatedObjs: IObj[] = [];
    const ignoredItems: IInputObjRecord[] = [];
    const failedItems: IInputObjRecord[] = [];
    let totalProcessed = 0;

    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      // Find existing objects for this batch
      const existingObjs = await this.findExistingObjsForBatch({
        items: batch,
        conflictOnKeys,
        appId,
        tag,
        date,
        db: this.db,
      });

      // Group items into new and existing
      const { newItems, existingItems } = this.groupItemsIntoNewAndExisting(
        batch,
        existingObjs
      );

      // Handle new items
      if (newItems.length > 0) {
        const createdObjs = await this.createNewObjs({
          items: newItems,
          appId,
          tag,
          date,
          groupId,
          createdBy,
          createdByType,
          shouldIndex,
          fieldsToIndex,
        });
        newObjs.push(...createdObjs);
      }

      // Handle existing items based on conflict strategy
      if (existingItems.length > 0) {
        if (onConflict === "ignore") {
          ignoredItems.push(...existingItems.map((item) => item.inputItem));
        } else if (onConflict === "fail") {
          failedItems.push(...existingItems.map((item) => item.inputItem));
        } else {
          const updated = await this.updateExistingObjs({
            existingItems,
            onConflict,
            date,
            by: createdBy,
            byType: createdByType,
          });
          updatedObjs.push(...updated);
        }
      }

      totalProcessed += batch.length;
    }

    return {
      newObjs,
      updatedObjs,
      ignoredItems,
      failedItems,
      totalProcessed,
    };
  }

  async bulkUpdate(params: BulkUpdateParams): Promise<BulkUpdateResult> {
    const {
      query,
      tag,
      update,
      by,
      byType,
      updateWay = "replace",
      count,
      shouldIndex,
      fieldsToIndex,
      batchSize = 1000,
      onProgress,
    } = params;
    const date = new Date();
    const conditions = [];
    if (query.appId) {
      conditions.push(eq(objs.appId, query.appId));
    }
    if (tag) {
      conditions.push(eq(objs.tag, tag));
    }
    conditions.push(isNull(objs.deletedAt));
    if (query.partQuery || query.metaQuery || query.topLevelFields) {
      const filterCondition = this.queryTransformer.transformFilter(
        query,
        date,
        params.fields
      );
      conditions.push(filterCondition);
    }
    const whereClauseBase = and(...conditions);
    const updatedObjs: IObj[] = [];
    let totalProcessed = 0;
    let isDone = false;
    const updatedIds = new Set<string>();
    while (!isDone) {
      let currentBatchSize = batchSize;
      if (count && count - totalProcessed < batchSize) {
        currentBatchSize = count - totalProcessed;
      }
      // Exclude already updated IDs
      let whereClause = whereClauseBase;
      if (updatedIds.size > 0) {
        whereClause = and(
          whereClauseBase,
          not(inArray(objs.id, Array.from(updatedIds)))
        );
      }
      const objsToUpdate = await this.db
        .select()
        .from(objs)
        .where(whereClause)
        .limit(currentBatchSize)
        .orderBy(sql`${sql.identifier(mapFieldToDbColumn("createdAt"))} DESC`);
      if (objsToUpdate.length === 0) {
        isDone = true;
        break;
      }
      for (const obj of objsToUpdate as any[]) {
        const updatedObjRecord = this.applyMergeStrategy(
          obj.objRecord as AnyObject,
          update,
          updateWay
        );

        const updateData = {
          objRecord: updatedObjRecord,
          updatedAt: date,
          updatedBy: by,
          updatedByType: byType,
          shouldIndex: shouldIndex ?? obj.shouldIndex,
          fieldsToIndex:
            fieldsToIndex !== undefined
              ? Array.from(new Set(fieldsToIndex || []))
              : obj.fieldsToIndex,
        };
        const result = await this.db
          .update(objs)
          .set(updateData)
          .where(eq(objs.id, obj.id))
          .returning();

        if (result.length > 0) {
          const updatedObj = result[0];
          updatedObjs.push({
            id: updatedObj.id,
            createdAt: updatedObj.createdAt,
            createdBy: updatedObj.createdBy,
            createdByType: updatedObj.createdByType,
            appId: updatedObj.appId,
            groupId: updatedObj.groupId,
            updatedAt: updatedObj.updatedAt,
            updatedBy: updatedObj.updatedBy,
            updatedByType: updatedObj.updatedByType,
            tag: updatedObj.tag,
            objRecord: updatedObj.objRecord as AnyObject,
            deletedAt: updatedObj.deletedAt,
            deletedBy: updatedObj.deletedBy,
            deletedByType: updatedObj.deletedByType,
            shouldIndex: updatedObj.shouldIndex,
            fieldsToIndex: updatedObj.fieldsToIndex,
          });
          updatedIds.add(updatedObj.id);
        }
      }
      totalProcessed += objsToUpdate.length;
      if (onProgress) {
        onProgress(totalProcessed, count || totalProcessed);
      }
      isDone = count
        ? totalProcessed >= count
        : objsToUpdate.length < currentBatchSize;
    }
    return {
      updatedCount: updatedObjs.length,
      updatedObjs,
      totalProcessed,
    };
  }

  async bulkDelete(params: BulkDeleteParams): Promise<BulkDeleteResult> {
    const {
      query,
      tag,
      date = new Date(),
      deletedBy,
      deletedByType,
      deleteMany = false,
      batchSize = 1000,
      hardDelete = false,
    } = params;
    const conditions = [];
    if (query.appId) {
      conditions.push(eq(objs.appId, query.appId));
    }
    if (tag) {
      conditions.push(eq(objs.tag, tag));
    }
    conditions.push(isNull(objs.deletedAt));
    if (query.partQuery || query.metaQuery || query.topLevelFields) {
      const filterCondition = this.queryTransformer.transformFilter(
        query,
        date,
        params.fields
      );
      conditions.push(filterCondition);
    }
    const whereClause = and(...conditions);
    let totalProcessed = 0;
    let isDone = false;

    // If deleteMany is false, we only want to delete one object
    const effectiveBatchSize = deleteMany ? batchSize : 1;

    while (!isDone) {
      // Always fetch from the start, don't use offset
      const objsToDelete = await this.db
        .select()
        .from(objs)
        .where(whereClause)
        .limit(effectiveBatchSize)
        .orderBy(sql`${sql.identifier(mapFieldToDbColumn("createdAt"))} DESC`);
      if (objsToDelete.length === 0) {
        isDone = true;
        break;
      }
      const objIds = objsToDelete.map((obj: any) => obj.id);
      if (hardDelete) {
        await this.db.delete(objs).where(inArray(objs.id, objIds));
      } else {
        await this.db
          .update(objs)
          .set({
            deletedAt: date,
            deletedBy,
            deletedByType,
          })
          .where(inArray(objs.id, objIds));
      }
      totalProcessed += objsToDelete.length;

      // If deleteMany is false, we're done after processing one batch
      if (!deleteMany) {
        isDone = true;
      } else {
        isDone = objsToDelete.length < effectiveBatchSize;
      }
    }
    return {
      deletedCount: totalProcessed,
      totalProcessed,
    };
  }

  async cleanupDeletedObjs(
    params?: CleanupDeletedObjsParams
  ): Promise<CleanupResult> {
    const { batchSize = 1000, onProgress } = params || {};
    let cleanedCount = 0;
    let page = 0;
    let isDone = false;

    while (!isDone) {
      const objsToCleanup = await this.db
        .select()
        .from(objs)
        .where(not(isNull(objs.deletedAt)))
        .limit(batchSize)
        .offset(page * batchSize);

      if (objsToCleanup.length === 0) {
        isDone = true;
        break;
      }

      // TODO: Delete objFields if they exist
      // For now, just delete the objects
      const objIds = objsToCleanup.map((obj: any) => obj.id);
      await this.db.delete(objs).where(inArray(objs.id, objIds));

      cleanedCount += objsToCleanup.length;
      page++;

      if (onProgress) {
        onProgress(cleanedCount);
      }

      isDone = objsToCleanup.length < batchSize;
    }

    return { cleanedCount };
  }

  async withTransaction<T>(
    operation: (storage: IObjStorage) => Promise<T>
  ): Promise<T> {
    return await this.db.transaction(async (tx: any) => {
      // Create a new instance with the transaction context
      const txStorage = new PostgresObjStorage(tx);
      return await operation(txStorage);
    });
  }

  // Helper methods for bulk operations

  private async findExistingObjsForBatch(params: {
    items: IInputObjRecord[];
    conflictOnKeys: string[];
    appId: string;
    tag: string;
    date: Date;
    db?: any;
  }): Promise<(IObj | undefined)[]> {
    const { items, conflictOnKeys, appId, tag, date, db } = params;
    const dbClient = db || this.db;

    if (!conflictOnKeys.length) {
      return new Array(items.length).fill(undefined);
    }

    const existingObjs: (IObj | undefined)[] = [];

    for (const item of items) {
      const conflictFilter = this.buildConflictFilter({
        item,
        conflictOnKeys,
        appId,
        tag,
      });

      if (conflictFilter.length === 0) {
        existingObjs.push(undefined);
        continue;
      }

      const result = await dbClient
        .select()
        .from(objs)
        .where(and(...conflictFilter))
        .limit(1);

      const existing = result.length > 0 ? result[0] : null;
      existingObjs.push(
        existing
          ? {
              id: existing.id,
              createdAt: existing.createdAt,
              createdBy: existing.createdBy,
              createdByType: existing.createdByType,
              appId: existing.appId,
              groupId: existing.groupId,
              updatedAt: existing.updatedAt,
              updatedBy: existing.updatedBy,
              updatedByType: existing.updatedByType,
              tag: existing.tag,
              objRecord: existing.objRecord as AnyObject,
              deletedAt: existing.deletedAt,
              deletedBy: existing.deletedBy,
              deletedByType: existing.deletedByType,
              shouldIndex: existing.shouldIndex,
              fieldsToIndex: existing.fieldsToIndex,
            }
          : undefined
      );
    }

    return existingObjs;
  }

  private buildConflictFilter(params: {
    item: IInputObjRecord;
    conflictOnKeys: string[];
    appId: string;
    tag: string;
  }): any[] {
    const { item, conflictOnKeys, appId, tag } = params;
    const conditions = [
      eq(objs.appId, appId),
      eq(objs.tag, tag),
      isNull(objs.deletedAt),
    ];

    conflictOnKeys.forEach((key) => {
      const value = get(item, key);
      if (value !== undefined) {
        // For PostgreSQL, we need to use JSON operators to query nested fields
        conditions.push(sql`obj_record->>${key} = ${value}`);
      }
    });

    return conditions;
  }

  private groupItemsIntoNewAndExisting(
    items: IInputObjRecord[],
    existingObjs: (IObj | undefined)[]
  ): {
    newItems: IInputObjRecord[];
    existingItems: { obj: IObj; inputItem: IInputObjRecord }[];
  } {
    const newItems: IInputObjRecord[] = [];
    const existingItems: { obj: IObj; inputItem: IInputObjRecord }[] = [];

    items.forEach((item, index) => {
      const existingObj = existingObjs[index];
      if (existingObj) {
        existingItems.push({ obj: existingObj, inputItem: item });
      } else {
        newItems.push(item);
      }
    });

    return { newItems, existingItems };
  }

  private async createNewObjs(params: {
    items: IInputObjRecord[];
    appId: string;
    tag: string;
    date: Date;
    groupId: string;
    createdBy: string;
    createdByType: string;
    shouldIndex: boolean;
    fieldsToIndex?: string[];
  }): Promise<IObj[]> {
    const {
      items,
      appId,
      tag,
      date,
      groupId,
      createdBy,
      createdByType,
      shouldIndex,
      fieldsToIndex,
    } = params;

    const objsToInsert = items.map((item) => ({
      id: uuidv7(),
      appId,
      tag,
      groupId,
      createdAt: date,
      createdBy,
      createdByType,
      updatedAt: date,
      updatedBy: createdBy,
      updatedByType: createdByType,
      objRecord: item,
      deletedAt: null,
      deletedBy: null,
      deletedByType: null,
      shouldIndex,
      fieldsToIndex: fieldsToIndex ? Array.from(new Set(fieldsToIndex)) : null,
    }));

    const insertedObjs = await this.db
      .insert(objs)
      .values(objsToInsert)
      .returning();

    // Convert back to IObj format
    return insertedObjs.map((obj: IObj) => ({
      id: obj.id,
      createdAt: obj.createdAt,
      createdBy: obj.createdBy,
      createdByType: obj.createdByType,
      appId: obj.appId,
      groupId: obj.groupId,
      updatedAt: obj.updatedAt,
      updatedBy: obj.updatedBy,
      updatedByType: obj.updatedByType,
      tag: obj.tag,
      objRecord: obj.objRecord as AnyObject,
      deletedAt: obj.deletedAt,
      deletedBy: obj.deletedBy,
      deletedByType: obj.deletedByType,
      shouldIndex: obj.shouldIndex,
      fieldsToIndex: obj.fieldsToIndex,
    }));
  }

  private async updateExistingObjs(params: {
    existingItems: { obj: IObj; inputItem: IInputObjRecord }[];
    onConflict: string;
    date: Date;
    by: string;
    byType: string;
  }): Promise<IObj[]> {
    const { existingItems, onConflict, date, by, byType } = params;
    const updatedObjs: IObj[] = [];

    for (const { obj, inputItem } of existingItems) {
      const updatedObjRecord = this.applyMergeStrategy(
        obj.objRecord,
        inputItem,
        onConflict as any
      );

      const updateData = {
        objRecord: updatedObjRecord,
        updatedAt: date,
        updatedBy: by,
        updatedByType: byType,
      };

      const result = await this.db
        .update(objs)
        .set(updateData)
        .where(eq(objs.id, obj.id))
        .returning();

      if (result.length > 0) {
        const updatedObj = result[0];
        updatedObjs.push({
          id: updatedObj.id,
          createdAt: updatedObj.createdAt,
          createdBy: updatedObj.createdBy,
          createdByType: updatedObj.createdByType,
          appId: updatedObj.appId,
          groupId: updatedObj.groupId,
          updatedAt: updatedObj.updatedAt,
          updatedBy: updatedObj.updatedBy,
          updatedByType: updatedObj.updatedByType,
          tag: updatedObj.tag,
          objRecord: updatedObj.objRecord as AnyObject,
          deletedAt: updatedObj.deletedAt,
          deletedBy: updatedObj.deletedBy,
          deletedByType: updatedObj.deletedByType,
          shouldIndex: updatedObj.shouldIndex,
          fieldsToIndex: updatedObj.fieldsToIndex,
        });
      }
    }

    return updatedObjs;
  }

  private applyMergeStrategy(
    existingRecord: AnyObject,
    updateRecord: AnyObject,
    strategy: string
  ): AnyObject {
    switch (strategy) {
      case "replace":
        return updateRecord;
      case "merge":
        return { ...existingRecord, ...updateRecord };
      case "mergeButReplaceArrays":
        return mergeObjects(existingRecord, updateRecord, {
          arrayUpdateStrategy: "replace",
        });
      case "mergeButConcatArrays":
        return mergeObjects(existingRecord, updateRecord, {
          arrayUpdateStrategy: "concat",
        });
      case "mergeButKeepArrays":
        return mergeObjects(existingRecord, updateRecord, {
          arrayUpdateStrategy: "retain",
        });
      default:
        return existingRecord;
    }
  }
}
