"use client";

import { cn } from "@/src/lib/utils.ts";
import { Loader2, PlusIcon, UserPlus } from "lucide-react";
import { Button } from "../ui/button.tsx";

export interface AddMemberBtnProps {
  loading?: boolean;
  disabled?: boolean;
  size?: "default" | "sm";
  variant?: "ghost" | "outline";
  onOpenAddMemberForm?: () => void;
  canInvite: boolean | undefined;
}

export function AddMemberBtn({
  loading,
  disabled = loading,
  size = "default",
  variant = "outline",
  onOpenAddMemberForm,
  canInvite,
}: AddMemberBtnProps) {
  return (
    <Button
      variant={variant}
      onClick={() => {
        onOpenAddMemberForm?.();
      }}
      type="button"
      className={cn(
        "justify-between px-0 hover:bg-transparent w-full text-muted-foreground",
        disabled && "opacity-50",
        loading && "animate-pulse",
        variant === "ghost" && "px-0!"
      )}
      disabled={disabled || !canInvite}
      size={size}
    >
      <UserPlus className="w-4 h-4 mr-2" />
      <span className="truncate text-sm font-normal flex-1 text-left">
        Add Member
      </span>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <PlusIcon className="w-4 h-4 ml-2" />
      )}
    </Button>
  );
}
