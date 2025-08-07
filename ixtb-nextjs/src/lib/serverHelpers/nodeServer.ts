import { getCoreConfig } from "fimidx-core/common/getCoreConfig";

export function getNodeServerURL() {
  const { fimidxInternal } = getCoreConfig();
  return fimidxInternal.nodeServerUrl;
}

export function getNodeServerInternalAccessKey() {
  const { fimidxInternal } = getCoreConfig();
  return fimidxInternal.internalAccessKey;
}
