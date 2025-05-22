import assert from "assert";
import { and, eq, inArray } from "drizzle-orm";
import { forEach } from "lodash-es";
import { indexJson } from "softkave-js-utils";
import { v7 as uuidv7 } from "uuid";
import {
  db,
  logFields as logFieldsTable,
  logParts as logPartsTable,
  logs as logsTable,
} from "../../db/fmdx-schema.js";
import type {
  ILog,
  ILogPart,
  InputLogRecordArray,
} from "../../definitions/log.js";
import { kAgentTypes } from "../../definitions/other.js";

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

/**
 * Saves log field metadata, tracking the structure and types of fields that appear in logs
 * @param {Object} params - The parameters object
 * @param {string} params.appId - The ID of the application
 * @param {IWorkingLogField[]} params.inputFields - Array of log fields to save
 * @param {string} params.orgId - The organization ID
 */
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

/**
 * Saves individual parts/components of logs for detailed querying
 * @param {Object} params - The parameters object
 * @param {ILogPart[]} params.parts - Array of log parts to save
 */
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

/**
 * Processes logs in batches for better performance
 * @param {ILogPart[]} parts - Array of log parts to save
 * @param {number} batchSize - Size of each batch
 */
async function saveLogPartsInBatches(parts: ILogPart[], batchSize = 1000) {
  for (let i = 0; i < parts.length; i += batchSize) {
    const batch = parts.slice(i, i + batchSize);
    await saveLogParts({ parts: batch });
  }
}

/**
 * Main function to process and store logs. Handles:
 * 1. Breaking down logs into searchable components
 * 2. Maintaining schema of log fields and their types
 * 3. Storing log metadata and parts
 *
 * @param {Object} params - The parameters object
 * @param {string} params.appId - The ID of the application
 * @param {InputLogRecordArray} params.inputLogs - Array of logs to process
 * @param {string} params.clientTokenId - ID of the client making the request
 * @param {string} params.orgId - The organization ID
 * @throws {Error} If required parameters are missing or invalid
 */
export async function addLogs(params: {
  appId: string;
  inputLogs: InputLogRecordArray;
  clientTokenId: string;
  orgId: string;
}) {
  const { appId, inputLogs, clientTokenId, orgId } = params;

  // Input validation
  if (!appId || !clientTokenId || !orgId) {
    throw new Error(
      "Required parameters missing: appId, clientTokenId, and orgId are required"
    );
  }

  if (!Array.isArray(inputLogs) || inputLogs.length === 0) {
    throw new Error("inputLogs must be a non-empty array");
  }

  const timestamp = new Date();

  try {
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

    // Process log parts in batches
    await saveLogPartsInBatches(parts);
  } catch (error) {
    // Log the error for debugging but throw a sanitized version
    console.error("Error processing logs:", error);
    throw new Error(
      "Failed to process and store logs. Please try again or contact support."
    );
  }
}
