const kBaseUrl = process.env.NEXT_PUBLIC_URL ?? "https://fmdx.fimidara.com";

export const kClientPaths = {
  index: "/",
  signin: "/signin",
  signinWithRedirect: (redirectTo: string) =>
    `/signin?redirectTo=${redirectTo}`,
  app: {
    index: "/app",
    profile: "/app/profile",
    group: {
      index: "/app/groups",
      single: (groupId: string) => `/app/groups/${groupId}`,
      members: {
        index: (groupId: string) => `/app/groups/${groupId}/members`,
        single: (groupId: string, memberId: string) =>
          `/app/groups/${groupId}/members/${memberId}`,
      },
      app: {
        index: (groupId: string) => `/app/groups/${groupId}/apps`,
        single: (groupId: string, appId: string) =>
          `/app/groups/${groupId}/apps/${appId}`,
        clientToken: {
          index: (groupId: string, appId: string) =>
            `/app/groups/${groupId}/apps/${appId}/client-tokens`,
          single: (groupId: string, appId: string, clientTokenId: string) =>
            `/app/groups/${groupId}/apps/${appId}/client-tokens/${clientTokenId}`,
        },
        log: {
          index: (groupId: string, appId: string) =>
            `/app/groups/${groupId}/apps/${appId}/logs`,
        },
        monitors: {
          index: (groupId: string, appId: string) =>
            `/app/groups/${groupId}/apps/${appId}/monitors`,
          single: (groupId: string, appId: string, monitorId: string) =>
            `/app/groups/${groupId}/apps/${appId}/monitors/${monitorId}`,
        },
        callbacks: {
          index: (groupId: string, appId: string) =>
            `/app/groups/${groupId}/apps/${appId}/callbacks`,
          single: (groupId: string, appId: string, callbackId: string) =>
            `/app/groups/${groupId}/apps/${appId}/callbacks/${callbackId}`,
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
