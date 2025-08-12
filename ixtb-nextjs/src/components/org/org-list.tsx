import { IOrg } from "@/src/definitions/org";
import { ComponentList } from "../internal/component-list/component-list";
import { ComponentListMessage } from "../internal/component-list/component-list-message";
import { OrgItem, OrgItemSkeleton } from "./org-item";

export interface IOrgsProps {
  orgs: IOrg[];
}

export function OrgItemEmpty() {
  return (
    <ComponentListMessage
      title="No organizations found"
      message="Add an organization to get started"
    />
  );
}

export function Orgs(props: IOrgsProps) {
  if (props.orgs.length === 0) {
    return <OrgItemEmpty />;
  }

  return (
    <ComponentList
      count={props.orgs.length}
      renderItem={(index) => (
        <OrgItem key={props.orgs[index].id} item={props.orgs[index]} />
      )}
    />
  );
}

export function OrgsSkeleton() {
  return (
    <ComponentList
      count={3}
      renderItem={(index) => <OrgItemSkeleton key={index} />}
    />
  );
}
