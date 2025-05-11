"use client";

import { IFetchedMember } from "@/src/definitions/members";
import { kPermissions } from "@/src/definitions/permissions";
import { useDeleteMemberById } from "@/src/lib/clientApi/member";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { cn } from "@/src/lib/utils";
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
import { MemberFormSheet } from "./member-form-sheet";

export interface IMemberItemMenuProps {
  member: IFetchedMember;
  onDeleting?: () => void;
  onDeleted?: () => void;
  routeAfterDelete?: string | boolean;
  disabled?: boolean;
}

export function MemberItemMenu(props: IMemberItemMenuProps) {
  const {
    member,
    onDeleting,
    onDeleted,
    routeAfterDelete = true,
    disabled,
  } = props;

  const {
    checks: [canUpdate, canDelete],
  } = useHasPermission({
    orgId: member.orgId,
    permission: [kPermissions.member.update, kPermissions.member.remove],
  });

  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const deleteMemberHook = useDeleteMemberById({
    orgId: member.orgId,
    memberId: member.id,
    onSuccess: () => {
      toast.success("Member removed");
      onDeleted?.();
      if (routeAfterDelete) {
        router.push(
          isString(routeAfterDelete)
            ? routeAfterDelete
            : kClientPaths.app.org.members.index(member.orgId)
        );
      }
    },
  });

  const handleDelete = () => {
    onDeleting?.();
    deleteMemberHook.trigger();
  };

  const deleteMemberDialog = useDeleteResourceDialog({
    title: "Remove Member",
    description: "Are you sure you want to remove this member?",
    onConfirm: handleDelete,
  });

  const isMutating = deleteMemberHook.isMutating;

  return (
    <>
      {deleteMemberDialog.DeleteResourceDialog()}
      <MemberFormSheet
        member={member}
        orgId={member.orgId}
        onOpenChange={setIsEditing}
        isOpen={isEditing}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={isMutating || disabled}
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
            disabled={!canUpdate || disabled}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={deleteMemberDialog.trigger}
            disabled={!canDelete || disabled}
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
