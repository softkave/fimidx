"use client";

import { GroupContainer } from "../group/group-container";
import { GroupSidebarGroup } from "./group-sidebar-group";

export function GroupSidebarGroupContainer(props: { groupId: string }) {
  return (
    <GroupContainer
      groupId={props.groupId}
      render={({ group }) => (
        <GroupSidebarGroup groupId={group.id} name={group.name} />
      )}
      renderLoading={() => null}
      renderError={() => null}
    />
  );
}
