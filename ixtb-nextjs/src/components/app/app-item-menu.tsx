"use client";

import { useDeleteApp } from "@/src/lib/clientApi/app";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { cn } from "@/src/lib/utils";
import { IApp } from "fimidx-core/definitions/app";
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
import { AppFormSheet } from "./app-form-sheet";

export interface IAppItemMenuProps {
  app: IApp;
  onDeleting?: () => void;
  onDeleted?: () => void;
  routeAfterDelete?: string | boolean;
}

export function AppItemMenu(props: IAppItemMenuProps) {
  const { app, onDeleting, onDeleted, routeAfterDelete = true } = props;

  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const deleteAppHook = useDeleteApp({
    onSuccess: () => {
      toast.success("App deleted");
      onDeleted?.();
      if (routeAfterDelete) {
        router.push(
          isString(routeAfterDelete)
            ? routeAfterDelete
            : kClientPaths.app.org.app.index(app.orgId)
        );
      }
    },
  });

  const handleDelete = () => {
    onDeleting?.();
    deleteAppHook.trigger({
      query: {
        id: {
          eq: app.id,
        },
      },
    });
  };

  const deleteAppDialog = useDeleteResourceDialog({
    title: "Delete App",
    description: "Are you sure you want to delete this app?",
    onConfirm: handleDelete,
  });

  const isMutating = deleteAppHook.isMutating;

  return (
    <>
      {deleteAppDialog.DeleteResourceDialog()}
      <AppFormSheet
        app={app}
        orgId={app.orgId}
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
          <DropdownMenuItem onSelect={deleteAppDialog.trigger}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
