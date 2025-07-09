"use client";

import { ColumnDef } from "@tanstack/react-table";
import { remove } from "@/actions/dataset-variable";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import type { DatasetVariable } from "@/types/dataset-variable";
import { DeleteDatasetVariableDialog } from "./delete-dataset-variable-dialog";

export const columns: ColumnDef<DatasetVariable>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatasetEditor.columns.name" />,
    cell: function Cell({ row }) {
      return <span className="font-medium">{row.original.name}</span>;
    },
  },
  {
    accessorKey: "label",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatasetEditor.columns.label" />,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatasetEditor.columns.type" />,
  },
  {
    accessorKey: "measure",
    header: ({ column }) => <DataTableColumnHeader column={column} title="adminDatasetEditor.columns.measure" />,
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const datasetVariable = row.original;

      return (
        <div className="flex justify-end gap-2">
          <DeleteDatasetVariableDialog
            datasetVariableId={datasetVariable.id}
            datasetVariableName={datasetVariable.name}
            onDelete={remove}
          />
        </div>
      );
    },
  },
];
