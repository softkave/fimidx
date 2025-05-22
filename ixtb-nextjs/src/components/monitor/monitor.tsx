import { useHasPermission } from "@/src/lib/clientHooks/permissionHooks";
import { Pencil, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { MonitorItemMenu } from "./monitor-item-menu";
import { UpdateMonitorFormP1 } from "./update-monitor-form-p1";
import { UpdateMonitorFormP2 } from "./update-monitor-form-p2";
import { UpdateMonitorFormP3 } from "./update-monitor-form-p3";
import { IMonitor } from "fmdx-core/definitions/monitor";
import { kPermissions } from "fmdx-core/definitions/permissions";

export interface IMonitorProps {
  monitor: IMonitor;
}

export function Monitor(props: IMonitorProps) {
  const {
    checks: [canEdit],
  } = useHasPermission({
    orgId: props.monitor.orgId,
    permission: kPermissions.monitor.update,
  });

  const [isEditingP1, setIsEditingP1] = useState(false);
  const [isEditingP2, setIsEditingP2] = useState(false);
  const [isEditingP3, setIsEditingP3] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold break-all">{props.monitor.name}</h1>
        </div>
        <MonitorItemMenu monitor={props.monitor} appId={props.monitor.appId} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-lg font-bold flex-1">Details</h2>
            <Button
              variant="outline"
              onClick={() => setIsEditingP1(!isEditingP1)}
              className="gap-2"
            >
              {isEditingP1 ? (
                <XIcon className="w-4 h-4" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              {isEditingP1 ? "Cancel" : "Edit"}
            </Button>
          </div>
          <UpdateMonitorFormP1
            monitor={props.monitor}
            onSubmitComplete={() => {
              setIsEditingP1(false);
              toast.success("Monitor updated");
            }}
            canEdit={canEdit}
            isEditing={isEditingP1}
          />
        </div>
        <Separator />
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-lg font-bold flex-1">Filters</h2>
            <Button
              variant="outline"
              onClick={() => setIsEditingP2(!isEditingP2)}
              className="gap-2"
            >
              {isEditingP2 ? (
                <XIcon className="w-4 h-4" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              {isEditingP2 ? "Cancel" : "Edit"}
            </Button>
          </div>
          <UpdateMonitorFormP2
            monitor={props.monitor}
            onSubmitComplete={() => {
              setIsEditingP2(false);
              toast.success("Monitor updated");
            }}
            canEdit={canEdit}
            isEditing={isEditingP2}
          />
        </div>
        <Separator />
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-lg font-bold flex-1">Status</h2>
            <Button
              variant="outline"
              onClick={() => setIsEditingP3(!isEditingP3)}
              className="gap-2"
            >
              {isEditingP3 ? (
                <XIcon className="w-4 h-4" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              {isEditingP3 ? "Cancel" : "Edit"}
            </Button>
          </div>
          <UpdateMonitorFormP3
            monitor={props.monitor}
            onSubmitComplete={() => {
              setIsEditingP3(false);
              toast.success("Monitor updated");
            }}
            canEdit={canEdit}
            isEditing={isEditingP3}
          />
        </div>
      </div>
    </div>
  );
}
