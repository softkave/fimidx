"use client";

import { ILog } from "fimidx-core/definitions/log";
import { Sheet, SheetContent } from "../ui/sheet.tsx";
import { Log } from "./log.tsx";

export interface ILogSheetProps {
  log: ILog;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function LogSheet(props: ILogSheetProps) {
  const { isOpen, onOpenChange, log } = props;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-[640px] sm:max-w-[640px] p-0">
        <Log log={log} />
      </SheetContent>
    </Sheet>
  );
}
