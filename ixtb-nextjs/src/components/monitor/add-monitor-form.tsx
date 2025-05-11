"use client";

import { IMonitor, kMonitorStatus } from "@/src/definitions/monitor.ts";
import {
  AddMonitorOnSuccessParams,
  useAddMonitor,
} from "@/src/lib/clientApi/monitor.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Input } from "../ui/input.tsx";
import { Textarea } from "../ui/textarea.tsx";

export interface IAddMonitorFormProps {
  orgId: string;
  appId: string;
  onSubmitComplete: (monitor: IMonitor) => void;
}

export const addMonitorFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export function AddMonitorForm(props: IAddMonitorFormProps) {
  const { orgId, appId, onSubmitComplete } = props;

  const form = useForm<z.infer<typeof addMonitorFormSchema>>({
    resolver: zodResolver(addMonitorFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleSuccess = useCallback(
    (...args: AddMonitorOnSuccessParams) => {
      onSubmitComplete(args[1].monitor);
    },
    [onSubmitComplete]
  );

  const addMonitorHook = useAddMonitor({
    onSuccess: handleSuccess,
    orgId: orgId,
    appId: appId,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof addMonitorFormSchema>) => {
      await addMonitorHook.trigger({
        name: values.name,
        description: values.description,
        status: kMonitorStatus.disabled,
        reportsTo: [],
        duration: {},
        filters: [],
      });
    },
    [addMonitorHook]
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
                <Input placeholder="my logs monitor" {...field} />
              </FormControl>
              <FormDescription>
                This is the name of the monitor.
              </FormDescription>
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
                <Textarea placeholder="my logs monitor" {...field} />
              </FormControl>
              <FormDescription>
                This is the description of the monitor.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Monitor
        </Button>
      </form>
    </Form>
  );
}
