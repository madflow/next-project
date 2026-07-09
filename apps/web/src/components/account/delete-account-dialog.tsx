"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { PasswordInput } from "@repo/ui/components/password-input";
import { deleteUser } from "@/lib/auth/client";

export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("accountDeleteDialog");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, {
      error: "Current password is required.",
    }),
  });

  type PasswordFormValues = z.infer<typeof passwordFormSchema>;

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
    },
    mode: "onChange",
  });

  const handleDelete = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      await deleteUser({
        password: data.currentPassword,
        fetchOptions: {
          onSuccess: () => {
            toast.success(t("messages.success"));
            router.push("/goodbye");
          },
          onError: () => {
            toast.error(t("messages.error"));
            setIsLoading(false);
          },
        },
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t("messages.error"));
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(handleDelete)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>

            <div className="space-y-4">
              <Controller
                name="currentPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t("formLabels.currentPassword")}</FieldLabel>
                    <FieldGroup>
                      <PasswordInput
                        {...field}
                        id={field.name}
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                        data-testid="app.user.account.delete.password"
                      />
                    </FieldGroup>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              {t("buttons.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !form.formState.isValid}
              className="cursor-pointer"
              data-testid="app.user.account.delete-account-confirm">
              {isLoading ? <span className="animate-pulse">{t("buttons.confirmLoading")}</span> : t("buttons.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
