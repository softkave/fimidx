"use client";

import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks.tsx";
import { IFetchedMember } from "fmdx-core/definitions/members";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { Fragment, ReactNode, useMemo, useState } from "react";
import { PrefixSuffixNode } from "../internal/prefix-suffix-node.tsx";
import { AddMemberBtn } from "./add-member-btn.tsx";
import { MemberFormSheet } from "./member-form-sheet.tsx";
import { MemberList } from "./members-list.tsx";
import { SelectMemberPopover } from "./select-member-popover.tsx";

export interface SelectMemberProps {
  members: IFetchedMember[];
  selected?: string | string[] | null;
  onChange: (selected: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
  showAddMember?: boolean;
  size?: "default" | "sm";
  variant?: "ghost" | "outline";
  color?: "default" | "muted";
  maxSelectedMembers?: number;
  renderPrefix?: () => ReactNode;
  renderSuffix?: () => ReactNode;
  selectedItemsPosition?: "top" | "bottom";
  mainNodeClassName?: string;
  orgId: string;
  isForm?: boolean;
}

function indexMembers(
  members: IFetchedMember[]
): Record<string, IFetchedMember> {
  return members.reduce((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {} as Record<string, IFetchedMember>);
}

export function SelectMember({
  members,
  selected: inputSelected,
  onChange,
  loading,
  disabled = loading,
  showAddMember = true,
  size = "default",
  variant = "outline",
  color = "default",
  maxSelectedMembers,
  renderPrefix,
  renderSuffix,
  selectedItemsPosition = "bottom",
  mainNodeClassName,
  orgId,
  isForm = false,
}: SelectMemberProps) {
  const {
    checks: [canInvite],
  } = useHasPermission({
    orgId,
    permission: kPermissions.member.invite,
  });

  const [addMemberOpen, setAddMemberOpen] = useState({
    isOpen: false,
  });

  const indexedMembers = useMemo(() => indexMembers(members), [members]);

  const selected = useMemo(() => {
    if (inputSelected) {
      return Array.isArray(inputSelected) ? inputSelected : [inputSelected];
    }

    return [];
  }, [inputSelected]);

  const selectedMembers = useMemo(
    () =>
      selected
        .map((id) => indexedMembers[id] as IFetchedMember | undefined)
        .filter((member) => member !== undefined),
    [indexedMembers, selected]
  );

  const handleRemoveMember = (memberId: string) => {
    onChange(selected.filter((id) => id !== memberId));
  };

  const handleToggleSelectMember = (value: string) => {
    if (selected.includes(value)) {
      handleRemoveMember(value);
    } else {
      if (maxSelectedMembers && selected.length >= maxSelectedMembers) {
        return;
      }

      onChange([...selected, value]);
    }
  };

  if (!selectedMembers.length && !showAddMember) {
    return null;
  }

  const selectedItemsNode =
    selected.length > 0 ? (
      <MemberList
        members={selectedMembers}
        showMenu={false}
        showRemoveButton={true}
        onRemove={(member) => {
          handleRemoveMember(member.id);
        }}
        size="small"
        color={color}
        disabled={disabled}
      />
    ) : null;

  const selectMemberNode = (
    <SelectMemberPopover
      members={members}
      selected={selected}
      loading={loading}
      disabled={disabled}
      onOpenAddMemberForm={() => {
        setAddMemberOpen({ isOpen: true });
      }}
      handleToggleSelectMember={handleToggleSelectMember}
      size={size}
      variant={variant}
      isForm={isForm}
      canInvite={canInvite}
    />
  );

  const addMemberNode = (
    <AddMemberBtn
      loading={loading}
      disabled={disabled}
      size={size}
      variant={variant}
      onOpenAddMemberForm={() => {
        setAddMemberOpen({ isOpen: true });
      }}
      canInvite={canInvite}
    />
  );

  let mainNode = members.length > 0 ? selectMemberNode : addMemberNode;
  const prefixNode = renderPrefix?.();
  const suffixNode = renderSuffix?.();
  mainNode = (
    <PrefixSuffixNode
      prefix={prefixNode}
      suffix={suffixNode}
      className={mainNodeClassName}
    >
      {mainNode}
    </PrefixSuffixNode>
  );

  return (
    <Fragment>
      <MemberFormSheet
        orgId={orgId}
        isOpen={addMemberOpen.isOpen}
        onOpenChange={(isOpen) => {
          setAddMemberOpen({ isOpen });
        }}
        onSubmitComplete={() => {
          setAddMemberOpen({ isOpen: false });
        }}
      />
      <div className="flex flex-wrap gap-2 w-full">
        {selectedItemsPosition === "top" && selectedItemsNode}
        {showAddMember ? mainNode : null}
        {selectedItemsPosition === "bottom" && selectedItemsNode}
      </div>
    </Fragment>
  );
}
