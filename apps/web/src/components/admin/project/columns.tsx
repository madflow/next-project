"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { type Organization, type Project } from "@repo/database/schema";
import { remove } from "@/actions/project";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import { Button } from "@/components/ui/button";
import { DeleteProjectDialog } from "./delete-project-dialog";

interface ProjectWithOrganization {
  projects: Project;
  organizations: Organization;
}

export const columns: ColumnDef<ProjectWithOrganization>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="project.columns.name" />,
    cell: function Cell({ row }) {
      return row.original.projects.name;
    },
  },
  {
    accessorKey: "organizations:name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organization.columns.name" />,
    cell: function Cell({ row }) {
      return row.original.organizations?.name;
    },
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="project.columns.slug" />,
    cell: function Cell({ row }) {
      return row.original.projects.slug;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="project.columns.createdAt" />,
    cell: function Cell({ row }) {
      const date = row.original.projects.createdAt;
      return <div>{new Date(date).toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const id = row.original.projects.id;
      const slug = row.original.projects.slug;
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
          <DeleteProjectDialog projectId={id} projectName={row.original.projects.name} onDelete={remove} />
        </div>
      );
    },
  },
];
