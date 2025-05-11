import { IOrg } from "@/src/definitions/org";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import Link from "next/link";
import { ValueOf } from "type-fest";
import { AppsPage } from "../app/apps-page";
import { OrgItemMenu } from "./org-item-menu";

export const kOrgTabs = {
  apps: "apps",
} as const;

export type OrgTab = ValueOf<typeof kOrgTabs>;

export interface IOrgProps {
  org: IOrg;
  defaultTab: OrgTab;
}

export function Org(props: IOrgProps) {
  return (
    <div className="flex flex-col gap-4 p-4 pt-0 max-w-lg mx-auto">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold">{props.org.name}</h1>
          <p className="text-muted-foreground">{props.org.description}</p>
        </div>
        <OrgItemMenu org={props.org} />
      </div>
      <Tabs defaultValue={props.defaultTab} className="w-full">
        <TabsList className="w-full max-w-lg">
          <TabsTrigger value={kOrgTabs.apps}>
            <Link href={kClientPaths.app.org.app.index(props.org.id)}>
              Apps
            </Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={kOrgTabs.apps} className="pt-3">
          <AppsPage orgId={props.org.id} className="gap-8" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
