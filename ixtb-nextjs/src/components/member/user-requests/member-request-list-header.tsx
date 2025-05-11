"use client";

import { cn } from "@/src/lib/utils";

export function MemberRequestListHeader(props: { className?: string }) {
  return (
    <div className={cn("flex justify-between items-center", props.className)}>
      <h1 className="text-2xl font-bold">Requests</h1>
    </div>
  );
}
