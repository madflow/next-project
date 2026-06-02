"use client";

import { DownloadIcon, FileImageIcon, PresentationIcon, SheetIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChartExportMenuProps = {
  disabled?: boolean;
  onExportImageAction: () => void | Promise<void>;
  onExportExcelAction: () => void | Promise<void>;
  onExportPowerPointAction: () => void | Promise<void>;
};

export function ChartExportMenu({
  disabled = false,
  onExportImageAction: onExportImage,
  onExportExcelAction: onExportExcel,
  onExportPowerPointAction: onExportPowerPoint,
}: ChartExportMenuProps) {
  const t = useTranslations("projectAdhocAnalysis.export");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="cursor-pointer"
          variant="outline"
          size="icon-sm"
          disabled={disabled}
          data-testid="chart-export-trigger"
          aria-label={t("buttonLabel")}
          title={t("buttonLabel")}>
          <DownloadIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem data-testid="chart-export-image" onClick={() => void onExportImage()} disabled={disabled}>
          <FileImageIcon className="h-4 w-4" />
          {t("image")}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="chart-export-excel" onClick={() => void onExportExcel()} disabled={disabled}>
          <SheetIcon className="h-4 w-4" />
          {t("excel")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="chart-export-powerpoint"
          onClick={() => void onExportPowerPoint()}
          disabled={disabled}>
          <PresentationIcon className="h-4 w-4" />
          {t("powerpoint")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
