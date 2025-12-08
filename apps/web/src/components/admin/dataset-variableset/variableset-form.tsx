"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createVariableset, updateVariableset } from "@/actions/dataset-variableset";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DatasetVariableset, VariablesetTreeNode } from "@/types/dataset-variableset";

const CATEGORY_OPTIONS = ["general", "multi_response", "matrix"] as const;

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  category: z.enum(CATEGORY_OPTIONS),
});

const NO_PARENT_VALUE = "__NO_PARENT__";

type FormData = z.infer<typeof formSchema>;

interface VariablesetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetId: string;
  variableset?: DatasetVariableset;
  availableParents: VariablesetTreeNode[];
  onSuccess?: () => void;
}

export function VariablesetForm({
  open,
  onOpenChange,
  datasetId,
  variableset,
  availableParents,
  onSuccess,
}: VariablesetFormProps) {
  const t = useTranslations("adminDatasetVariableset");
  const isEditing = !!variableset;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: NO_PARENT_VALUE,
      category: "general",
    },
  });

  // Update form values when variableset prop changes
  useEffect(() => {
    if (variableset) {
      form.reset({
        name: variableset.name,
        description: variableset.description || "",
        parentId: variableset.parentId || NO_PARENT_VALUE,
        category: variableset.category,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        parentId: NO_PARENT_VALUE,
        category: "general",
      });
    }
  }, [variableset, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const parentId = data.parentId === NO_PARENT_VALUE ? null : data.parentId || null;

      if (isEditing) {
        await updateVariableset(variableset.id, {
          name: data.name,
          description: data.description || null,
          parentId,
          category: data.category,
        });
        toast.success(t("form.updateSuccess"));
      } else {
        await createVariableset({
          name: data.name,
          description: data.description || null,
          parentId,
          datasetId,
          orderIndex: 0,
          category: data.category,
        });
        toast.success(t("form.createSuccess"));
      }

      onOpenChange(false);
      form.reset({
        name: "",
        description: "",
        parentId: NO_PARENT_VALUE,
        category: "general",
      });
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(isEditing ? t("form.updateError") : t("form.createError"));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        name: "",
        description: "",
        parentId: NO_PARENT_VALUE,
        category: "general",
      });
    }
    onOpenChange(newOpen);
  };

  // Filter out current variableset and its descendants from available parents
  const filteredParents = availableParents.filter((parent) => {
    if (isEditing && parent.id === variableset.id) {
      return false;
    }
    // TODO: Also filter out descendants to prevent circular references
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editSet") : t("createSet")}</DialogTitle>
          <DialogDescription>{isEditing ? t("form.editDescription") : t("form.createDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t("form.name")}</FieldLabel>
                <FieldGroup>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={t("form.namePlaceholder")}
                    aria-invalid={fieldState.invalid}
                    data-testid="admin.dataset.variableset.form.name"
                  />
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t("form.description")}</FieldLabel>
                <FieldGroup>
                  <Textarea
                    {...field}
                    id={field.name}
                    placeholder={t("form.descriptionPlaceholder")}
                    rows={3}
                    aria-invalid={fieldState.invalid}
                    data-testid="admin.dataset.variableset.form.description"
                  />
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="parentId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t("form.parent")}</FieldLabel>
                <FieldGroup>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id={field.name}
                      className="w-full"
                      data-testid="admin.dataset.variableset.form.parent">
                      <SelectValue placeholder={t("form.selectParent")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT_VALUE}>{t("form.noParent")}</SelectItem>
                      {filteredParents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {"  ".repeat(parent.level)}
                          {parent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="category"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t("form.category")}</FieldLabel>
                <FieldGroup>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id={field.name}
                      className="w-full"
                      data-testid="admin.dataset.variableset.form.category">
                      <SelectValue placeholder={t("form.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
                data-testid="admin.dataset.variableset.form.cancel">
                {t("form.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
                data-testid="admin.dataset.variableset.form.submit">
                {form.formState.isSubmitting ? t("form.saving") : isEditing ? t("form.update") : t("form.create")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
