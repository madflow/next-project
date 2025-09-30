"use client";

import { Download, Upload, CheckCircle, XCircle, EllipsisVertical } from "lucide-react";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import type { VariableSetImportResult, VariableSetImportOptions } from "@/types/dataset-variableset-export";

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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <EllipsisVertical className="h-4 w-4" />
            <span className="sr-only">{"Open menu"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? t("exporting") : t("export")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {t("import")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={importOpen} onOpenChange={handleImportDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("importDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("importDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!importResult && (
              <>
                <div>
                  <Label htmlFor="file-upload">{t("importDialog.selectFile")}</Label>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <Label htmlFor="conflict-resolution">{t("importDialog.conflictResolution")}</Label>
                  <Select value={conflictResolution} onValueChange={(value: VariableSetImportOptions["conflictResolution"]) => setConflictResolution(value)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">{t("importDialog.conflictOptions.skip")}</SelectItem>
                      <SelectItem value="overwrite">{t("importDialog.conflictOptions.overwrite")}</SelectItem>
                      <SelectItem value="rename">{t("importDialog.conflictOptions.rename")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setImportOpen(false)}>
                    {t("importDialog.cancel")}
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || isImporting}
                    className="flex items-center gap-2"
                  >
                    {isImporting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {t("import")}
                  </Button>
                </div>
              </>
            )}

            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>{t("importDialog.importing")}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "100%" }}></div>
                </div>
              </div>
            )}

            {importResult && (
              <div className="space-y-4">
                <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {importResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      {importResult.success ? t("importDialog.importCompleted") : t("importDialog.importFailed")}
                    </span>
                  </div>
                </Alert>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{t("importDialog.summary.totalSets")}</span> {importResult.summary.totalSets}
                  </div>
                  <div>
                    <span className="font-medium text-green-600">{t("importDialog.summary.created")}</span> {importResult.summary.createdSets}
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">{t("importDialog.summary.updated")}</span> {importResult.summary.updatedSets}
                  </div>
                  <div>
                    <span className="font-medium text-yellow-600">{t("importDialog.summary.skipped")}</span> {importResult.summary.skippedSets}
                  </div>
                  <div>
                    <span className="font-medium text-red-600">{t("importDialog.summary.failed")}</span> {importResult.summary.failedSets}
                  </div>
                </div>

                {importResult.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-600 mb-2">{t("importDialog.warnings")}</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                      {importResult.warnings.map((warning, index) => (
                        <li key={index} className="text-yellow-700">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">{t("importDialog.errors")}</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                      {importResult.errors.map((error, index) => (
                        <li key={index} className="text-red-700">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetImport}>
                    {t("importDialog.importAnother")}
                  </Button>
                  <Button onClick={() => setImportOpen(false)}>
                    {t("importDialog.close")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}