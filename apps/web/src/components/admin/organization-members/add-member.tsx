"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { addMember } from "@/actions/member";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectAsync } from "@/components/ui/select-async";
import type { User } from "@/types/user";

const formSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(["admin", "owner", "member"]),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMemberFormProps {
  organizationId: string;
}

export function AddMemberForm({ organizationId }: AddMemberFormProps) {
  const t = useTranslations("organizationMembers.add.form");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      role: "member",
    },
  });

  const searchUsers = async (query: string): Promise<{ rows: User[] }> => {
    if (!query.trim()) {
      return { rows: [] };
    }

    try {
      const url = new URL("/api/users", window.location.origin);
      url.searchParams.append("search", query);
      url.searchParams.append("limit", "10");
      url.searchParams.append("offset", "0");

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        return data.rows ? { rows: data.rows } : { rows: [] };
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error(t("errors.searchFailed"));
      return { rows: [] };
    }
  };

  const onSubmit = async (values: FormValues) => {
    startTransition(async () => {
      try {
        await addMember(organizationId, values);

        toast.success(t("success.title"), {
          description: t("success.description"),
        });

        router.push(`/admin/organizations/${organizationId}/members`);
        router.refresh();
      } catch (error) {
        console.error("Error adding member:", error);
        toast.error(error instanceof Error ? error.message : t("errors.submitFailed"));
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("user.label")}</FormLabel>
                <FormControl>
                  <SelectAsync<User, { rows: User[] }>
                    fetcher={searchUsers}
                    onValueChange={field.onChange}
                    value={field.value}
                    placeholder={t("user.placeholder")}
                    itemToValue={(user) => user.id}
                    itemToLabel={(user) => user.name || user.email || ""}
                    responseToItems={(data) => data.rows}
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
                <FormLabel>{t("role.label")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch("userId")}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("role.placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">{t("role.options.admin")}</SelectItem>
                    <SelectItem value="owner">{t("role.options.owner")}</SelectItem>
                    <SelectItem value="member">{t("role.options.member")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-start gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
              className="cursor-pointer">
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="cursor-pointer">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("actions.submit")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
