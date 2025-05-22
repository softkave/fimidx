import { IClientToken } from "fmdx-core/definitions/clientToken";
import { PageMessage } from "../internal/page-message.tsx";
import {
  ClientTokenItem,
  ClientTokenItemSkeleton,
} from "./client-token-item.tsx";

export interface IClientTokensProps {
  clientTokens: IClientToken[];
}

export function ClientTokenItemEmpty() {
  return (
    <div className="w-full px-4">
      <PageMessage
        title="No client tokens found"
        message="Add a client token to get started"
        variant="secondary"
      />
    </div>
  );
}

export function ClientTokens(props: IClientTokensProps) {
  if (props.clientTokens.length === 0) {
    return <ClientTokenItemEmpty />;
  }

  return (
    <div className="w-full">
      {props.clientTokens.map((clientToken) => (
        <ClientTokenItem key={clientToken.id} item={clientToken} />
      ))}
    </div>
  );
}

export function ClientTokensSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <ClientTokenItemSkeleton className="w-full" />
      <ClientTokenItemSkeleton className="w-full" />
      <ClientTokenItemSkeleton className="w-full" />
    </div>
  );
}
