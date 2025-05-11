"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { cn } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { OrgFormSheet } from "./org-form-sheet";

export function OrgsHeader(props: { className?: string }) {
  const [openForm, setOpenForm] = useState(false);
  const router = useRouter();

  return (
    <>
      <OrgFormSheet
        isOpen={openForm}
        onOpenChange={setOpenForm}
        onSubmitComplete={(org) => {
          router.push(kClientPaths.app.org.single(org.id));
        }}
      />
      <div className={cn("flex justify-between items-center", props.className)}>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button onClick={() => setOpenForm(true)} variant="outline">
          Create Organization
        </Button>
      </div>
    </>
  );
}
