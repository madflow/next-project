import { Row, flexRender } from "@tanstack/react-table";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

interface TableBodyProps<TData> {
  rows: Row<TData>[];
  columnsLength: number;
}

export function TableBodyComponent<TData>({ rows, columnsLength }: TableBodyProps<TData>) {
  return (
    <TableBody>
      {rows.length ? (
        rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() && "selected"}
            className="hover:bg-muted/50 transition-colors">
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columnsLength} className="h-24 text-center"></TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}
