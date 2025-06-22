import { Row, flexRender } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

interface TableBodyProps<TData> {
  rows: Row<TData>[];
  columnsLength: number;
}

export function TableBodyComponent<TData>({ rows, columnsLength }: TableBodyProps<TData>) {
  const t = useTranslations();
  return (
    <TableBody>
      {rows.length ? (
        rows.map((row) => (
          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columnsLength} className="h-24 text-center">
            {t("datatable.noResults")}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}
