import { IApp } from "fmdx-core/definitions/app";
import { PageMessage } from "../internal/page-message";
import { AppItem, AppItemSkeleton } from "./app-item";

export interface IAppsProps {
  apps: IApp[];
}

export function AppItemEmpty() {
  return (
    <div className="w-full px-4">
      <PageMessage
        title="No apps found"
        message="Add a app to get started"
        variant="secondary"
      />
    </div>
  );
}

export function Apps(props: IAppsProps) {
  if (props.apps.length === 0) {
    return <AppItemEmpty />;
  }

  return (
    <div className="w-full">
      {props.apps.map((app) => (
        <AppItem key={app.id} item={app} />
      ))}
    </div>
  );
}

export function AppsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <AppItemSkeleton className="w-full" />
      <AppItemSkeleton className="w-full" />
      <AppItemSkeleton className="w-full" />
    </div>
  );
}
