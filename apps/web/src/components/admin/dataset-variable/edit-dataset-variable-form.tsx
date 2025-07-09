"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { update } from "@/actions/dataset-variable";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateDatasetVariableSchema } from "@/types/dataset-variable";

// Define the form schema
const formSchema = z.object({
  id: z.uuid(),
  label: z.string().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type EditDatasetVariableFormProps = {
  datasetVariable: {
    id: string;
    name: string;
    label: string | null;
    type: string;
    measure: string;
    datasetId: string;
  };
};

export function EditDatasetVariableForm({ datasetVariable }: EditDatasetVariableFormProps) {
  const router = useRouter();
  const t = useTranslations("adminDatasetEditor");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: datasetVariable.id,
      label: datasetVariable.label,
    },
  });

  // Helper function to safely get field value
  const getFieldValue = (value: string | null | undefined): string => {
    return value ?? "";
  };

  const onSubmit = async (values: FormValues) => {
    const updateData = updateDatasetVariableSchema.parse(values);
    try {
      setIsLoading(true);

      await update(datasetVariable.id, updateData);

      toast.success(t("editVariable.form.success"));
      router.refresh();
      router.push(`/admin/datasets/${datasetVariable.datasetId}/editor`);
    } catch (error) {
      console.error("Error updating dataset variable:", error);
      toast.error(t("editVariable.form.errors.updateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            <FormItem>
              <FormLabel>{t("editVariable.form.name.label")}</FormLabel>
              <Input value={getFieldValue(datasetVariable.name)} disabled />
            </FormItem>

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editVariable.form.label.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("editVariable.form.label.placeholder")}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>{t("editVariable.form.type.label")}</FormLabel>
              <Input value={datasetVariable.type} disabled />
            </FormItem>

            <FormItem>
              <FormLabel>{t("editVariable.form.measure.label")}</FormLabel>
              <Input value={datasetVariable.measure} disabled />
            </FormItem>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/datasets/${datasetVariable.datasetId}/editor`)}
              disabled={isLoading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("common.saving") : t("common.saveChanges")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
