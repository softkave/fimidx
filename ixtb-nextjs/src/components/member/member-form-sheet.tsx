"use client";

import { IMember } from "fmdx-core/definitions/members";
import { useCallback } from "react";
import { ScrollArea } from "../ui/scroll-area.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet.tsx";
import { AddMemberForm } from "./add-member-form.tsx";
import { UpdateMemberForm } from "./update-member-form.tsx";

export interface IMemberFormSheetProps {
  orgId: string;
  member?: IMember;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitComplete?: (member: IMember) => void;
}

export function MemberFormSheet(props: IMemberFormSheetProps) {
  const { isOpen, onOpenChange, onSubmitComplete, member, orgId } = props;

  const handleSubmitComplete = useCallback(
    (member: IMember) => {
      onOpenChange(false);
      onSubmitComplete?.(member);
    },
    [onOpenChange, onSubmitComplete]
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max:w-[440px] p-0">
        <ScrollArea className="h-[calc(100vh)]">
          <SheetHeader>
            <SheetTitle>{member ? "Update Member" : "New Member"}</SheetTitle>
            <SheetDescription>
              {member
                ? "Update the member to change the permissions."
                : "Add a new member to the organization."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-2 p-4">
            {member ? (
              <UpdateMemberForm
                member={member}
                onSubmitComplete={handleSubmitComplete}
              />
            ) : (
              <AddMemberForm
                onSubmitComplete={handleSubmitComplete}
                orgId={orgId}
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
