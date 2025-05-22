import assert from "assert";
import { inArray } from "drizzle-orm";
import { keyBy, uniq } from "lodash-es";
import { OwnServerError } from "../../common/error.js";
import { db, orgs as orgsTable } from "../../db/fmdx-schema.js";
import { type IMember, type MemberStatus } from "../../definitions/members.js";

export async function augmentUserRequests(params: { requests: IMember[] }) {
  const { requests } = params;

  const orgIds = uniq(requests.map((request) => request.orgId));
  const orgs = await db
    .select()
    .from(orgsTable)
    .where(inArray(orgsTable.id, orgIds));

  const orgsMap = keyBy(orgs, "id");
  const requestsWithOrg = requests
    .filter((request) => !!orgsMap[request.orgId])
    .map((request) => {
      const org = orgsMap[request.orgId];
      assert(org, new OwnServerError("Organization not found", 404));
      return {
        requestId: request.id,
        orgId: org.id,
        orgName: org.name,
        status: request.status as MemberStatus,
        createdAt: request.createdAt,
      };
    });

  return requestsWithOrg;
}
