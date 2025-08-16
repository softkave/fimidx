"use client";

import useTitle from "@/src/hooks/use-title.ts";
import { IApp } from "fimidx-core/definitions/app";
import { kAppConstants } from "fimidx-core/definitions/appConstants";
import { useContext, useEffect } from "react";
import { GlobalStateContext } from "../contexts/global-state-context";

export function AppUpdateState(props: { app: IApp }) {
  useTitle(`${kAppConstants.name} - ${props.app.name}`);
  const globalState = useContext(GlobalStateContext);

  useEffect(() => {
    globalState.setAppName(props.app.name);
    return () => {
      globalState.setAppName(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want to re-run this effect when the list name changes
  }, [props.app.name]);

  return null;
}
