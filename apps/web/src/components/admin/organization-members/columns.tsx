"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { RouterOutput } from "@repo/api/client";
import { Badge } from "@repo/ui/components/badge";
import { removeMember } from "@/actions/member";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import { RemoveMemberDialog } from "./remove-member-dialog";

type OrganizationMemberRow = RouterOutput["member"]["list"]["rows"][number];

export const columns: ColumnDef<OrganizationMemberRow, unknown>[] = [
  {
    id: "user:name",
    accessorFn: (row) => row.user?.name ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organizationMembers.columns.name" />,
    cell: function Cell({ row }) {
      const value = row.original.user?.name ?? "";
      return <span>{value}</span>;
    },
  },
  {
    id: "user:email",
    accessorFn: (row) => row.user?.email ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organizationMembers.columns.email" />,
    cell: function Cell({ row }) {
      const value = row.original.user?.email ?? "";
      return <span>{value}</span>;
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organizationMembers.columns.role" />,
    cell: function Cell({ row }) {
      const value = row.original.role;
      return <Badge variant={"outline"}>{value}</Badge>;
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const id = row.original.id;
      const username = row.original.user?.name ?? row.original.user?.email ?? "";

      return (
        <div className="flex flex-row gap-2">
          <RemoveMemberDialog memberId={id} username={username} onRemove={removeMember} />
        </div>
      );
    },
  },
];
