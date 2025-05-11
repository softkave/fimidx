import {
  db,
  logFields as logFieldsTable,
  logParts as logPartsTable,
  logs as logsTable,
} from "@/src/db/fmlogs-schema";
import { ILog, ILogPart, InputLogRecordArray } from "@/src/definitions/log";
import { kAgentTypes } from "@/src/definitions/other";
import assert from "assert";
import { and, eq, inArray } from "drizzle-orm";
import { forEach } from "lodash-es";
import { indexJson } from "softkave-js-utils";
import { v7 as uuidv7 } from "uuid";

type IWorkingLogField = {
  name: string;
  nameType: string;
  type: Set<string>;
};

function getValueType(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  return typeof value;
}

export async function saveLogFields(params: {
  appId: string;
  inputFields: IWorkingLogField[];
  orgId: string;
}) {
  const { appId, inputFields, orgId } = params;
  const existingFields = await db
    .select()
    .from(logFieldsTable)
    .where(
      and(
        eq(logFieldsTable.appId, appId),
        inArray(
          logFieldsTable.name,
          inputFields.map((field) => field.name)
        )
      )
    );

  const existingFieldsMap = new Map(
    existingFields.map((field) => [field.name, field])
  );

  const newFields = inputFields
    .filter((field) => !existingFieldsMap.has(field.name))
    .map((field): typeof logFieldsTable.$inferInsert => ({
      appId,
      createdAt: new Date(),
      name: field.name,
      nameType: field.nameType,
      valueType: Array.from(field.type).join(","),
      updatedAt: new Date(),
      orgId,
    }));

  const updatedFields = inputFields
    .filter((field) => existingFieldsMap.has(field.name))
    .map((field) => {
      const existingField = existingFieldsMap.get(field.name);
      assert(existingField);

      const splitValueTypes = existingField.valueType.split(",");
      const newTypes = Array.from(field.type);
      const updatedTypes = new Set([...splitValueTypes, ...newTypes]);

      return {
        ...existingField,
        valueType: Array.from(updatedTypes).join(","),
        updatedAt: new Date(),
      };
    });

  await Promise.all([
    newFields.length > 0 && db.insert(logFieldsTable).values(newFields),
    ...updatedFields.map((field) =>
      db
        .update(logFieldsTable)
        .set({ valueType: field.valueType, updatedAt: field.updatedAt })
        .where(eq(logFieldsTable.id, field.id))
    ),
  ]);
}

export async function saveLogParts(params: { parts: ILogPart[] }) {
  const { parts } = params;
  await db.insert(logPartsTable).values(parts);
}

export async function saveLogs(params: { logs: ILog[] }) {
  const { logs } = params;
  await db.insert(logsTable).values(logs);
}

function getDateFromTimestamp(
  timestamp: number | string | Date,
  defaultDate: Date
) {
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? defaultDate : date;
}

export async function addLogs(params: {
  appId: string;
  inputLogs: InputLogRecordArray;
  clientTokenId: string;
  orgId: string;
}) {
  const { appId, inputLogs, clientTokenId, orgId } = params;
  const timestamp = new Date();

  // TODO: eventually move to a background job to avoid blocking the server
  const indexList = inputLogs.map((log) => {
    log.timestamp = getDateFromTimestamp(log.timestamp, timestamp);
    return indexJson(log, { flattenNumericKeys: false });
  });

  const logs = inputLogs.map((log): ILog => {
    return {
      id: uuidv7(),
      appId,
      createdAt: timestamp,
      createdBy: clientTokenId,
      createdByType: kAgentTypes.clientToken,
      timestamp: getDateFromTimestamp(log.timestamp, timestamp),
      updatedAt: timestamp,
      orgId,
    };
  });

  const setFields = new Map<string, IWorkingLogField>();
  indexList.forEach((index) => {
    forEach(index, (value, stringKey) => {
      let field: IWorkingLogField | undefined = setFields.get(stringKey);

      if (!field) {
        field = {
          name: stringKey,
          nameType: value.keyType.join("."),
          type: new Set(),
        };

        setFields.set(stringKey, field);
      }

      value.valueType.forEach((type) => {
        field.type.add(type);
      });
    });
  });

  const fields = Array.from(setFields.values());
  const parts: ILogPart[] = [];

  indexList.forEach((index, logIndex) => {
    const logId = logs[logIndex].id;
    forEach(index, (value, stringKey) => {
      value.value.forEach((partValue) => {
        const type = getValueType(partValue);
        const part: ILogPart = {
          id: uuidv7(),
          logId,
          name: stringKey,
          value: String(partValue),
          valueBoolean: type === "boolean" ? Boolean(partValue) : undefined,
          valueNumber: type === "number" ? Number(partValue) : undefined,
          type,
          appId,
          orgId,
          createdAt: timestamp,
        };

        parts.push(part);
      });
    });
  });

  await Promise.all([
    saveLogFields({ appId, inputFields: fields, orgId }),
    saveLogs({ logs }),
  ]);

  // log parts have a foreign key to the log id, so we need to save them after
  // the logs
  await saveLogParts({ parts });
}
