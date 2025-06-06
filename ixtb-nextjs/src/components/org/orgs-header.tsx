"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { cn } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { GroupFormSheet } from "./group-form-sheet";

export function GroupsHeader(props: { className?: string }) {
  const [openForm, setOpenForm] = useState(false);
  const router = useRouter();

  return (
    <>
      <GroupFormSheet
        isOpen={openForm}
        onOpenChange={setOpenForm}
        onSubmitComplete={(group) => {
          router.push(kClientPaths.app.group.single(group.id));
        }}
      />
      <div className={cn("flex justify-between items-center", props.className)}>
        <h1 className="text-2xl font-bold">Groups</h1>
        <Button onClick={() => setOpenForm(true)} variant="outline">
          Create Group
        </Button>
      </div>
    </>
  );
}
