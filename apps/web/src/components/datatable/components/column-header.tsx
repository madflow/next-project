import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const t = useTranslations();
  const isSorted = column.getIsSorted();
  let tooltipText = t("datatable.sortAscending");
  if (isSorted === "asc") tooltipText = t("datatable.sortDescending");
  else if (isSorted === "desc") tooltipText = t("datatable.clearSorting");

  function handleSortClick(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!isSorted) {
      column.toggleSorting(false); // asc
    } else if (isSorted === "asc") {
      column.toggleSorting(true); // desc
    } else {
      column.clearSorting(); // unsorted
    }
  }

  // @ts-expect-error Dynamic translation hack
  const translatedTitle = t(title as string);

  return (
    <div className={cn("flex items-center space-x-2 select-none", className)}>
      <span>{translatedTitle}</span>
      <Tooltip>
        <TooltipTrigger
          tabIndex={0}
          aria-label={tooltipText}
          onClick={handleSortClick}
          className="cursor-pointer focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleSortClick(e);
          }}>
          {isSorted === "asc" ? (
            <ArrowUp className="size-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="size-4" />
          ) : (
            <ChevronsUpDown className="size-4 opacity-50" />
          )}
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          className="text-muted-foreground bg-background border-border border">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
