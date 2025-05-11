import { db, members as membersTable } from "@/src/db/fmlogs-schema";
import { and, count, desc, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";
import { augmentUserRequests } from "./augmentUserRequests";

async function getUserRequestsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  userId?: string;
  userEmail?: string;
}) {
  const { limitNumber, pageNumber, userId, userEmail } = params;

  if (!userId && !userEmail) {
    throw new OwnServerError("Invalid request", 400);
  }

  const requests = await db
    .select()
    .from(membersTable)
    .where(
      and(
        userId ? eq(membersTable.userId, userId) : undefined,
        userEmail ? eq(membersTable.email, userEmail) : undefined
      )
    )
    .orderBy(desc(membersTable.createdAt))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return requests;
}

async function countUserRequestsInDB(params: {
  userId?: string;
  userEmail?: string;
}) {
  const { userId, userEmail } = params;

  if (!userId && !userEmail) {
    throw new OwnServerError("Invalid request", 400);
  }

  const tokenCount = await db
    .select({ count: count() })
    .from(membersTable)
    .where(
      and(
        userId ? eq(membersTable.userId, userId) : undefined,
        userEmail ? eq(membersTable.email, userEmail) : undefined
      )
    );

  return tokenCount[0].count;
}

export async function getUserRequests(params: {
  userId?: string;
  userEmail?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, userEmail, page, limit } = params;

  if (!userId && !userEmail) {
    throw new OwnServerError("Invalid request", 400);
  }

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [requests, total] = await Promise.all([
    getUserRequestsFromDB({ limitNumber, pageNumber, userId, userEmail }),
    countUserRequestsInDB({ userId, userEmail }),
  ]);

  const requestsWithOrg = await augmentUserRequests({ requests });
  return {
    requests: requestsWithOrg,
    total,
  };
}
