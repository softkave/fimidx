export const kPermissions = {
  wildcard: "*",
  org: {
    update: "org:update",
    delete: "org:delete",
  },
  app: {
    read: "app:read",
    update: "app:update",
    delete: "app:delete",
  },
  member: {
    read: "member:read",
    readPermissions: "member:readPermissions",
    update: "member:update",
    invite: "member:invite",
    remove: "member:remove",
  },
  log: {
    read: "log:read",
  },
  clientToken: {
    read: "clientToken:read",
    update: "clientToken:update",
    delete: "clientToken:delete",
  },
  monitor: {
    read: "monitor:read",
    update: "monitor:update",
    delete: "monitor:delete",
  },
  callback: {
    read: "callback:read",
  },
  message: {
    read: "message:read",
  },
  ws: {
    read: "ws:read",
    update: "ws:update",
    delete: "ws:delete",
  },
  obj: {
    read: "obj:read",
    update: "obj:update",
    delete: "obj:delete",
  },
};

export const kPermissionsList = [
  kPermissions.wildcard,
  kPermissions.org.update,
  kPermissions.org.delete,
  kPermissions.app.read,
  kPermissions.app.update,
  kPermissions.app.delete,
  kPermissions.member.read,
  kPermissions.member.readPermissions,
  kPermissions.member.update,
  kPermissions.member.invite,
  kPermissions.member.remove,
  kPermissions.log.read,
  kPermissions.clientToken.read,
  kPermissions.clientToken.update,
  kPermissions.clientToken.delete,
  kPermissions.monitor.read,
  kPermissions.monitor.update,
  kPermissions.monitor.delete,
  kPermissions.callback.read,
  kPermissions.message.read,
  kPermissions.ws.read,
  kPermissions.ws.update,
  kPermissions.ws.delete,
  kPermissions.obj.read,
  kPermissions.obj.update,
  kPermissions.obj.delete,
];
