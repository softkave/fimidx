"use client";

import { useDeleteGroup } from "@/src/lib/clientApi/group";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { cn } from "@/src/lib/utils";
import { IGroup } from "fmdx-core/definitions/group";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { isString } from "lodash-es";
import { Ellipsis, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteResourceDialog } from "../internal/delete-resource-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { GroupFormSheet } from "./group-form-sheet";

export interface IGroupItemMenuProps {
  group: IGroup;
  onDeleting?: () => void;
  onDeleted?: () => void;
  routeAfterDelete?: string | boolean;
}

export function GroupItemMenu(props: IGroupItemMenuProps) {
  const { group, onDeleting, onDeleted, routeAfterDelete = true } = props;

  const {
    checks: [canUpdate, canDelete],
  } = useHasPermission({
    groupId: group.id,
    permission: [kPermissions.group.update, kPermissions.group.delete],
  });

  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const deleteGroupHook = useDeleteGroup({
    groupId: group.id,
    onSuccess: () => {
      toast.success("Group deleted");
      onDeleted?.();
      if (routeAfterDelete) {
        router.push(
          isString(routeAfterDelete)
            ? routeAfterDelete
            : kClientPaths.app.group.index
        );
      }
    },
  });

  const handleDelete = () => {
    onDeleting?.();
    deleteGroupHook.trigger({
      id: group.id,
    });
  };

  const deleteGroupDialog = useDeleteResourceDialog({
    title: "Delete Group",
    description: "Are you sure you want to delete this group?",
    onConfirm: handleDelete,
  });

  const isMutating = deleteGroupHook.isMutating;

  return (
    <>
      {deleteGroupDialog.DeleteResourceDialog()}
      <GroupFormSheet
        group={group}
        onOpenChange={setIsEditing}
        isOpen={isEditing}
      />
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
            onSelect={() => setIsEditing(true)}
            disabled={!canUpdate}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={deleteGroupDialog.trigger}
            disabled={!canDelete}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
