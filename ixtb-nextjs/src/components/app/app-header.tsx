"use client";

import { IApp } from "fimidx-core/definitions/app";
import { ComponentListHeader } from "../internal/component-list/component-list-header";
import { AppItemMenu } from "./app-item-menu";

export function AppHeader(props: { app: IApp; className?: string }) {
  const { app, className } = props;

  return (
    <ComponentListHeader
      title={app.name}
      description={app.description ?? undefined}
      button={<AppItemMenu app={app} />}
      className={className}
    />
  );
}
