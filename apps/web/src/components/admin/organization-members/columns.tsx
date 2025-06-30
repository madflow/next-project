"use client";

import { ColumnDef } from "@tanstack/react-table";
import { type Member } from "@/types/member";
import { type User } from "@/types/user";
import { removeMember } from "@/actions/member";
import { DataTableColumnHeader } from "@/components/datatable/components/column-header";
import { Badge } from "@/components/ui/badge";
import { RemoveMemberDialog } from "./remove-member-dialog";

export const columns: ColumnDef<{ users: User; members: Member }, unknown>[] = [
  {
    accessorKey: "users:name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organizationMembers.columns.name" />,
    cell: function Cell({ row }) {
      const value = row.original.users.name;
      return <span>{value}</span>;
    },
  },
  {
    accessorKey: "users:email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organizationMembers.columns.email" />,
    cell: function Cell({ row }) {
      const value = row.original.users.email;
      return <span>{value}</span>;
    },
  },
  {
    accessorKey: "members:role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="organizationMembers.columns.role" />,
    cell: function Cell({ row }) {
      const value = row.original.members.role;
      return <Badge variant={"outline"}>{value}</Badge>;
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const id = row.original.members.id;
      return (
        <div className="flex flex-row gap-2">
          <RemoveMemberDialog memberId={id} username={row.original.users.name} onRemove={removeMember} />
        </div>
      );
    },
  },
];
