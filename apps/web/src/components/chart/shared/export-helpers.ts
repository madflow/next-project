import { buildExportMetaLine, getComputedExportPalette } from "@/lib/adhoc-export";
import { type ThemeChartColors } from "@/types/organization";

type CreateChartExportMetaLineParams = {
  datasetId?: string;
  datasetName?: string;
  exportedAt: Date;
  locale: string;
  splitLabel?: string | null;
  labels: {
    dataset: string;
    exported: string;
    split: string;
  };
};

export function createChartExportMetaLine({
  datasetId,
  datasetName,
  exportedAt,
  locale,
  splitLabel,
  labels,
}: CreateChartExportMetaLineParams) {
  return buildExportMetaLine({
    datasetName: datasetName || datasetId || "",
    exportedAtLabel: new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(exportedAt),
    labels,
    splitLabel,
  });
}

export function resolveChartExportPalette(
  displayElement: HTMLDivElement | null,
  exportElement: HTMLDivElement | null,
  fallbackChartColors: ThemeChartColors
) {
  return getComputedExportPalette(displayElement ?? exportElement, fallbackChartColors);
}
