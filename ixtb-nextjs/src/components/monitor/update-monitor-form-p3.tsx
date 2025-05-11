"use client";

import {
  IMonitor,
  kMonitorStatus,
  kMonitorStatusLabels,
  MonitorStatus,
} from "@/src/definitions/monitor.ts";
import { durationSchema } from "@/src/definitions/other.ts";
import {
  UpdateMonitorOnSuccessParams,
  useUpdateMonitor,
} from "@/src/lib/clientApi/monitor.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DurationListInput } from "../internal/duration-list-input.tsx";
import { SelectMemberContainer } from "../member/select-member-container.tsx";
import { Button } from "../ui/button.tsx";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form.tsx";
import { Label } from "../ui/label.tsx";
import { Switch } from "../ui/switch.tsx";

export interface IUpdateMonitorFormP3Props {
  monitor: IMonitor;
  onSubmitComplete: (monitor: IMonitor) => void;
  canEdit: boolean | undefined;
  isEditing: boolean;
}

export const updateMonitorFormP3Schema = z.object({
  status: z.nativeEnum(kMonitorStatus).optional(),
  reportsTo: z.array(z.string().min(1)).optional(),
  duration: durationSchema.optional(),
});

export function UpdateMonitorFormP3(props: IUpdateMonitorFormP3Props) {
  const { monitor, onSubmitComplete, canEdit, isEditing } = props;

  const form = useForm<z.infer<typeof updateMonitorFormP3Schema>>({
    resolver: zodResolver(updateMonitorFormP3Schema),
    defaultValues: {
      status: monitor.status,
      reportsTo: monitor.reportsTo.map((report) => report.userId),
      duration: monitor.duration,
    },
  });

  const handleSuccess = useCallback(
    (...args: UpdateMonitorOnSuccessParams) => {
      onSubmitComplete(args[1].monitor);
    },
    [onSubmitComplete]
  );

  const updateMonitorHook = useUpdateMonitor({
    onSuccess: handleSuccess,
    monitorId: monitor.id,
    orgId: monitor.orgId,
    appId: monitor.appId,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof updateMonitorFormP3Schema>) => {
      await updateMonitorHook.trigger({
        status: values.status,
        reportsTo: values.reportsTo,
        duration: values.duration,
      });
    },
    [updateMonitorHook]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={(evt) => {
          evt.stopPropagation();
          form.handleSubmit(onSubmit)(evt);
        }}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={field.value === kMonitorStatus.enabled}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? kMonitorStatus.enabled
                          : kMonitorStatus.disabled
                      );
                    }}
                    disabled={!isEditing || !canEdit}
                  />
                  <Label htmlFor="status">
                    {kMonitorStatusLabels[field.value as MonitorStatus]}
                  </Label>
                </div>
              </FormControl>
              <FormDescription>
                This is the status of the monitor.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reportsTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reports To</FormLabel>
              <SelectMemberContainer
                orgId={monitor.orgId}
                onChange={field.onChange}
                selected={field.value}
                isForm
                disabled={!isEditing || !canEdit}
              />
              <FormDescription>
                This is the users that will be notified when the monitor is
                triggered.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration</FormLabel>
              <FormControl>
                <DurationListInput
                  value={field.value ?? {}}
                  onChange={field.onChange}
                  disabled={!isEditing || !canEdit}
                />
              </FormControl>
              <FormDescription>
                This is the duration of the monitor.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={!canEdit || !isEditing}
        >
          Update Monitor
        </Button>
      </form>
    </Form>
  );
}
