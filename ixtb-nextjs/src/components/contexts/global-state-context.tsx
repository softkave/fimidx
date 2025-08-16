"use client";

import { createContext, useMemo, useState } from "react";

export interface IGlobalState {
  appName?: string;
  orgName?: string;
  setAppName: (appName: string | undefined) => void;
  setOrgName: (orgName: string | undefined) => void;
}

export const GlobalStateContext = createContext<IGlobalState>({
  setAppName: () => {},
  setOrgName: () => {},
});

export function GlobalStateProvider(props: { children: React.ReactNode }) {
  const [appName, setAppName] = useState<string | undefined>(undefined);
  const [orgName, setOrgName] = useState<string | undefined>(undefined);
  const globalState = useMemo(() => {
    return {
      appName,
      setAppName,
      orgName,
      setOrgName,
    };
  }, [appName, orgName]);

  return (
    <GlobalStateContext.Provider value={globalState}>
      {props.children}
    </GlobalStateContext.Provider>
  );
}
