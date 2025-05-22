import { cn } from "@/src/lib/utils";
import {
  kPermissions,
  kPermissionsList,
} from "fmdx-core/definitions/permissions";
import { Checkbox } from "../ui/checkbox";

const kPermissionsLabels = {
  [kPermissions.wildcard]: "Wildcard",
  [kPermissions.org.update]: "Update Organization",
  [kPermissions.org.delete]: "Delete Organization",
  [kPermissions.app.read]: "Read App",
  [kPermissions.app.update]: "Update App",
  [kPermissions.app.delete]: "Delete App",
  [kPermissions.member.read]: "Read Member",
  [kPermissions.member.readPermissions]: "Read Member Permissions",
  [kPermissions.member.update]: "Update Member",
  [kPermissions.member.invite]: "Invite Member",
  [kPermissions.member.remove]: "Remove Member",
  [kPermissions.log.read]: "Read Log",
  [kPermissions.clientToken.read]: "Read Client Token",
  [kPermissions.clientToken.update]: "Update Client Token",
  [kPermissions.clientToken.delete]: "Delete Client Token",
  [kPermissions.monitor.read]: "Read Monitor",
  [kPermissions.monitor.update]: "Update Monitor",
  [kPermissions.monitor.delete]: "Delete Monitor",
};

const kPermissionsDescriptions: Record<string, string> = {};

export function PermissionsCheckboxes(props: {
  permissions: string[];
  onChange: (permissions: string[]) => void;
  className?: string;
  disabled?: boolean;
}) {
  const { permissions, onChange, className, disabled } = props;
  const hasWildcard = permissions.includes(kPermissions.wildcard);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {kPermissionsList.map((permission) => (
        <div className="items-top flex space-x-2" key={permission}>
          <Checkbox
            id={permission}
            checked={hasWildcard ? true : permissions.includes(permission)}
            onCheckedChange={(checked) => {
              onChange(
                checked
                  ? [...permissions, permission]
                  : permissions.filter((p) => p !== permission)
              );
            }}
            disabled={
              disabled || (hasWildcard && permission !== kPermissions.wildcard)
            }
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor={permission}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {kPermissionsLabels[permission]}
            </label>
            {kPermissionsDescriptions[permission] && (
              <p className="text-xs text-muted-foreground">
                {kPermissionsDescriptions[permission]}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
