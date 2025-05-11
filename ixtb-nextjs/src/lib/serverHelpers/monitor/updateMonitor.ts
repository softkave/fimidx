import { db, monitor as monitorTable } from "@/src/db/fmlogs-schema";
import { UpdateMonitorEndpointArgs } from "@/src/definitions/monitor";
import { eq } from "drizzle-orm";
import { keyBy } from "lodash-es";
import { indexArray } from "softkave-js-utils";
import { checkMonitorAvailable } from "./checkMonitorExists";
import { getMonitor } from "./getMonitor";
export async function updateMonitor(params: {
  args: UpdateMonitorEndpointArgs;
  id: string;
  userId: string;
  orgId: string;
  appId: string;
}) {
  const { args, id, userId, orgId, appId } = params;
  const {
    name,
    description,
    filters,
    reportsTo: inputReportsTo,
    status,
    duration,
  } = args;

  const monitor = await getMonitor({ id, orgId, appId });

  let reportsTo = monitor.reportsTo;
  if (inputReportsTo) {
    const existingReportsToMap = keyBy(monitor.reportsTo, "userId");
    const inputReportsToMap = indexArray(inputReportsTo, {
      indexer: (userId) => userId,
    });
    const newReportsTo = inputReportsTo.filter(
      (report) => !existingReportsToMap[report]
    );
    const leftReportsTo = monitor.reportsTo.filter(
      (report) => !!inputReportsToMap[report.userId]
    );
    reportsTo = leftReportsTo.concat(
      newReportsTo.map((userId) => ({
        userId,
        addedAt: new Date(),
        addedBy: userId,
      }))
    );
  }

  if (name) {
    await checkMonitorAvailable({ name, orgId, appId, isId: id });
  }

  const [updatedMonitor] = await db
    .update(monitorTable)
    .set({
      name: name ?? monitor.name,
      description: description ?? monitor.description,
      filters: filters ?? monitor.filters,
      reportsTo,
      status: status ?? monitor.status,
      statusUpdatedAt: status ? new Date() : monitor.statusUpdatedAt,
      duration: duration ?? monitor.duration,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(monitorTable.id, id))
    .returning();

  return updatedMonitor;
}
