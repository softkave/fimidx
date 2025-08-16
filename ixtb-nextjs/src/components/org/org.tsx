import { IOrg } from "@/src/definitions/org";
import { ValueOf } from "type-fest";
import { AppsPage } from "../app/apps-page";
import { OrgUpdateState } from "./org-update-state";

export const kOrgTabs = {
  apps: "apps",
} as const;

export type OrgTab = ValueOf<typeof kOrgTabs>;

export interface IOrgProps {
  org: IOrg;
  defaultTab: OrgTab;
}

export function Org(props: IOrgProps) {
  const { defaultTab } = props;
  let contentNode: React.ReactNode = null;

  if (defaultTab === kOrgTabs.apps) {
    contentNode = <AppsPage orgId={props.org.id} withAppWrapper={false} />;
  }

  return (
    <div className="max-w-md md:max-w-lg mx-auto w-full">
      <OrgUpdateState org={props.org} />
      {contentNode}
    </div>
  );
}
