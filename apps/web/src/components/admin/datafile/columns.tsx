"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Datafile } from "@repo/database/schema";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import { Button } from "@/components/ui/button";
import { formatDate, formatFileSize } from "@/lib/utils";
import { DeleteDatafileDialog } from "./delete-datafile-dialog";

export const columns: ColumnDef<Datafile>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatafile.columns.name" />,
    cell: function Cell({ row }) {
      return <span className="font-medium">{row.original.name}</span>;
    },
  },
  {
    accessorKey: "filename",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatafile.columns.filename" />,
  },
  {
    accessorKey: "fileType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatafile.columns.type" />,
    cell: ({ row }) => row.original.fileType.toUpperCase(),
  },
  {
    accessorKey: "fileSize",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatafile.columns.size" />,
    cell: ({ row }) => formatFileSize(row.original.fileSize),
  },
  {
    accessorKey: "fileHash",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatafile.columns.hash" />,
    cell: function Cell({ row }) {
      const hash = row.original.fileHash;
      const shortHash = hash ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}` : "";

      return (
        <div className="flex items-center">
          <span className="bg-muted rounded px-2 py-1 font-mono text-xs">{shortHash}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatafile.columns.uploaded" />,
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const t = useTranslations("adminDatafile");
      const datafile = row.original;

      const handleDelete = async (id: string) => {
        try {
          const response = await fetch(`/api/datafiles?id=${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete datafile");
          }

          // Refresh the page to update the table
          window.location.reload();
        } catch (error) {
          console.error("Error deleting datafile:", error);
          toast.error(t("deleteDialog.error"));
        }
      };

      return (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="icon" asChild title={t("tableActions.download")}>
            <a href={`/api/datafiles/${datafile.id}/download`} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              <span className="sr-only">{t("tableActions.download")}</span>
            </a>
          </Button>
          <DeleteDatafileDialog datafileId={datafile.id} datafileName={datafile.name} onDelete={handleDelete} />
        </div>
      );
    },
  },
];
