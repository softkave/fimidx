"use client";

import {
  UpdateOrgOnSuccessParams,
  useUpdateOrg,
} from "@/src/lib/clientApi/org.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { IOrg } from "fmdx-core/definitions/org";
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

export interface IUpdateOrgFormProps {
  org: IOrg;
  onSubmitComplete: (org: IOrg) => void;
}

export const addOrgFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export function UpdateOrgForm(props: IUpdateOrgFormProps) {
  const { org, onSubmitComplete } = props;

  const form = useForm<z.infer<typeof addOrgFormSchema>>({
    resolver: zodResolver(addOrgFormSchema),
    defaultValues: {
      name: org.name,
      description: org.description ?? "",
    },
  });

  const handleSuccess = useCallback(
    (...args: UpdateOrgOnSuccessParams) => {
      onSubmitComplete(args[1].org);
    },
    [onSubmitComplete]
  );

  const updateOrgHook = useUpdateOrg({
    onSuccess: handleSuccess,
    orgId: org.id,
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof addOrgFormSchema>) => {
      await updateOrgHook.trigger({
        name: values.name,
        description: values.description,
      });
    },
    [updateOrgHook]
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
          Update Organization
        </Button>
      </form>
    </Form>
  );
}
