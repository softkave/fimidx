"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { cn } from "@/src/lib/utils";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { ClientTokenFormSheet } from "./client-token-form-sheet";

export function ClientTokensHeader(props: {
  className?: string;
  groupId: string;
  appId: string;
}) {
  const [openForm, setOpenForm] = useState(false);
  const router = useRouter();

  const {
    checks: [canCreate],
  } = useHasPermission({
    groupId: props.groupId,
    permission: kPermissions.clientToken.update,
  });

  return (
    <>
      <ClientTokenFormSheet
        isOpen={openForm}
        onOpenChange={setOpenForm}
        onSubmitComplete={(clientToken) => {
          router.push(
            kClientPaths.app.group.app.clientToken.single(
              clientToken.groupId,
              clientToken.appId,
              clientToken.id
            )
          );
        }}
        groupId={props.groupId}
        appId={props.appId}
      />
      <div className={cn("flex justify-between items-center", props.className)}>
        <h1 className="text-2xl font-bold">Client Tokens</h1>
        <Button
          onClick={() => setOpenForm(true)}
          variant="outline"
          disabled={!canCreate}
        >
          Create Client Token
        </Button>
      </div>
    </>
  );
}
