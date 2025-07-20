import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { IApp } from "fmdx-core/definitions/app";
import Link from "next/link";
import { ComponentListItemSkeleton } from "../internal/component-list/component-list-item-skeleton.tsx";
import { ComponentListItem } from "../internal/component-list/component-list-item.tsx";
import { AppItemMenu } from "./app-item-menu.tsx";

export interface IAppItemProps {
  item: IApp;
}

export function AppItem(props: IAppItemProps) {
  return (
    <ComponentListItem button={<AppItemMenu app={props.item} />}>
      <Link
        href={kClientPaths.app.org.app.single(props.item.orgId, props.item.id)}
        className="flex-1"
      >
        <div>
          <h3 className="font-medium">{props.item.name}</h3>
          <p className="text-muted-foreground">{props.item.description}</p>
        </div>
      </Link>
    </ComponentListItem>
  );
}

export function AppItemSkeleton(props: { className?: string }) {
  return <ComponentListItemSkeleton className={props.className} />;
}
