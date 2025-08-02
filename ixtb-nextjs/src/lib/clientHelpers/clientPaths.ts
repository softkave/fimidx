const kBaseUrl = process.env.NEXT_PUBLIC_URL ?? "https://fimidx.fimidara.com";

export const kClientPaths = {
  index: "/",
  signin: "/signin",
  signinWithRedirect: (redirectTo: string) =>
    `/signin?redirectTo=${redirectTo}`,
  app: {
    index: "/app",
    profile: "/app/profile",
    org: {
      index: "/app/orgs",
      single: (orgId: string) => `/app/orgs/${orgId}`,
      members: {
        index: (orgId: string) => `/app/orgs/${orgId}/members`,
        single: (orgId: string, memberId: string) =>
          `/app/orgs/${orgId}/members/${memberId}`,
      },
      app: {
        index: (orgId: string) => `/app/orgs/${orgId}/apps`,
        single: (orgId: string, appId: string) =>
          `/app/orgs/${orgId}/apps/${appId}`,
        clientToken: {
          index: (orgId: string, appId: string) =>
            `/app/orgs/${orgId}/apps/${appId}/client-tokens`,
          single: (orgId: string, appId: string, clientTokenId: string) =>
            `/app/orgs/${orgId}/apps/${appId}/client-tokens/${clientTokenId}`,
        },
        log: {
          index: (orgId: string, appId: string) =>
            `/app/orgs/${orgId}/apps/${appId}/logs`,
        },
        monitors: {
          index: (orgId: string, appId: string) =>
            `/app/orgs/${orgId}/apps/${appId}/monitors`,
          single: (orgId: string, appId: string, monitorId: string) =>
            `/app/orgs/${orgId}/apps/${appId}/monitors/${monitorId}`,
        },
        callbacks: {
          index: (orgId: string, appId: string) =>
            `/app/orgs/${orgId}/apps/${appId}/callbacks`,
          single: (orgId: string, appId: string, callbackId: string) =>
            `/app/orgs/${orgId}/apps/${appId}/callbacks/${callbackId}`,
        },
      },
    },
    myRequests: "/app/my-requests",
  },
  emailTemplates: {
    index: "/email-templates",
    addParticipant: "/email-templates/add-participant",
  },
  withURL(path: string) {
    return `${kBaseUrl}${path}`;
  },
};
