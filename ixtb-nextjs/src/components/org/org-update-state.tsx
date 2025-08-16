"use client";

import { IOrg } from "@/src/definitions/org";
import useTitle from "@/src/hooks/use-title.ts";
import { kAppConstants } from "fimidx-core/definitions/appConstants";
import { useContext, useEffect } from "react";
import { GlobalStateContext } from "../contexts/global-state-context";

export function OrgUpdateState(props: { org: IOrg }) {
  useTitle(`${kAppConstants.name} - ${props.org.name}`);
  const globalState = useContext(GlobalStateContext);

  useEffect(() => {
    globalState.setOrgName(props.org.name);
    return () => {
      globalState.setOrgName(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want to re-run this effect when the list name changes
  }, [props.org.name]);

  return null;
}
