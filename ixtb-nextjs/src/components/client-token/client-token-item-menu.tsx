"use client";

import { useDeleteClientTokens } from "@/src/lib/clientApi/clientToken";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { cn } from "@/src/lib/utils";
import { IClientToken } from "fimidx-core/definitions/clientToken";
import { kId0 } from "fimidx-core/definitions/system";
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
import { ClientTokenFormSheet } from "./client-token-form-sheet";

export interface IClientTokenItemMenuProps {
  clientToken: IClientToken;
  onDeleting?: () => void;
  onDeleted?: () => void;
  routeAfterDelete?: string | boolean;
  appId: string;
}

export function ClientTokenItemMenu(props: IClientTokenItemMenuProps) {
  const {
    clientToken,
    onDeleting,
    onDeleted,
    routeAfterDelete = true,
    appId,
  } = props;

  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const deleteClientTokenHook = useDeleteClientTokens({
    onSuccess: () => {
      toast.success("ClientToken deleted");
      onDeleted?.();
      if (routeAfterDelete) {
        const orgId = clientToken.meta?.orgId;
        const appId = clientToken.meta?.appId;

        if (!orgId || !appId) {
          return;
        }

        router.push(
          isString(routeAfterDelete)
            ? routeAfterDelete
            : kClientPaths.app.org.app.clientToken.index(orgId, appId)
        );
      }
    },
  });

  const handleDelete = () => {
    onDeleting?.();
    deleteClientTokenHook.trigger({
      query: {
        appId: kId0,
        id: {
          eq: clientToken.id,
        },
      },
    });
  };

  const deleteClientTokenDialog = useDeleteResourceDialog({
    title: "Delete ClientToken",
    description: "Are you sure you want to delete this clientToken?",
    onConfirm: handleDelete,
  });

  const isMutating = deleteClientTokenHook.isMutating;

  return (
    <>
      {deleteClientTokenDialog.DeleteResourceDialog()}
      <ClientTokenFormSheet
        clientToken={clientToken}
        orgId={clientToken.groupId}
        appId={appId}
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
          <DropdownMenuItem onSelect={() => setIsEditing(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={deleteClientTokenDialog.trigger}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
