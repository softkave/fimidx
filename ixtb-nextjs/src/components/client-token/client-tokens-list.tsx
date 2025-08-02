import { IClientToken } from "fimidx-core/definitions/clientToken";
import { ComponentListMessage } from "../internal/component-list/component-list-message.tsx";
import { ComponentList } from "../internal/component-list/component-list.tsx";
import {
  ClientTokenItem,
  ClientTokenItemSkeleton,
} from "./client-token-item.tsx";

export interface IClientTokensProps {
  clientTokens: IClientToken[];
  emptyTitle?: string;
  emptyMessage?: string;
}

export function ClientTokenItemEmpty(props: {
  title?: string;
  message?: string;
}) {
  return (
    <ComponentListMessage
      title={props.title ?? "No client tokens found"}
      message={props.message ?? "Add a client token to get started"}
    />
  );
}

export function ClientTokens(props: IClientTokensProps) {
  if (props.clientTokens.length === 0) {
    return (
      <ClientTokenItemEmpty
        title={props.emptyTitle}
        message={props.emptyMessage}
      />
    );
  }

  return (
    <ComponentList
      count={props.clientTokens.length}
      renderItem={(index) => (
        <ClientTokenItem
          key={props.clientTokens[index].id}
          item={props.clientTokens[index]}
        />
      )}
    />
  );
}

export function ClientTokensSkeleton() {
  return (
    <ComponentList
      count={3}
      renderItem={(index) => <ClientTokenItemSkeleton key={index} />}
    />
  );
}
