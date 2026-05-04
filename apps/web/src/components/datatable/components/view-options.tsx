"use client";

import { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const t = useTranslations();
  return (
    <DropdownMenu>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
          <Settings2 className="mr-2 h-4 w-4" />
          {t("datatable.viewOptions.view")}
        </Button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuContent align="end" className="w-37.5">
        <DropdownMenuLabel>{t("datatable.viewOptions.toggleColumns")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
