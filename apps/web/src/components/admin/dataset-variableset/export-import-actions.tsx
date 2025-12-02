"use client";

import { Check, Download, EllipsisVertical, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { VariableSetImportOptions, VariableSetImportResult } from "@/types/dataset-variableset-export";

interface ExportImportActionsProps {
  datasetId: string;
  onImportSuccess?: () => void;
}

export function ExportImportActions({ datasetId, onImportSuccess }: ExportImportActionsProps) {
  const t = useTranslations("adminDatasetVariableset.exportImport");
  const [importOpen, setImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<VariableSetImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conflictResolution, setConflictResolution] = useState<VariableSetImportOptions["conflictResolution"]>("skip");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/datasets/${datasetId}/variablesets/export`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? `variablesets-${Date.now()}.json`;

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("options", JSON.stringify({ conflictResolution }));

      const response = await fetch(`/api/datasets/${datasetId}/variablesets/import`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      setImportResult(result);

      if (result.success && onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({
        success: false,
        summary: { totalSets: 0, createdSets: 0, skippedSets: 0, updatedSets: 0, failedSets: 0 },
        errors: [error instanceof Error ? error.message : "Import failed"],
        warnings: [],
        details: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    setConflictResolution("skip");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportDialogClose = (open: boolean) => {
    setImportOpen(open);
    if (!open) {
      resetImport();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <EllipsisVertical className="h-4 w-4" />
            <span className="sr-only">{"Open menu"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport} disabled={isExporting} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {isExporting ? t("exporting") : t("export")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setImportOpen(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t("import")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={importOpen} onOpenChange={handleImportDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("importDialog.title")}</DialogTitle>
            <DialogDescription>{t("importDialog.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!importResult && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="file-upload">{t("importDialog.selectFile")}</Label>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="border-input bg-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conflict-resolution">{t("importDialog.conflictResolution")}</Label>
                  <Select
                    value={conflictResolution}
                    onValueChange={(value: VariableSetImportOptions["conflictResolution"]) =>
                      setConflictResolution(value)
                    }>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">{t("importDialog.conflictOptions.skip")}</SelectItem>
                      <SelectItem value="overwrite">{t("importDialog.conflictOptions.overwrite")}</SelectItem>
                      <SelectItem value="rename">{t("importDialog.conflictOptions.rename")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="gap-2 pt-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setImportOpen(false)}>
                    {t("importDialog.cancel")}
                  </Button>
                  <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
                    {isImporting && (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                    {t("import")}
                  </Button>
                </DialogFooter>
              </>
            )}

            {isImporting && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  <span className="text-muted-foreground text-sm">{t("importDialog.importing")}</span>
                </div>
              </div>
            )}

            {importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      importResult.success ? "bg-primary/10" : "bg-destructive/10"
                    }`}>
                    {importResult.success ? (
                      <Check className="text-primary h-4 w-4" />
                    ) : (
                      <X className="text-destructive h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {importResult.success ? t("importDialog.importCompleted") : t("importDialog.importFailed")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("importDialog.summary.totalSets")}
                      {": "}
                      {importResult.summary.totalSets}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("importDialog.summary.created")}</span>
                    <span className="font-medium">{importResult.summary.createdSets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("importDialog.summary.updated")}</span>
                    <span className="font-medium">{importResult.summary.updatedSets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("importDialog.summary.skipped")}</span>
                    <span className="font-medium">{importResult.summary.skippedSets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("importDialog.summary.failed")}</span>
                    <span className="font-medium">{importResult.summary.failedSets}</span>
                  </div>
                </div>

                {importResult.warnings.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        {t("importDialog.warnings")}
                      </p>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        {importResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {importResult.errors.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-destructive mb-2 text-xs font-medium tracking-wide uppercase">
                        {t("importDialog.errors")}
                      </p>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <DialogFooter className="gap-2 pt-2 sm:gap-0">
                  <Button variant="outline" onClick={resetImport}>
                    {t("importDialog.importAnother")}
                  </Button>
                  <Button onClick={() => setImportOpen(false)}>{t("importDialog.close")}</Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
