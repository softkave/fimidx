import { and, eq, inArray } from "drizzle-orm";
import { forEach } from "lodash-es";
import type { FilterQuery } from "mongoose";
import { indexJson } from "softkave-js-utils";
import { v7 as uuidv7 } from "uuid";
import {
  db,
  objFields as objFieldsTable,
  objParts as objPartsTable,
} from "../../db/fmdx-schema.js";
import { objModel } from "../../db/mongo.js";
import type { ICallback } from "../../definitions/callback.js";
import type { IObj, IObjField, IObjPart } from "../../definitions/obj.js";

async function indexObjFields(params: {
  objs: IObj[];
  indexList: ReturnType<typeof indexJson>[];
}) {
  const { objs, indexList } = params;

  type IWorkingObjField = {
    field: string;
    fieldKeys: Array<string | number>;
    fieldKeyTypes: string[];
    valueTypes: Set<string>;
    appId: string;
    orgId: string;
    tag: string;
    createdAt: Date;
    updatedAt: Date;
  };

  const fieldsSet = new Map<string, IWorkingObjField>();
  indexList.forEach((index, objIndex) => {
    const obj = objs[objIndex];
    forEach(index, (value, stringKey) => {
      let field: IWorkingObjField | undefined = fieldsSet.get(stringKey);

      if (!field) {
        field = {
          field: stringKey,
          fieldKeys: value.key,
          fieldKeyTypes: value.keyType,
          valueTypes: new Set<string>(),
          appId: obj.appId,
          orgId: obj.orgId,
          tag: obj.tag,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
        };
        fieldsSet.set(stringKey, field);
      }

      value.valueType.forEach((type) => {
        field.valueTypes.add(type);
      });
    });
  });

  const fields = Array.from(fieldsSet.values());

  let batchSize = 100;
  let batchIndex = 0;
  while (batchIndex < fields.length) {
    const batch = fields.slice(batchIndex, batchIndex + batchSize);
    // const existingFields = await objFieldModel.find({
    //   field: { $in: batch.map((field) => field.field) },
    // });
    const existingFields = await db
      .select()
      .from(objFieldsTable)
      .where(
        inArray(
          objFieldsTable.field,
          batch.map((field) => field.field)
        )
      )
      .limit(batchSize);
    const existingFieldsMap = new Map<string, IObjField>(
      existingFields.map((field) => [field.field, field])
    );
    const newFields: IObjField[] = [];
    const existingFieldsToUpdate: Array<{
      id: string;
      obj: Partial<IObjField>;
    }> = [];
    batch.forEach((field) => {
      const existingField = existingFieldsMap.get(field.field);
      if (existingField) {
        existingFieldsToUpdate.push({
          id: existingField.id,
          obj: {
            valueTypes: Array.from(
              new Set([...existingField.valueTypes, ...field.valueTypes])
            ),
            updatedAt: field.updatedAt,
          },
        });
      } else {
        newFields.push({
          id: uuidv7(),
          appId: field.appId,
          tag: field.tag,
          orgId: field.orgId,
          createdAt: field.createdAt,
          updatedAt: field.updatedAt,
          field: field.field,
          fieldKeys: field.fieldKeys as string[],
          fieldKeyTypes: field.fieldKeyTypes,
          valueTypes: Array.from(field.valueTypes),
        });
      }
    });
    // await Promise.all([
    //   objFieldModel.insertMany(newFields),
    //   objFieldModel.bulkWrite(
    //     existingFieldsToUpdate.map(({ id, obj }) => ({
    //       updateOne: {
    //         filter: { id },
    //         update: { $set: obj },
    //       },
    //     }))
    //   ),
    // ]);
    await db.batch([
      db.insert(objFieldsTable).values(newFields),
      ...existingFieldsToUpdate.map(({ id, obj }) =>
        db.update(objFieldsTable).set(obj).where(eq(objFieldsTable.id, id))
      ),
    ]);
    batchIndex += batchSize;
  }
}

function getValueType(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  return typeof value;
}

async function indexObjParts(params: {
  objs: IObj[];
  indexList: ReturnType<typeof indexJson>[];
}) {
  const { objs, indexList } = params;

  const parts: IObjPart[] = [];

  indexList.forEach((index, objIndex) => {
    const obj = objs[objIndex];
    forEach(index, (value, stringKey) => {
      value.value.forEach((partValue) => {
        const type = getValueType(partValue);
        const part: IObjPart = {
          id: uuidv7(),
          objId: obj.id,
          field: stringKey,
          value: String(partValue),
          valueBoolean: type === "boolean" ? Boolean(partValue) : undefined,
          valueNumber: type === "number" ? Number(partValue) : undefined,
          type,
          appId: obj.appId,
          orgId: obj.orgId,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
          tag: obj.tag,
        };

        parts.push(part);
      });
    });
  });

  let batchSize = 100;
  let batchIndex = 0;
  while (batchIndex < parts.length) {
    const batch = parts.slice(batchIndex, batchIndex + batchSize);
    const existingParts = await db
      .select()
      .from(objPartsTable)
      .where(
        and(
          inArray(
            objPartsTable.objId,
            batch.map((part) => part.objId)
          ),
          inArray(
            objPartsTable.field,
            batch.map((part) => part.field)
          )
        )
      );
    const existingPartsMap = new Map<string, IObjPart>(
      existingParts.map((part) => [`${part.objId}-${part.field}`, part])
    );
    const newParts: IObjPart[] = [];
    const existingPartsToUpdate: Array<{
      id: string;
      obj: Partial<IObjPart>;
    }> = [];
    batch.forEach((part) => {
      const existingPart = existingPartsMap.get(`${part.objId}-${part.field}`);
      if (existingPart) {
        existingPartsToUpdate.push({
          id: existingPart.id as string,
          obj: {
            value: part.value,
            valueBoolean: part.valueBoolean,
            valueNumber: part.valueNumber,
            type: part.type,
            updatedAt: part.updatedAt,
          },
        });
      } else {
        newParts.push(part);
      }
    });
    await db.batch([
      db.insert(objPartsTable).values(newParts),
      ...existingPartsToUpdate.map(({ id, obj }) =>
        db.update(objPartsTable).set(obj).where(eq(objPartsTable.id, id))
      ),
    ]);
    batchIndex += batchSize;
  }
}

export async function indexObjs(params: { callback: ICallback }) {
  const { callback } = params;
  const filter: FilterQuery<IObj> = {
    updatedAt: {
      $gte: callback.lastSuccessAt ?? new Date("1970-01-01T00:00:00.000Z"),
    },
  };

  let batch: IObj[] = [];
  const batchSize = 1000;
  let page = 0;
  do {
    batch = await objModel
      .find(filter)
      .skip(page * batchSize)
      .limit(batchSize)
      .exec();

    // TODO: eventually move to or make a background job service to avoid
    // blocking the server
    const indexList = batch.map((obj) => {
      return indexJson(obj.objRecord, { flattenNumericKeys: false });
    });

    await indexObjFields({ objs: batch, indexList });
    await indexObjParts({ objs: batch, indexList });
  } while (batch.length > 0);
}
