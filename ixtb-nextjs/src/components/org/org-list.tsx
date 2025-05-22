import { IOrg } from "fmdx-core/definitions/org";
import { PageMessage } from "../internal/page-message";
import { OrgItem, OrgItemSkeleton } from "./org-item";

export interface IOrgsProps {
  orgs: IOrg[];
}

export function OrgItemEmpty() {
  return (
    <div className="w-full px-4">
      <PageMessage
        title="No organizations found"
        message="Add an organization to get started"
        variant="secondary"
      />
    </div>
  );
}

export function Orgs(props: IOrgsProps) {
  if (props.orgs.length === 0) {
    return <OrgItemEmpty />;
  }

  return (
    <div className="w-full">
      {props.orgs.map((org) => (
        <OrgItem key={org.id} item={org} />
      ))}
    </div>
  );
}

export function OrgsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <OrgItemSkeleton className="w-full" />
      <OrgItemSkeleton className="w-full" />
      <OrgItemSkeleton className="w-full" />
    </div>
  );
}
