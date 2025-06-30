"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import type { User } from "@/types/user";
import { addMember } from "@/actions/member";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      role: "member",
    },
  });

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const url = new URL("/api/users", window.location.origin);
      url.searchParams.append("search", query);
      url.searchParams.append("limit", "10");
      url.searchParams.append("offset", "0");

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.rows || []);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error(t("errors.searchFailed"));
    } finally {
      setIsSearching(false);
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
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                        {field.value
                          ? searchResults.find((user) => user.id === field.value)?.name ||
                            searchResults.find((user) => user.id === field.value)?.email ||
                            t("user.selectUser")
                          : t("user.placeholder")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command
                      filter={(value, search) => {
                        if (search.trim() === "") return 1;
                        const user = searchResults.find((u) => u.id === value);
                        if (!user) return 0;
                        const searchLower = search.toLowerCase();
                        return user.name?.toLowerCase().includes(searchLower) ||
                          user.email?.toLowerCase().includes(searchLower)
                          ? 1
                          : 0;
                      }}>
                      <CommandInput placeholder={t("user.searchPlaceholder")} onValueChange={searchUsers} />
                      <CommandEmpty>{isSearching ? t("user.searching") : t("user.noResults")}</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {searchResults.map((user) => (
                            <CommandItem
                              value={user.id}
                              key={user.id}
                              onSelect={() => {
                                form.setValue("userId", user.id);
                              }}>
                              <div className="flex flex-col">
                                <span>{user.name || user.email}</span>
                                {user.email && user.name && (
                                  <span className="text-muted-foreground text-xs">{user.email}</span>
                                )}
                              </div>
                              <Check
                                className={cn("ml-auto h-4 w-4", user.id === field.value ? "opacity-100" : "opacity-0")}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
