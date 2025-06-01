// import { eq } from "drizzle-orm";
// import { keyBy } from "lodash-es";
// import { indexArray } from "softkave-js-utils";
// import { db, monitor as monitorTable } from "../../db/fmdx-schema.js";
// import type {
//   IMonitor,
//   UpdateMonitorEndpointArgs,
// } from "../../definitions/monitor.js";
// import { checkMonitorAvailable } from "./checkMonitorExists.js";
// import { getMonitor } from "./getMonitor.js";

// export async function updateMonitor(params: {
//   args: UpdateMonitorEndpointArgs;
//   userId: string;
//   existingMonitor?: IMonitor;
// }) {
//   const { args, userId, existingMonitor } = params;
//   const {
//     name,
//     description,
//     filters,
//     reportsTo: inputReportsTo,
//     status,
//     duration,
//   } = args;

//   const monitor = existingMonitor ?? (await getMonitor({ id: args.id }));

//   let reportsTo = monitor.reportsTo;
//   if (inputReportsTo) {
//     const existingReportsToMap = keyBy(monitor.reportsTo, "userId");
//     const inputReportsToMap = indexArray(inputReportsTo, {
//       indexer: (userId) => userId,
//     });

//     const newReportsTo = inputReportsTo.filter(
//       (report) => !existingReportsToMap[report]
//     );

//     const leftReportsTo = monitor.reportsTo.filter(
//       (report) => !!inputReportsToMap[report.userId]
//     );

//     reportsTo = leftReportsTo.concat(
//       newReportsTo.map((userId) => ({
//         userId,
//         addedAt: new Date(),
//         addedBy: userId,
//       }))
//     );
//   }

//   if (name) {
//     await checkMonitorAvailable({
//       name,
//       appId: monitor.appId,
//       isId: monitor.id,
//     });
//   }

//   const [updatedMonitor] = await db
//     .update(monitorTable)
//     .set({
//       name: name ?? monitor.name,
//       description: description ?? monitor.description,
//       filters: filters ?? monitor.filters,
//       reportsTo,
//       status: status ?? monitor.status,
//       statusUpdatedAt: status ? new Date() : monitor.statusUpdatedAt,
//       duration: duration ?? monitor.duration,
//       updatedAt: new Date(),
//       updatedBy: userId,
//     })
//     .where(eq(monitorTable.id, monitor.id))
//     .returning();

//   return updatedMonitor;
// }
