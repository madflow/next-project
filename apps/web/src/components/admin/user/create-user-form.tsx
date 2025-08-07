"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { create } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateUserTranslations = {
  (key: `validation.${"nameRequired" | "validEmailRequired"}`): string;
  (key: `roles.${"user" | "admin"}`): string;
};

const createFormSchema = (t: CreateUserTranslations) =>
  z.object({
    name: z.string().min(1, {
      message: t("validation.nameRequired"),
    }),
    email: z.email({
      message: t("validation.validEmailRequired"),
    }),
    role: z.enum(["user", "admin"]).default("user"),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

type Role = {
  value: string;
  label: string;
};

const getRoles = (t: CreateUserTranslations): Role[] => [
  { value: "user", label: t("roles.user") },
  { value: "admin", label: t("roles.admin") },
];

export function CreateUserForm() {
  const router = useRouter();
  const t = useTranslations("adminUserCreateForm");
  const roles = getRoles(t as unknown as CreateUserTranslations);

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t as unknown as CreateUserTranslations)) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: "",
      email: "",
      role: "user" as const,
    },
  });

  const onSubmit = async (formData: FormValues) => {
    try {
      await create({
        ...formData,
        emailVerified: false,
        banned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
        banReason: null,
        banExpires: null,
      });
      toast.success(t("messages.createSuccess"));
      router.push("/admin/users");
    } catch (error) {
      toast.error(t("messages.createError"));
      console.error(error);
      return;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("formLabels.name")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("formPlaceholders.name")} data-testid="admin.users.new.form.name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("formLabels.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    placeholder={t("formPlaceholders.email")}
                    data-testid="admin.users.new.form.email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("formLabels.role")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-1/2 lg:w-1/3" data-testid="admin.users.new.form.role">
                      <SelectValue placeholder={t("formPlaceholders.selectRole")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-start gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting}>
            {t("buttons.cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting} data-testid="admin.users.new.form.submit">
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("buttons.saving")}
              </>
            ) : (
              t("buttons.save")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
