"use client";

import {
  UpdateAppOnSuccessParams,
  useUpdateApp,
} from "@/src/lib/clientApi/app.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { IApp } from "fimidx-core/definitions/app";
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

export interface IUpdateAppFormProps {
  app: IApp;
  onSubmitComplete: (app?: IApp) => void;
}

export const addAppFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export function UpdateAppForm(props: IUpdateAppFormProps) {
  const { app, onSubmitComplete } = props;

  const form = useForm<z.infer<typeof addAppFormSchema>>({
    resolver: zodResolver(addAppFormSchema),
    defaultValues: {
      name: app.name,
      description: app.description ?? "",
    },
  });

  const handleSuccess = useCallback(
    (...args: UpdateAppOnSuccessParams) => {
      onSubmitComplete(undefined);
    },
    [onSubmitComplete]
  );

  const updateAppHook = useUpdateApp({
    onSuccess: handleSuccess,
    appId: app.id,
    orgId: app.orgId,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof addAppFormSchema>) => {
      await updateAppHook.trigger({
        id: app.id,
        name: values.name,
        description: values.description,
      });
    },
    [updateAppHook, app.id]
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
                <Input placeholder="my logs app" {...field} />
              </FormControl>
              <FormDescription>What is the name of the app?</FormDescription>
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
                <Textarea placeholder="my logs app" {...field} />
              </FormControl>
              <FormDescription>
                What is the description of the app?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Update App
        </Button>
      </form>
    </Form>
  );
}
