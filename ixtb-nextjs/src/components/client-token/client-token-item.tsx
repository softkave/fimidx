import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { IClientToken } from "fimidx-core/definitions/clientToken";
import Link from "next/link";
import { ComponentListItemSkeleton } from "../internal/component-list/component-list-item-skeleton.tsx";
import { ComponentListItem } from "../internal/component-list/component-list-item.tsx";
import { ClientTokenItemMenu } from "./client-token-item-menu.tsx";

export interface IClientTokenItemProps {
  item: IClientToken;
}

export function ClientTokenItem(props: IClientTokenItemProps) {
  const orgId = props.item.meta?.orgId;
  const appId = props.item.meta?.appId;

  if (!orgId || !appId) {
    return null;
  }

  return (
    <ComponentListItem
      button={<ClientTokenItemMenu clientToken={props.item} appId={appId} />}
    >
      <Link
        href={kClientPaths.app.org.app.clientToken.single(
          orgId,
          appId,
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
