"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteUser } from "@/lib/auth-client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";

export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations();
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
  });

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteUser({
        password: form.getValues("currentPassword"),
        fetchOptions: {
          onSuccess: () => {
            toast.success(t("account.delete.success"));
            router.push("/goodbye");
          },
          onError: () => {
            toast.error(t("account.delete.error"));
            setIsLoading(false);
          },
        },
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t("account.delete.error"));
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("account.delete.confirm.title")}</DialogTitle>
          <DialogDescription>{t("account.delete.confirm.description")}</DialogDescription>

          <Form {...form}>
            <form className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("account.password.fields.currentPassword")}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} data-testid="app.user.account.delete.password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t("account.delete.confirm.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || !form.formState.isValid}
            className="cursor-pointer"
            data-testid="app.user.account.delete-account-confirm">
            {isLoading ? (
              <span className="animate-pulse">{t("account.delete.confirm.confirm")}...</span>
            ) : (
              t("account.delete.confirm.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
