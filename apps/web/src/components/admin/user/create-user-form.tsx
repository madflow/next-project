"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { create } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createFormSchema = (t: any) =>
  z.object({
    name: z.string().min(1, {
      error: t("user.form.errors.required"),
    }),
    email: z.email({
      error: t("user.form.errors.email"),
    }),
    role: z.enum(["user", "admin"]).default("user"),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export function CreateUserForm() {
  const router = useRouter();
  const t = useTranslations();

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t)) as unknown as Resolver<FormValues>,
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
      toast.success(t("user.form.success.created"));
      router.push("/admin/users");
    } catch (error: unknown) {
      toast.error(t("user.form.error"));
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
                <FormLabel>{t("user.form.name")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("user.form.name")} data-testid="admin.users.new.form.name" />
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
                <FormLabel>{t("user.form.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    placeholder={t("user.form.email")}
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
                <FormLabel>{t("user.form.role")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-1/2 lg:w-1/3" data-testid="admin.users.new.form.role">
                      <SelectValue placeholder={t("user.form.role")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-start">
          <Button
            type="submit"
            className="cursor-pointer"
            data-testid="admin.users.new.form.submit"
            disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : t("user.createButton")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
