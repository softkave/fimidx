import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { IGroup } from "fmdx-core/definitions/group";
import Link from "next/link";
import { ValueOf } from "type-fest";
import { AppsPage } from "../app/apps-page";
import { GroupItemMenu } from "./group-item-menu";

export const kGroupTabs = {
  apps: "apps",
} as const;

export type GroupTab = ValueOf<typeof kGroupTabs>;

export interface IGroupProps {
  group: IGroup;
  defaultTab: GroupTab;
}

export function Group(props: IGroupProps) {
  return (
    <div className="flex flex-col gap-4 p-4 pt-0 max-w-lg mx-auto">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold">{props.group.name}</h1>
          <p className="text-muted-foreground">{props.group.description}</p>
        </div>
        <GroupItemMenu group={props.group} />
      </div>
      <Tabs defaultValue={props.defaultTab} className="w-full">
        <TabsList className="w-full max-w-lg">
          <TabsTrigger value={kGroupTabs.apps}>
            <Link href={kClientPaths.app.group.app.index(props.group.id)}>
              Apps
            </Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={kGroupTabs.apps} className="pt-3">
          <AppsPage groupId={props.group.id} className="gap-8" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
