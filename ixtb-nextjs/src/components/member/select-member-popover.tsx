"use client";

import { cn } from "@/src/lib/utils.ts";
import { IFetchedMember } from "fmdx-core/definitions/members";
import { Check, Loader2, PlusIcon, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../ui/button.tsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command.tsx";
import { FormControl } from "../ui/form.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover.tsx";

export interface SelectMemberPopoverProps {
  members: IFetchedMember[];
  selected: string[];
  loading?: boolean;
  disabled?: boolean;
  size?: "default" | "sm";
  variant?: "ghost" | "outline";
  onOpenAddMemberForm?: (defaultName?: string) => void;
  handleToggleSelectMember: (value: string) => void;
  isForm?: boolean;
  canInvite: boolean | undefined;
}

interface SelectMemberItem {
  value: string;
  label: string;
}

function membersToItems(members: IFetchedMember[]): SelectMemberItem[] {
  return members.map((member) => ({
    value: member.id,
    label: member.name ?? member.email,
  }));
}

export function SelectMemberPopover({
  members,
  selected,
  loading,
  disabled = loading,
  size = "default",
  variant = "outline",
  onOpenAddMemberForm,
  handleToggleSelectMember,
  isForm = false,
  canInvite,
}: SelectMemberPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const items = useMemo(() => membersToItems(members), [members]);

  const selectedMemberLabel = useMemo(() => {
    if (selected.length === 0) {
      return "Select member";
    }

    if (selected.length === 1) {
      return members.find((member) => member.id === selected[0])?.name;
    }

    return `${selected.length} members`;
  }, [selected, members]);

  const triggerNode = (
    <PopoverTrigger asChild>
      <Button
        variant={variant}
        role="combobox"
        aria-expanded={open}
        type="button"
        className={cn(
          "text-muted-foreground px-0 hover:bg-transparent justify-start items-center w-full",
          disabled && "opacity-50",
          loading && "animate-pulse",
          variant === "ghost" && "px-0!",
          size === "default" && "w-full"
        )}
        disabled={disabled}
        size={size}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        <span className="truncate text-sm font-normal flex-1 text-left">
          {selectedMemberLabel}
        </span>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      </Button>
    </PopoverTrigger>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {isForm ? <FormControl>{triggerNode}</FormControl> : triggerNode}
      <PopoverContent className="p-0">
        <Command>
          <CommandInput
            placeholder="Search member..."
            className="h-9"
            value={search}
            onValueChange={(value) => setSearch(value)}
          />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col gap-4 p-2">
                <div>No member found.</div>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    onOpenAddMemberForm?.();
                  }}
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="truncate">Add member</span>
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => {
                    handleToggleSelectMember(item.value);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      selected.includes(item.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onOpenAddMemberForm?.(search);
                  }}
                  disabled={!canInvite}
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="truncate">Add member</span>
                </CommandItem>
              </CommandGroup>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
