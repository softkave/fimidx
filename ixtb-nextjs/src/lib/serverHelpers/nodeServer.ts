export function getNodeServerURL() {
  const nodeServerURL = process.env.FMDX_NODE_SERVER_URL;
  if (!nodeServerURL) {
    throw new Error("FMDX_NODE_SERVER_URL is not set");
  }
  return nodeServerURL;
}

export function getNodeServerInternalAccessKey() {
  const nodeServerInternalAccessKey =
    process.env.FMDX_NODE_SERVER_INTERNAL_ACCESS_KEY;
  if (!nodeServerInternalAccessKey) {
    throw new Error("FMDX_NODE_SERVER_INTERNAL_ACCESS_KEY is not set");
  }
  return nodeServerInternalAccessKey;
}
