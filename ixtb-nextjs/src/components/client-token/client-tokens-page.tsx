import { cn } from "@/src/lib/utils.ts";
import { AppPage } from "../internal/app-page.tsx";
import { ClientTokenListContainer } from "./client-tokens-container.tsx";
import { ClientTokensHeader } from "./client-tokens-header.tsx";

export function ClientTokensPage(props: {
  appId: string;
  orgId: string;
  className?: string;
  title?: string;
  description?: string;
  withAppWrapper?: boolean;
}) {
  const { withAppWrapper = true } = props;
  const contentNode = (
    <div className={cn("flex flex-col max-w-lg mx-auto", props.className)}>
      <ClientTokensHeader
        appId={props.appId}
        orgId={props.orgId}
        title={props.title}
        description={props.description}
      />
      <ClientTokenListContainer
        appId={props.appId}
        showNoClientTokensMessage={false}
      />
    </div>
  );

  if (withAppWrapper) {
    return <AppPage>{contentNode}</AppPage>;
  }

  return contentNode;
}
