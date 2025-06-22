"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Locale, locales } from "@/i18n/config";
import { updateUser, useSession } from "@/lib/auth-client";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";

const nameFormSchema = z.object({
  name: z.string().min(2, {
    error: "Name must be at least 2 characters.",
  }),
  locale: z.enum(locales).optional(),
});

type ProfileFormValues = z.infer<typeof nameFormSchema>;

export function UpdateProfileForm() {
  const t = useTranslations();
  const { data: session } = useSession();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: {
      name: "",
      locale: session?.user?.locale as Locale,
    },
  });

  // Update form default values when session is available
  useEffect(() => {
    if (session) {
      const values: ProfileFormValues = {
        name: session.user.name,
      };
      if (session.user.locale) {
        values.locale = session.user.locale as Locale;
      }
      form.reset(values);
    }
  }, [session, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (data.name !== session?.user?.name || data.locale !== session?.user?.locale) {
      await updateUser({
        name: data.name,
        locale: data.locale,
        fetchOptions: {
          onError: () => {
            toast.error(t("account.profile.error"));
          },
          onSuccess: () => {
            toast.success(t("account.profile.success"));
            router.refresh();
          },
        },
      });
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
                <FormLabel>{t("account.profile.fields.name")}</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="app.user.account.profile.name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="locale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("account.profile.fields.locale")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="app.user.account.profile.locale">
                      <SelectValue placeholder={t("localeSwitcher.selectLanguage")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t("localeSwitcher.locale")}</SelectLabel>
                      <SelectItem value="en">{t("localeSwitcher.languages.en")}</SelectItem>
                      <SelectItem value="de">{t("localeSwitcher.languages.de")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="cursor-pointer" data-testid="app.user.account.profile.update">
          {t("account.profile.fields.updateProfile")}
        </Button>
      </form>
    </Form>
  );
}
