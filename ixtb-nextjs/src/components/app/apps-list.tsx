import { IApp } from "fimidx-core/definitions/app";
import { ComponentList } from "../internal/component-list/component-list";
import { ComponentListMessage } from "../internal/component-list/component-list-message";
import { AppItem, AppItemSkeleton } from "./app-item";

export interface IAppsProps {
  apps: IApp[];
}

export function AppItemEmpty() {
  return (
    <ComponentListMessage
      title="No apps found"
      message="Add an app to get started"
    />
  );
}

export function Apps(props: IAppsProps) {
  if (props.apps.length === 0) {
    return <AppItemEmpty />;
  }

  return (
    <ComponentList
      count={props.apps.length}
      renderItem={(index) => (
        <AppItem key={props.apps[index].id} item={props.apps[index]} />
      )}
    />
  );
}

export function AppsSkeleton() {
  return (
    <ComponentList
      count={3}
      renderItem={(index) => <AppItemSkeleton key={index} />}
    />
  );
}
