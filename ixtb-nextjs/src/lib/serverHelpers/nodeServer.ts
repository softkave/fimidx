export function getNodeServerURL() {
  const nodeServerURL = process.env.FIMIDX_NODE_SERVER_URL;
  if (!nodeServerURL) {
    throw new Error("FIMIDX_NODE_SERVER_URL is not set");
  }
  return nodeServerURL;
}

export function getNodeServerInternalAccessKey() {
  const nodeServerInternalAccessKey =
    process.env.FIMIDX_NODE_SERVER_INTERNAL_ACCESS_KEY;
  if (!nodeServerInternalAccessKey) {
    throw new Error("FIMIDX_NODE_SERVER_INTERNAL_ACCESS_KEY is not set");
  }
  return nodeServerInternalAccessKey;
}
