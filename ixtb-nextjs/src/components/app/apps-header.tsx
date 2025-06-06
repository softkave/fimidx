"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { cn } from "@/src/lib/utils";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { AppFormSheet } from "./app-form-sheet";

export function AppsHeader(props: { className?: string; groupId: string }) {
  const [openForm, setOpenForm] = useState(false);
  const router = useRouter();
  const {
    checks: [canCreate],
  } = useHasPermission({
    groupId: props.groupId,
    permission: kPermissions.app.update,
  });

  return (
    <>
      <AppFormSheet
        isOpen={openForm}
        onOpenChange={setOpenForm}
        onSubmitComplete={(app) => {
          router.push(kClientPaths.app.group.app.single(props.groupId, app.id));
        }}
        groupId={props.groupId}
      />
      <div className={cn("flex justify-between items-center", props.className)}>
        <h1 className="text-2xl font-bold">Apps</h1>
        <Button
          onClick={() => setOpenForm(true)}
          variant="outline"
          disabled={!canCreate}
        >
          Create App
        </Button>
      </div>
    </>
  );
}
