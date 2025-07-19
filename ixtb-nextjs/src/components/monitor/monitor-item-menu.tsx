"use client";

import { useDeleteMonitor } from "@/src/lib/clientApi/monitor";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { cn } from "@/src/lib/utils";
import { IMonitor } from "fmdx-core/definitions/monitor";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { isString } from "lodash-es";
import { Ellipsis, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDeleteResourceDialog } from "../internal/delete-resource-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface IMonitorItemMenuProps {
  monitor: IMonitor;
  onDeleting?: () => void;
  onDeleted?: () => void;
  routeAfterDelete?: string | boolean;
  appId: string;
}

export function MonitorItemMenu(props: IMonitorItemMenuProps) {
  const {
    monitor,
    onDeleting,
    onDeleted,
    routeAfterDelete = true,
    appId,
  } = props;

  const {
    checks: [canDelete],
  } = useHasPermission({
    orgId: monitor.orgId,
    permission: kPermissions.monitor.delete,
  });

  const router = useRouter();
  const deleteMonitorHook = useDeleteMonitor({
    appId,
    monitorId: monitor.id,
    onSuccess: () => {
      toast.success("Monitor deleted");
      onDeleted?.();
      if (routeAfterDelete) {
        router.push(
          isString(routeAfterDelete)
            ? routeAfterDelete
            : kClientPaths.app.org.app.monitors.index(monitor.orgId, appId)
        );
      }
    },
  });

  const handleDelete = () => {
    onDeleting?.();
    deleteMonitorHook.trigger({
      id: monitor.id,
    });
  };

  const deleteMonitorDialog = useDeleteResourceDialog({
    title: "Delete Monitor",
    description: "Are you sure you want to delete this monitor?",
    onConfirm: handleDelete,
  });

  const isMutating = deleteMonitorHook.isMutating;

  return (
    <>
      {deleteMonitorDialog.DeleteResourceDialog()}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={isMutating}
            className={cn(isMutating && "animate-pulse")}
          >
            {isMutating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Ellipsis className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={deleteMonitorDialog.trigger}
            disabled={!canDelete}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
