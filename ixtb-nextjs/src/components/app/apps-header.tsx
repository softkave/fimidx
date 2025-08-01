"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ComponentListHeader } from "../internal/component-list/component-list-header";
import { Button } from "../ui/button";
import { AppFormSheet } from "./app-form-sheet";

export function AppsHeader(props: { className?: string; orgId: string }) {
  const [openForm, setOpenForm] = useState(false);
  const router = useRouter();

  return (
    <>
      <AppFormSheet
        isOpen={openForm}
        onOpenChange={setOpenForm}
        onSubmitComplete={(app) => {
          if (app) {
            router.push(kClientPaths.app.org.app.single(props.orgId, app.id));
          }
        }}
        orgId={props.orgId}
      />
      <ComponentListHeader
        title="Apps"
        description="Manage your apps."
        button={
          <Button onClick={() => setOpenForm(true)} variant="outline">
            Create
            <PlusIcon className="w-4 h-4 ml-1" />
          </Button>
        }
        className={props.className}
      />
    </>
  );
}
