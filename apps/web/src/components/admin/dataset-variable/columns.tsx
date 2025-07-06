"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import type { DatasetVariable } from "@/types/dataset-variable";

export const columns: ColumnDef<DatasetVariable>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatasetVariable.columns.name" />,
    cell: function Cell({ row }) {
      return <span className="font-medium">{row.original.name}</span>;
    },
  },
  {
    accessorKey: "label",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatasetVariable.columns.label" />,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatasetVariable.columns.type" />,
  },
  {
    accessorKey: "measure",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatasetVariable.columns.measure" />,
  },
];
