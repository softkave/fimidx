import { get } from "lodash-es";
import type { Model, SortOrder } from "mongoose";
import { mergeObjects, type AnyObject } from "softkave-js-utils";
import { v7 as uuidv7 } from "uuid";
import type { IInputObjRecord, IObj } from "../../definitions/obj.js";
import { MongoQueryTransformer } from "../query/MongoQueryTransformer.js";
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

export class MongoObjStorage implements IObjStorage {
  private queryTransformer: MongoQueryTransformer;

  constructor(private objModel: Model<IObj>) {
    this.queryTransformer = new MongoQueryTransformer();
  }

  async create(params: CreateObjsParams): Promise<CreateObjsResult> {
    const objs = await this.objModel.insertMany(params.objs);
    return { objs };
  }

  async read(params: ReadObjsParams): Promise<ReadObjsResult> {
    const filter = this.queryTransformer.transformFilter(
      params.query,
      params.date || new Date()
    );

    const sort = params.sort
      ? this.queryTransformer.transformSort(params.sort)
      : { createdAt: -1 as SortOrder };

    const pagination = this.queryTransformer.transformPagination(
      params.page || 0,
      params.limit || 100
    );

    // Add tag filter if provided
    if (params.tag) {
      filter.tag = params.tag;
    }

    // Add deleted filter if not including deleted
    if (!params.includeDeleted) {
      filter.deletedAt = { $exists: false };
    }

    const objs = await this.objModel
      .find(filter)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      objs,
      page: params.page || 0,
      limit: params.limit || 100,
      hasMore: objs.length === pagination.limit,
    };
  }

  async update(params: UpdateObjsParams): Promise<UpdateObjsResult> {
    const filter = this.queryTransformer.transformFilter(
      params.query,
      new Date()
    );

    // Add tag filter
    if (params.tag) {
      filter.tag = params.tag;
    }

    // Add deleted filter
    filter.deletedAt = { $exists: false };

    const updateData = {
      ...params.update,
      updatedAt: new Date(),
      updatedBy: params.by,
      updatedByType: params.byType,
    };

    const result = await this.objModel.updateMany(filter, updateData);
    const updatedObjs = await this.objModel.find(filter).lean();

    return {
      updatedCount: result.modifiedCount,
      updatedObjs,
    };
  }

  async delete(params: DeleteObjsParams): Promise<DeleteObjsResult> {
    const filter = this.queryTransformer.transformFilter(
      params.query,
      params.date || new Date()
    );

    // Add tag filter
    if (params.tag) {
      filter.tag = params.tag;
    }

    // Add deleted filter
    filter.deletedAt = { $exists: false };

    const updateData = {
      deletedAt: params.date || new Date(),
      deletedBy: params.deletedBy,
      deletedByType: params.deletedByType,
    };

    const result = await this.objModel.updateMany(filter, updateData);

    return {
      deletedCount: result.modifiedCount,
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
      updateWay = "mergeButReplaceArrays",
      count,
      shouldIndex,
      fieldsToIndex,
      batchSize = 1000,
      onProgress,
    } = params;

    const date = new Date();
    const filter = this.queryTransformer.transformFilter(query, date);

    // Add tag filter
    if (tag) {
      filter.tag = tag;
    }

    // Add deleted filter
    filter.deletedAt = { $exists: false };

    const updatedObjs: IObj[] = [];
    let totalProcessed = 0;
    let page = 0;
    let isDone = false;

    while (!isDone) {
      let currentBatchSize = batchSize;
      if (count && count - totalProcessed < batchSize) {
        currentBatchSize = count - totalProcessed;
      }

      const objs = await this.objModel
        .find(filter)
        .skip(page * currentBatchSize)
        .limit(currentBatchSize)
        .sort({ createdAt: -1 })
        .lean();

      if (objs.length === 0) {
        isDone = true;
        break;
      }

      // Apply updates to each object
      const objsToUpdate = objs.map((obj) => {
        const updatedObjRecord = this.applyMergeStrategy(
          obj.objRecord,
          update,
          updateWay
        );

        return {
          id: obj.id,
          obj: {
            ...obj,
            objRecord: updatedObjRecord,
            updatedAt: date,
            updatedBy: by,
            updatedByType: byType,
            shouldIndex: shouldIndex ?? obj.shouldIndex,
            fieldsToIndex: fieldsToIndex
              ? Array.from(new Set(fieldsToIndex))
              : obj.fieldsToIndex,
          },
        };
      });

      // Perform bulk update
      await this.objModel.bulkWrite(
        objsToUpdate.map(({ id, obj }) => ({
          updateOne: {
            filter: { id },
            update: { $set: obj },
          },
        }))
      );

      updatedObjs.push(...objsToUpdate.map((item) => item.obj));
      totalProcessed += objs.length;
      page++;

      if (onProgress) {
        onProgress(totalProcessed, count || totalProcessed);
      }

      isDone = count ? totalProcessed >= count : objs.length < currentBatchSize;
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

    const filter = this.queryTransformer.transformFilter(query, date);

    // Add tag filter
    if (tag) {
      filter.tag = tag;
    }

    // Add deleted filter
    filter.deletedAt = { $exists: false };

    let totalProcessed = 0;
    let page = 0;
    let isDone = false;

    while (!isDone) {
      const objs = await this.objModel
        .find(filter)
        .skip(page * batchSize)
        .limit(batchSize)
        .sort({ createdAt: -1 })
        .lean();

      if (objs.length === 0) {
        isDone = true;
        break;
      }

      if (hardDelete) {
        // Hard delete
        await this.objModel.deleteMany({
          id: { $in: objs.map((obj) => obj.id) },
        });
      } else {
        // Soft delete
        await this.objModel.updateMany(
          { id: { $in: objs.map((obj) => obj.id) } },
          {
            $set: {
              deletedAt: date,
              deletedBy,
              deletedByType,
            },
          }
        );
      }

      totalProcessed += objs.length;
      page++;
      isDone = objs.length < batchSize;
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

    const filter = { deletedAt: { $ne: null } };
    let cleanedCount = 0;
    let page = 0;
    let isDone = false;

    while (!isDone) {
      const objs = await this.objModel
        .find(filter)
        .skip(page * batchSize)
        .limit(batchSize)
        .lean();

      if (objs.length === 0) {
        isDone = true;
        break;
      }

      // TODO: Delete objFields if they exist
      // For now, just delete the objects
      await this.objModel.deleteMany({
        id: { $in: objs.map((obj) => obj.id) },
      });

      cleanedCount += objs.length;
      page++;

      if (onProgress) {
        onProgress(cleanedCount);
      }

      isDone = objs.length < batchSize;
    }

    return { cleanedCount };
  }

  async withTransaction<T>(
    operation: (storage: IObjStorage) => Promise<T>
  ): Promise<T> {
    const session = await this.objModel.db.startSession();

    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await operation(this);
      });
      return result!;
    } finally {
      await session.endSession();
    }
  }

  // Helper methods for bulk operations

  private async findExistingObjsForBatch(params: {
    items: IInputObjRecord[];
    conflictOnKeys: string[];
    appId: string;
    tag: string;
    date: Date;
  }): Promise<(IObj | undefined)[]> {
    const { items, conflictOnKeys, appId, tag, date } = params;

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

      if (Object.keys(conflictFilter).length === 0) {
        existingObjs.push(undefined);
        continue;
      }

      const existing = await this.objModel.findOne(conflictFilter).lean();
      existingObjs.push(existing || undefined);
    }

    return existingObjs;
  }

  private buildConflictFilter(params: {
    item: IInputObjRecord;
    conflictOnKeys: string[];
    appId: string;
    tag: string;
  }): any {
    const { item, conflictOnKeys, appId, tag } = params;
    const filter: any = {
      appId,
      tag,
      deletedAt: { $exists: false },
    };

    conflictOnKeys.forEach((key) => {
      const value = get(item, key);
      if (value !== undefined) {
        filter[`objRecord.${key}`] = value;
      }
    });

    return filter;
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

    const newObjs: IObj[] = items.map((item) => ({
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

    await this.objModel.insertMany(newObjs);
    return newObjs;
  }

  private async updateExistingObjs(params: {
    existingItems: { obj: IObj; inputItem: IInputObjRecord }[];
    onConflict: string;
    date: Date;
    by: string;
    byType: string;
  }): Promise<IObj[]> {
    const { existingItems, onConflict, date, by, byType } = params;

    const objsToUpdate = existingItems.map(({ obj, inputItem }) => {
      const updatedObjRecord = this.applyMergeStrategy(
        obj.objRecord,
        inputItem,
        onConflict as any
      );

      return {
        id: obj.id,
        obj: {
          ...obj,
          objRecord: updatedObjRecord,
          updatedAt: date,
          updatedBy: by,
          updatedByType: byType,
        },
      };
    });

    await this.objModel.bulkWrite(
      objsToUpdate.map(({ id, obj }) => ({
        updateOne: {
          filter: { id },
          update: { $set: obj },
        },
      }))
    );

    return objsToUpdate.map((item) => item.obj);
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
