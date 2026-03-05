"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { fetchVariableRawData } from "@/dal/dataset-raw-data";
import { type DatasetVariableWithAttributes } from "@/types/dataset-variable";

const PAGE_SIZE = 5;

type TextExplorerAdhocProps = {
  variable: DatasetVariableWithAttributes;
  datasetId?: string;
};

function buildPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

export function TextExplorerAdhoc({ variable, datasetId }: TextExplorerAdhocProps) {
  const t = useTranslations("projectAdhocAnalysis.textExplorer");
  const variableKey = `${datasetId}:${variable.name}`;
  const [pageByKey, setPageByKey] = useState<Record<string, number>>({});
  const page = pageByKey[variableKey] ?? 1;
  const setPage = (p: number) => setPageByKey((prev) => ({ ...prev, [variableKey]: p }));

  const { data, isLoading, isError } = useQuery({
    queryKey: ["text-explorer", datasetId, variable.name, page],
    queryFn: () => fetchVariableRawData(datasetId!, [variable.name], { page, pageSize: PAGE_SIZE }),
    enabled: !!datasetId,
  });

  const variableData = data?.data[variable.name];
  const values = variableData?.values ?? [];
  const totalNonEmptyCount = variableData?.total_non_empty_count ?? 0;
  const totalPages = variableData?.total_pages ?? 1;
  const currentPage = variableData?.page ?? page;

  if (!datasetId) {
    return null;
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  }

  if (isError || variableData?.error) {
    return <p className="text-destructive text-sm">{t("error")}</p>;
  }

  if (values.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("empty")}</p>;
  }

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <div className="space-y-3">
      <ul className="overflow-hidden rounded-md">
        {values.map((value, index) => (
          <li key={index} className={`border-b px-3 py-2 text-sm ${index % 2 === 0 ? "bg-muted/50" : "bg-background"}`}>
            {value}
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <Pagination className="flex-1 justify-start">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setPage(currentPage - 1);
                }}
                aria-disabled={currentPage <= 1}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {pageNumbers.map((item, i) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(item);
                    }}>
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setPage(currentPage + 1);
                }}
                aria-disabled={currentPage >= totalPages}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p className="text-muted-foreground shrink-0 text-xs">{t("count", { total: totalNonEmptyCount })}</p>
      </div>
    </div>
  );
}
