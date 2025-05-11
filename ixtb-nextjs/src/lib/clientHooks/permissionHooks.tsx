import { kPermissions } from "@/src/definitions/permissions";
import { useMemo } from "react";
import { convertToArray } from "softkave-js-utils";
import { useGetMemberByUserId } from "../clientApi/member";
import { useAppSession } from "./userHooks";
/** `undefined` is returned if the permission is not loaded yet. */
export function useHasPermission(opts: {
  orgId: string;
  permission: string | string[];
  op?: "any" | "all";
}) {
  const { op = "any" } = opts;
  const { userId } = useAppSession();
  const getMemberByUserIdHook = useGetMemberByUserId({
    orgId: opts.orgId,
    memberUserId: userId,
  });

  const checks = useMemo(() => {
    if (getMemberByUserIdHook.isLoading) {
      return [];
    }

    const hasWildcard =
      getMemberByUserIdHook.data?.member.permissions?.includes(
        kPermissions.wildcard
      );
    const permissions = convertToArray(opts.permission);
    return permissions.map(
      (p) =>
        hasWildcard ||
        getMemberByUserIdHook.data?.member.permissions?.includes(p)
    );
  }, [
    getMemberByUserIdHook.data?.member.permissions,
    getMemberByUserIdHook.isLoading,
    opts.permission,
  ]);

  const hasPermission = useMemo(() => {
    if (checks.length === 0) {
      return undefined;
    }

    if (op === "any") {
      return checks.some((c) => c);
    } else if (op === "all") {
      return checks.every((c) => c);
    } else {
      return false;
    }
  }, [checks, op]);

  return {
    hasPermission,
    isLoading: getMemberByUserIdHook.isLoading,
    checks,
  };
}
