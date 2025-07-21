import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { IClientToken } from "fmdx-core/definitions/clientToken";
import Link from "next/link";
import { ComponentListItem } from "../internal/component-list/component-list-item.tsx";
import { ClientTokenItemMenu } from "./client-token-item-menu.tsx";
import { ComponentListItemSkeleton } from "../internal/component-list/component-list-item-skeleton.tsx";

export interface IClientTokenItemProps {
  item: IClientToken;
}

export function ClientTokenItem(props: IClientTokenItemProps) {
  return (
    <ComponentListItem
      button={
        <ClientTokenItemMenu
          clientToken={props.item}
          appId={props.item.appId}
        />
      }
    >
      <Link
        href={kClientPaths.app.org.app.clientToken.single(
          props.item.groupId,
          props.item.appId,
          props.item.id
        )}
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

export function ClientTokenItemSkeleton(props: { className?: string }) {
  return <ComponentListItemSkeleton className={props.className} />;
}
