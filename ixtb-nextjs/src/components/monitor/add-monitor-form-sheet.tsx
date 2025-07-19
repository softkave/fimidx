"use client";

import { IMonitor } from "fmdx-core/definitions/monitor";
import { useCallback } from "react";
import { MaybeScroll } from "../ui/scroll-area.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet.tsx";
import { AddMonitorForm } from "./add-monitor-form.tsx";

export interface IAddMonitorFormSheetProps {
  orgId: string;
  appId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitComplete?: (monitor: IMonitor) => void;
}

export function AddMonitorFormSheet(props: IAddMonitorFormSheetProps) {
  const { isOpen, onOpenChange, onSubmitComplete, orgId, appId } = props;

  const handleSubmitComplete = useCallback(
    (monitor: IMonitor) => {
      onOpenChange(false);
      onSubmitComplete?.(monitor);
    },
    [onOpenChange, onSubmitComplete]
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max:w-[440px] p-0">
        <MaybeScroll className="h-[calc(100vh)]">
          <SheetHeader>
            <SheetTitle>New Monitor</SheetTitle>
            <SheetDescription>
              Create a new monitor to start monitoring logs.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-2 p-4">
            <AddMonitorForm
              onSubmitComplete={handleSubmitComplete}
              orgId={orgId}
              appId={appId}
            />
          </div>
        </MaybeScroll>
      </SheetContent>
    </Sheet>
  );
}
