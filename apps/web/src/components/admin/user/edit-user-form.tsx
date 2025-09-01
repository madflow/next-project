"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { update } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EditUserTranslations = {
  (key: `validation.${"nameRequired" | "validEmailRequired" | "roleRequired"}`): string;
  (key: `roles.${"user" | "admin"}`): string;
};

const createFormSchema = (t: EditUserTranslations) =>
  z.object({
    name: z.string().min(1, { message: t("validation.nameRequired") }),
    email: z.string().email({ message: t("validation.validEmailRequired") }),
    role: z.string().min(1, { message: t("validation.roleRequired") }),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

type FormEditProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
  };
};

type Role = {
  value: string;
  label: string;
};

const getRoles = (t: EditUserTranslations): Role[] => [
  { value: "user", label: t("roles.user") },
  { value: "admin", label: t("roles.admin") },
];

export function EditUserForm({ user }: FormEditProps) {
  const router = useRouter();
  const t = useTranslations("adminUserEditForm");

  const form = useForm<FormValues>({
    // @ts-expect-error - The types are correct but there's a mismatch between the expected types
    resolver: zodResolver(createFormSchema(t as unknown as EditUserTranslations)) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role || "user",
    },
  });

  const onSubmit = async (formData: FormValues) => {
    try {
      await update(user.id, formData);
      toast.success(t("messages.updateSuccess"));
      router.push("/admin/users");
    } catch (error: unknown) {
      toast.error(t("messages.updateFailed"));
      console.error(error);
      return;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("formLabels.name")}</FormLabel>
              <FormControl>
                <Input {...field} data-testid="admin.users.edit.form.name" />
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
                <Input {...field} data-testid="admin.users.edit.form.email" />
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
                  <SelectTrigger className="w-full sm:w-1/2 lg:w-1/3" data-testid="admin.users.edit.form.role">
                    <SelectValue placeholder={t("formPlaceholders.selectRole")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getRoles(t as unknown as EditUserTranslations).map((role) => (
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
        <Button
          type="submit"
          className="cursor-pointer"
          data-testid="admin.users.edit.form.submit"
          disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("buttons.updating") : t("buttons.update")}
        </Button>
      </form>
    </Form>
  );
}
