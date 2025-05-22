"use client";

import { AddOrgOnSuccessParams, useAddOrg } from "@/src/lib/clientApi/org.ts";
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
import { IOrg } from "fmdx-core/definitions/org";

export interface IAddOrgFormProps {
  onSubmitComplete: (org: IOrg) => void;
}

export const addOrgFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export function AddOrgForm(props: IAddOrgFormProps) {
  const { onSubmitComplete } = props;

  const form = useForm<z.infer<typeof addOrgFormSchema>>({
    resolver: zodResolver(addOrgFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleSuccess = useCallback(
    (...args: AddOrgOnSuccessParams) => {
      onSubmitComplete(args[1].org);
    },
    [onSubmitComplete]
  );

  const addOrgHook = useAddOrg({
    onSuccess: handleSuccess,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof addOrgFormSchema>) => {
      await addOrgHook.trigger({
        name: values.name,
        description: values.description,
      });
    },
    [addOrgHook]
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
                <Input placeholder="my logs organization" {...field} />
              </FormControl>
              <FormDescription>
                This is the name of the organization.
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
                <Textarea placeholder="my logs organization" {...field} />
              </FormControl>
              <FormDescription>
                This is the description of the organization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Organization
        </Button>
      </form>
    </Form>
  );
}
