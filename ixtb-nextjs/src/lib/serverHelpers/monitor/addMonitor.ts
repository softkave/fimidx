import { db, monitor as monitorTable } from "@/src/db/fmlogs-schema";
import { CreateMonitorEndpointArgs } from "@/src/definitions/monitor";
import { OwnServerError } from "../../common/error";
import { hasMembers } from "../member/hasMembers";
import { checkMonitorAvailable } from "./checkMonitorExists";

export async function addMonitor(params: {
  args: CreateMonitorEndpointArgs;
  userId: string;
  appId: string;
  orgId: string;
}) {
  const { args, userId, appId, orgId } = params;
  const { name, description, filters, reportsTo, status, duration } = args;
  const date = new Date();
  const newMonitor: typeof monitorTable.$inferInsert = {
    appId,
    name,
    nameLower: name.toLowerCase(),
    description,
    createdAt: date,
    updatedAt: date,
    createdBy: userId,
    updatedBy: userId,
    orgId,
    status: status,
    statusUpdatedAt: date,
    reportsTo: reportsTo.map((report) => ({
      userId: report,
      addedAt: date,
      addedBy: userId,
    })),
    filters: filters,
    duration: duration,
  };

  const userIds = reportsTo;
  const orgHasMembers = await hasMembers({ orgId, userIds });

  if (!orgHasMembers) {
    throw new OwnServerError(
      "Some users the monitor is reporting to were not found",
      400
    );
  }

  await checkMonitorAvailable({ name, orgId, appId });

  const [monitor] = await db
    .insert(monitorTable)
    .values(newMonitor)
    .returning();

  return monitor;
}
