"use client";

import { IOrg } from "@/src/definitions/org";
import { ComponentListHeader } from "../internal/component-list/component-list-header";
import { OrgItemMenu } from "./org-item-menu";

export function OrgHeader(props: { org: IOrg; className?: string }) {
  const { org, className } = props;

  return (
    <ComponentListHeader
      title={org.name}
      description={org.description ?? undefined}
      button={<OrgItemMenu org={org} />}
      className={className}
    />
  );
}
