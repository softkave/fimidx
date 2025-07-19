"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { cn } from "@/src/lib/utils";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { AddMonitorFormSheet } from "./add-monitor-form-sheet";

export function MonitorsHeader(props: {
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
    permission: kPermissions.monitor.update,
  });

  return (
    <>
      <AddMonitorFormSheet
        isOpen={openForm}
        onOpenChange={setOpenForm}
        onSubmitComplete={(monitor) => {
          router.push(
            kClientPaths.app.org.app.monitors.single(
              monitor.orgId,
              props.appId,
              monitor.id
            )
          );
        }}
        orgId={props.orgId}
        appId={props.appId}
      />
      <div className={cn("flex justify-between items-center", props.className)}>
        <h1 className="text-2xl font-bold">Monitors</h1>
        <Button
          onClick={() => setOpenForm(true)}
          variant="outline"
          disabled={!canCreate}
        >
          Create Monitor
        </Button>
      </div>
    </>
  );
}
