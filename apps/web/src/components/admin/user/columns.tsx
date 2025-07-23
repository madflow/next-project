"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { remove } from "@/actions/user";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type AuthUser } from "@/types/user";
import { DeleteUserDialog } from "./delete-user-dialog";
import { InfoUserModal } from "./info-user-modal";

export const columns: ColumnDef<AuthUser>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="user.columns.name" />,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="user.columns.email" />,
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="user.columns.role" />,
    cell: function Cell({ row }) {
      const t = useTranslations("user");
      const role = (row.original.role as string) || "user";
      const translationKey = `role.${role}` as const;
      const badgeVariant = role === "user" ? "secondary" : "default";
      // @ts-expect-error Dynamic translation hack
      return <Badge variant={badgeVariant}>{t(translationKey, { fallback: role })}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="user.columns.createdAt" />,
    cell: function Cell({ cell }) {
      const date = cell.getValue<Date>();
      return <div>{new Date(date).toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const t = useTranslations("user");
      const id = row.original.id;
      const email = row.original.email;

      return (
        <div className="flex flex-row gap-2">
          <InfoUserModal user={row.original} />
          <Button
            asChild
            variant="outline"
            title={t("actions.edit")}
            role="button"
            className="cursor-pointer"
            data-testid={`admin.users.list.edit-${email}`}>
            <Link href={`/admin/users/edit/${id}`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{t("actions.edit")}</span>
            </Link>
          </Button>
          <DeleteUserDialog userId={id} userName={row.original.name || row.original.email} onDelete={remove} />
        </div>
      );
    },
  },
];
