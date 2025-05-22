"use client";

import { IApp } from "fmdx-core/definitions/app";
import { useCallback } from "react";
import { ScrollArea } from "../ui/scroll-area.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet.tsx";
import { AddAppForm } from "./add-app-form.tsx";
import { UpdateAppForm } from "./update-app-form.tsx";

export interface IAppFormSheetProps {
  orgId: string;
  app?: IApp;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitComplete?: (app: IApp) => void;
}

export function AppFormSheet(props: IAppFormSheetProps) {
  const { isOpen, onOpenChange, onSubmitComplete, app, orgId } = props;

  const handleSubmitComplete = useCallback(
    (app: IApp) => {
      onOpenChange(false);
      onSubmitComplete?.(app);
    },
    [onOpenChange, onSubmitComplete]
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max:w-[440px] p-0">
        <ScrollArea className="h-[calc(100vh)]">
          <SheetHeader>
            <SheetTitle>{app ? "Update App" : "New App"}</SheetTitle>
            <SheetDescription>
              {app
                ? "Update the app to change the name or description."
                : "Create a new app to start adding logs."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-2 p-4">
            {app ? (
              <UpdateAppForm
                app={app}
                onSubmitComplete={handleSubmitComplete}
              />
            ) : (
              <AddAppForm
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
