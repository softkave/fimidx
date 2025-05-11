"use client";

import { IMonitor } from "@/src/definitions/monitor.ts";
import {
  UpdateMonitorOnSuccessParams,
  useUpdateMonitor,
} from "@/src/lib/clientApi/monitor.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form.tsx";
import { Input } from "../ui/input.tsx";
import { Textarea } from "../ui/textarea.tsx";

export interface IUpdateMonitorFormP1Props {
  monitor: IMonitor;
  onSubmitComplete: (monitor: IMonitor) => void;
  canEdit: boolean | undefined;
  isEditing: boolean;
}

export const updateMonitorFormP1Schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export function UpdateMonitorFormP1(props: IUpdateMonitorFormP1Props) {
  const { monitor, onSubmitComplete, canEdit, isEditing } = props;

  const form = useForm<z.infer<typeof updateMonitorFormP1Schema>>({
    resolver: zodResolver(updateMonitorFormP1Schema),
    defaultValues: {
      name: monitor.name,
      description: monitor.description ?? "",
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
    async (values: z.infer<typeof updateMonitorFormP1Schema>) => {
      await updateMonitorHook.trigger({
        name: values.name,
        description: values.description,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="my logs monitor"
                  {...field}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="my logs monitor"
                  {...field}
                  disabled={!isEditing}
                />
              </FormControl>
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
