"use client";

import { IClientToken } from "fmdx-core/definitions/clientToken";
import { useCallback } from "react";
import { MaybeScroll } from "../ui/scroll-area.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet.tsx";
import { AddClientTokenForm } from "./add-client-token-form.tsx";
import { UpdateClientTokenForm } from "./update-client-token-form.tsx";

export interface IClientTokenFormSheetProps {
  groupId: string;
  appId: string;
  clientToken?: IClientToken;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitComplete?: (clientToken: IClientToken) => void;
}

export function ClientTokenFormSheet(props: IClientTokenFormSheetProps) {
  const {
    isOpen,
    onOpenChange,
    onSubmitComplete,
    clientToken,
    groupId,
    appId,
  } = props;

  const handleSubmitComplete = useCallback(
    (clientToken: IClientToken) => {
      onOpenChange(false);
      onSubmitComplete?.(clientToken);
    },
    [onOpenChange, onSubmitComplete]
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max:w-[440px] p-0">
        <MaybeScroll className="h-[calc(100vh)]">
          <SheetHeader>
            <SheetTitle>
              {clientToken ? "Update Client Token" : "New Client Token"}
            </SheetTitle>
            <SheetDescription>
              {clientToken
                ? "Update the client token to change the name or description."
                : "Create a new client token to start adding logs."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-2 p-4">
            {clientToken ? (
              <UpdateClientTokenForm
                clientToken={clientToken}
                onSubmitComplete={handleSubmitComplete}
              />
            ) : (
              <AddClientTokenForm
                onSubmitComplete={handleSubmitComplete}
                groupId={groupId}
                appId={appId}
              />
            )}
          </div>
        </MaybeScroll>
      </SheetContent>
    </Sheet>
  );
}
