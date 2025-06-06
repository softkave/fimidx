"use client";

import { IGroup } from "fmdx-core/definitions/group";
import { useCallback } from "react";
import { MaybeScroll } from "../ui/scroll-area.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet.tsx";
import { AddGroupForm } from "./add-group-form.tsx";
import { UpdateGroupForm } from "./update-group-form.tsx";

export interface IGroupFormSheetProps {
  group?: IGroup;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitComplete?: (group: IGroup) => void;
}

export function GroupFormSheet(props: IGroupFormSheetProps) {
  const { isOpen, onOpenChange, onSubmitComplete, group } = props;

  const handleSubmitComplete = useCallback(
    (group: IGroup) => {
      onOpenChange(false);
      onSubmitComplete?.(group);
    },
    [onOpenChange, onSubmitComplete]
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max:w-[440px] p-0">
        <MaybeScroll className="h-[calc(100vh)]">
          <SheetHeader>
            <SheetTitle>{group ? "Update Group" : "New Group"}</SheetTitle>
            <SheetDescription>
              {group
                ? "Update the group to change the name or description."
                : "Create a new group to start collecting logs."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-2 p-4">
            {group ? (
              <UpdateGroupForm
                group={group}
                onSubmitComplete={handleSubmitComplete}
              />
            ) : (
              <AddGroupForm onSubmitComplete={handleSubmitComplete} />
            )}
          </div>
        </MaybeScroll>
      </SheetContent>
    </Sheet>
  );
}
