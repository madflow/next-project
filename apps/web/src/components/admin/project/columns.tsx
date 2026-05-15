"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { remove } from "@/actions/project";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import { Button } from "@/components/ui/button";
import type { ProjectWithOrganization } from "@/types/project";
import { DeleteProjectDialog } from "./delete-project-dialog";

export const columns: ColumnDef<ProjectWithOrganization>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="project.columns.name" />,
    cell: function Cell({ row }) {
      return row.original.name;
    },
  },
  {
    accessorKey: "organization:name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organization.columns.name" />,
    cell: function Cell({ row }) {
      return row.original.organization?.name;
    },
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="project.columns.slug" />,
    cell: function Cell({ row }) {
      return row.original.slug;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="project.columns.createdAt" />,
    cell: function Cell({ row }) {
      const date = row.original.createdAt;
      return <div>{new Date(date).toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const project = row.original;
      const t = useTranslations();

      return (
        <div className="flex flex-row gap-2">
          <Button
            asChild
            variant="outline"
            title={t("project.actions.edit")}
            role="button"
            className="cursor-pointer"
            data-testid={`admin.projects.list.edit-${project.slug}`}>
            <Link href={`/admin/projects/edit/${project.id}`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{t("project.actions.edit")}</span>
            </Link>
          </Button>
          <DeleteProjectDialog projectId={project.id} projectName={project.name} onDelete={remove} />
        </div>
      );
    },
  },
];
