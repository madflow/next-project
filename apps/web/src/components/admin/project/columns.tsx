"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { type Project } from "@repo/database/schema";
import { remove } from "@/actions/project";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import { Button } from "@/components/ui/button";
import { DeleteProjectDialog } from "./delete-project-dialog";

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="project.columns.name" />,
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="project.columns.slug" />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="project.columns.createdAt" />,
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
            variant="outline"
            title={t("project.actions.edit")}
            role="button"
            className="cursor-pointer"
            data-testid={`admin.projects.list.edit-${slug}`}>
            <Link href={`/admin/projects/edit/${id}`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{t("project.actions.edit")}</span>
            </Link>
          </Button>
          <DeleteProjectDialog projectId={id} projectName={row.original.name} onDelete={remove} />
        </div>
      );
    },
  },
];
