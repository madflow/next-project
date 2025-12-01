"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { remove } from "@/actions/organization";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import { Button } from "@/components/ui/button";
import { type Organization } from "@/types/organization";
import { DeleteOrganizationDialog } from "./delete-organization-dialog";

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organization.columns.name" />,
    cell: function Cell({ cell }) {
      const name = cell.getValue<string>();
      return (
        <Link
          href={`/admin/organizations/${cell.row.original.id}/members`}
          className="text-primary flex cursor-pointer items-center gap-1 hover:underline">
          {name}
          <Users className="h-3 w-3" />
        </Link>
      );
    },
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organization.columns.slug" />,
    cell: function Cell({ cell }) {
      const slug = cell.getValue<string>();
      return (
        <Link
          href={`/admin/organizations/${cell.row.original.id}/members`}
          className="text-primary cursor-pointer hover:underline"
          data-testid={`admin.organizations.list.link-${slug}`}>
          {slug}
        </Link>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organization.columns.createdAt" />,
    cell: function Cell({ cell }) {
      const date = cell.getValue<Date>();
      return <div>{new Date(date).toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const id = row.original.id;
      const slug = row.original.slug;
      const t = useTranslations();
      return (
        <div className="flex flex-row gap-2">
          <Button
            asChild
            variant={"outline"}
            title={t("organization.actions.edit")}
            role="button"
            className="cursor-pointer"
            data-testid={`admin.organizations.list.edit-${slug}`}>
            <Link href={`/admin/organizations/edit/${id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteOrganizationDialog organizationId={id} organizationName={row.original.name} onDelete={remove} />
        </div>
      );
    },
  },
];
