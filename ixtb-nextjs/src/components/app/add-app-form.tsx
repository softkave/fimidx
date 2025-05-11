"use client";

import { IApp } from "@/src/definitions/app.ts";
import { AddAppOnSuccessParams, useAddApp } from "@/src/lib/clientApi/app.ts";
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

export interface IAddAppFormProps {
  orgId: string;
  onSubmitComplete: (app: IApp) => void;
}

export const addAppFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export function AddAppForm(props: IAddAppFormProps) {
  const { orgId, onSubmitComplete } = props;

  const form = useForm<z.infer<typeof addAppFormSchema>>({
    resolver: zodResolver(addAppFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleSuccess = useCallback(
    (...args: AddAppOnSuccessParams) => {
      onSubmitComplete(args[1].app);
    },
    [onSubmitComplete]
  );

  const addAppHook = useAddApp({
    onSuccess: handleSuccess,
    orgId: orgId,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof addAppFormSchema>) => {
      await addAppHook.trigger({
        name: values.name,
        description: values.description,
      });
    },
    [addAppHook]
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
              <FormDescription>This is the name of the app.</FormDescription>
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
                This is the description of the app.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create App
        </Button>
      </form>
    </Form>
  );
}
