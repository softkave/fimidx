"use client";

import { IOrg } from "@/src/definitions/org.ts";
import { useCallback } from "react";
import { ScrollArea } from "../ui/scroll-area.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet.tsx";
import { AddOrgForm } from "./add-org-form.tsx";
import { UpdateOrgForm } from "./update-org-form.tsx";

export interface IOrgFormSheetProps {
  org?: IOrg;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitComplete?: (org: IOrg) => void;
}

export function OrgFormSheet(props: IOrgFormSheetProps) {
  const { isOpen, onOpenChange, onSubmitComplete, org } = props;

  const handleSubmitComplete = useCallback(
    (org: IOrg) => {
      onOpenChange(false);
      onSubmitComplete?.(org);
    },
    [onOpenChange, onSubmitComplete]
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max:w-[440px] p-0">
        <ScrollArea className="h-[calc(100vh)]">
          <SheetHeader>
            <SheetTitle>
              {org ? "Update Organization" : "New Organization"}
            </SheetTitle>
            <SheetDescription>
              {org
                ? "Update the organization to change the name or description."
                : "Create a new organization to start collecting logs."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-2 p-4">
            {org ? (
              <UpdateOrgForm
                org={org}
                onSubmitComplete={handleSubmitComplete}
              />
            ) : (
              <AddOrgForm onSubmitComplete={handleSubmitComplete} />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
