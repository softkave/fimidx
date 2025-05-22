"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { cn } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { MemberFormSheet } from "./member-form-sheet";
import { kPermissions } from "fmdx-core/definitions/permissions";

export function MembersHeader(props: { className?: string; orgId: string }) {
  const [openForm, setOpenForm] = useState(false);
  const router = useRouter();

  const {
    checks: [canCreate],
  } = useHasPermission({
    orgId: props.orgId,
    permission: kPermissions.member.invite,
  });

  return (
    <>
      <MemberFormSheet
        isOpen={openForm}
        onOpenChange={setOpenForm}
        onSubmitComplete={(member) => {
          router.push(
            kClientPaths.app.org.members.single(member.orgId, member.id)
          );
        }}
        orgId={props.orgId}
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
