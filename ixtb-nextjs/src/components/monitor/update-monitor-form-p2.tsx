"use client";

import {
  UpdateMonitorOnSuccessParams,
  useUpdateMonitor,
} from "@/src/lib/clientApi/monitor.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { logPartFilterListSchema } from "fmdx-core/definitions/log";
import { IMonitor } from "fmdx-core/definitions/monitor";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LogsFilterListContainer } from "../log/filter/logs-filter-list-container.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form.tsx";

export interface IUpdateMonitorFormP2Props {
  monitor: IMonitor;
  onSubmitComplete: (monitor: IMonitor) => void;
  canEdit: boolean | undefined;
  isEditing: boolean;
}

export const updateMonitorFormP1Schema = z.object({
  filters: logPartFilterListSchema.optional(),
});

export function UpdateMonitorFormP2(props: IUpdateMonitorFormP2Props) {
  const { monitor, onSubmitComplete, canEdit, isEditing } = props;

  const form = useForm<z.infer<typeof updateMonitorFormP1Schema>>({
    resolver: zodResolver(updateMonitorFormP1Schema),
    defaultValues: {
      filters: monitor.filters,
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
    appId: monitor.appId,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof updateMonitorFormP1Schema>) => {
      await updateMonitorHook.trigger({
        id: monitor.id,
        filters: values.filters,
      });
    },
    [updateMonitorHook, monitor.id]
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
          name="filters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Filters</FormLabel>
              <FormControl>
                <LogsFilterListContainer
                  groupId={monitor.groupId}
                  appId={monitor.appId}
                  onChange={field.onChange}
                  filters={field.value ?? []}
                  applyButtonText="Update filters"
                  applyButtonClassName="w-full"
                  applyButtonVariant="default"
                  applyButtonType="submit"
                  disabled={!isEditing || !canEdit}
                  applyButtonLoading={updateMonitorHook.isMutating}
                  applyButtonDisabled={!canEdit}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
