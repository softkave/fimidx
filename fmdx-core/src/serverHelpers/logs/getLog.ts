import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import {
  db,
  logParts as logPartsTable,
  logs as logsTable,
} from "../../db/fmdx-schema.js";
import type { IFetchedLog } from "../../definitions/log.js";

async function getLogByIdFromDb(args: { id: string }) {
  const { id } = args;
  const [log] = await db
    .select()
    .from(logsTable)
    .where(eq(logsTable.id, id))
    .limit(1);

  assert(log, new OwnServerError("Log not found", 404));
  return log;
}

async function getLogPartsFromDb(args: { logId: string }) {
  const { logId } = args;
  const parts = await db
    .select()
    .from(logPartsTable)
    .where(eq(logPartsTable.logId, logId));

  return parts;
}

export async function getLog(args: { id: string }) {
  const [rawLog, parts] = await Promise.all([
    getLogByIdFromDb({ id: args.id }),
    getLogPartsFromDb({ logId: args.id }),
  ]);

  const log: IFetchedLog = {
    ...rawLog,
    parts,
  };

  return log;
}
