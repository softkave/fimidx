"use client";

import { kPermissions } from "@/src/definitions/permissions";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { cn } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { ClientTokenFormSheet } from "./client-token-form-sheet";

export function ClientTokensHeader(props: {
  className?: string;
  orgId: string;
  appId: string;
}) {
  const [openForm, setOpenForm] = useState(false);
  const router = useRouter();

  const {
    checks: [canCreate],
  } = useHasPermission({
    orgId: props.orgId,
    permission: kPermissions.clientToken.update,
  });

  return (
    <>
      <ClientTokenFormSheet
        isOpen={openForm}
        onOpenChange={setOpenForm}
        onSubmitComplete={(clientToken) => {
          router.push(
            kClientPaths.app.org.app.clientToken.single(
              clientToken.orgId,
              props.appId,
              clientToken.id
            )
          );
        }}
        orgId={props.orgId}
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
