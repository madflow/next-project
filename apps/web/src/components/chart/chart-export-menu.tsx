"use client";

import { DownloadIcon, FileImageIcon, PresentationIcon } from "lucide-react";
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
  onExportImage: () => void | Promise<void>;
  onExportPowerPoint: () => void | Promise<void>;
};

export function ChartExportMenu({ disabled = false, onExportImage, onExportPowerPoint }: ChartExportMenuProps) {
  const t = useTranslations("projectAdhocAnalysis.export");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="cursor-pointer"
          variant="outline"
          size="icon-sm"
          disabled={disabled}
          aria-label={t("buttonLabel")}
          title={t("buttonLabel")}>
          <DownloadIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void onExportImage()} disabled={disabled}>
          <FileImageIcon className="h-4 w-4" />
          {t("image")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void onExportPowerPoint()} disabled={disabled}>
          <PresentationIcon className="h-4 w-4" />
          {t("powerpoint")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
