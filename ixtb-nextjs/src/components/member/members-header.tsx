"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { cn } from "@/src/lib/utils";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { MemberFormSheet } from "./member-form-sheet";

export function MembersHeader(props: { className?: string; groupId: string }) {
  const [openForm, setOpenForm] = useState(false);
  const router = useRouter();

  const {
    checks: [canCreate],
  } = useHasPermission({
    groupId: props.groupId,
    permission: kPermissions.member.invite,
  });

  return (
    <>
      <MemberFormSheet
        isOpen={openForm}
        onOpenChange={setOpenForm}
        onSubmitComplete={(member) => {
          router.push(
            kClientPaths.app.group.members.single(member.groupId, member.id)
          );
        }}
        groupId={props.groupId}
      />
      <div className={cn("flex justify-between items-center", props.className)}>
        <h1 className="text-2xl font-bold">Members</h1>
        <Button
          onClick={() => setOpenForm(true)}
          variant="outline"
          disabled={!canCreate}
        >
          Add Member
        </Button>
      </div>
    </>
  );
}
