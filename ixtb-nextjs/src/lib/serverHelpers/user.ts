import { authDb, users as usersTable } from "@/src/db/auth-schema";
import assert from "assert";
import { eq, inArray, like } from "drizzle-orm";
import { OwnServerError } from "../common/error";

export async function getUserByUsername(username: string) {
  const user = await authDb
    .select()
    .from(usersTable)
    .where(eq(usersTable.name, username))
    .then((result) => result[0]);

  assert(user, new OwnServerError("User not found", 404));
  return user;
}

export async function tryGetUserByEmail(email: string) {
  const users = await authDb
    .select()
    .from(usersTable)
    .where(like(usersTable.email, `%${email}%`))
    .then((result) => result);

  const user = users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  return user ?? null;
}

export async function getUserById(id: string) {
  const user = await authDb
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .then((result) => result[0]);

  assert(user, new OwnServerError("User not found", 404));
  return user;
}

export async function getUsers(userIds: string[]) {
  const users = await authDb
    .select()
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));

  return users;
}
