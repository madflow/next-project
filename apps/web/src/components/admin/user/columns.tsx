"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { remove } from "@/actions/user";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import { Button } from "@/components/ui/button";
import { type AuthUser } from "@/types/user";
import { DeleteUserDialog } from "./delete-user-dialog";

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
      const role = row.original.role || "user";
      // @ts-expect-error Type 'string' is not assignable to type 'never'.
      return <div>{t(`role.${role}`, { fallback: role })}</div>;
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
