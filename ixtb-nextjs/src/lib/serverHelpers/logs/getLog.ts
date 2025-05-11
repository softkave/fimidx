import {
  db,
  logParts as logPartsTable,
  logs as logsTable,
} from "@/src/db/fmlogs-schema";
import { IFetchedLog } from "@/src/definitions/log";
import assert from "assert";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

async function getLogByIdFromDb(args: {
  id: string;
  orgId: string;
  appId: string;
}) {
  const { id, orgId, appId } = args;
  const [log] = await db
    .select()
    .from(logsTable)
    .where(
      and(
        eq(logsTable.id, id),
        eq(logsTable.orgId, orgId),
        eq(logsTable.appId, appId)
      )
    )
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

export async function getLog(args: {
  id: string;
  orgId: string;
  appId: string;
}) {
  const [rawLog, parts] = await Promise.all([
    getLogByIdFromDb({ id: args.id, orgId: args.orgId, appId: args.appId }),
    getLogPartsFromDb({ logId: args.id }),
  ]);

  const log: IFetchedLog = {
    ...rawLog,
    parts,
  };

  return log;
}
