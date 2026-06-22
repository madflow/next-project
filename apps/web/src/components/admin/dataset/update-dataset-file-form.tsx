"use client";

import { AlertTriangle, Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { confirmDatasetFileUpdateWithFormData, previewDatasetFileUpdateWithFormData } from "@/actions/dataset";
import { TextArrayEditor } from "@/components/form/text-array-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
} from "@/components/ui/file-upload";
import type { DatasetFileUpdatePreview, DatasetFileUpdateVariableSummary } from "@/lib/dataset-service";
import { formatFileSize } from "@/lib/utils";
import type { Dataset } from "@/types/dataset";

type UpdateDatasetFileFormProps = {
  dataset: Dataset;
};

function VariableList({
  emptyLabel,
  variables,
}: {
  emptyLabel: string;
  variables: DatasetFileUpdateVariableSummary[];
}) {
  if (variables.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <div className="max-h-64 overflow-auto rounded-md border">
      <ul className="divide-y">
        {variables.map((variable) => (
          <li
            key={variable.name}
            className="flex flex-col gap-1 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium">{variable.name}</span>
            {variable.label ? <span className="text-muted-foreground">{variable.label}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UpdateDatasetFileForm({ dataset }: UpdateDatasetFileFormProps) {
  const router = useRouter();
  const t = useTranslations("adminDatasetUpdateFile");
  const [files, setFiles] = useState<File[]>([]);
  const [missingValues, setMissingValues] = useState<string[]>(["-999", "-998"]);
  const [preview, setPreview] = useState<DatasetFileUpdatePreview | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const selectedFile = files[0] ?? null;

  const buildFormData = () => {
    if (!selectedFile) {
      return null;
    }

    const formData = new FormData();
    formData.append("datasetId", dataset.id);
    formData.append("file", selectedFile);
    formData.append("contentType", "application/octet-stream");
    formData.append("missingValues", JSON.stringify(missingValues));
    return formData;
  };

  const handlePreview = async () => {
    const formData = buildFormData();
    if (!formData) {
      setFileError(t("validation.file.required"));
      return;
    }

    setFileError(null);
    setIsPreviewing(true);

    try {
      const result = await previewDatasetFileUpdateWithFormData(formData);
      if (!result.success || !result.preview) {
        toast.error(result.error || t("messages.previewError"));
        return;
      }

      setPreview(result.preview);
      toast.success(t("messages.previewSuccess"));
    } catch (error) {
      console.error("Preview dataset update error:", error);
      toast.error(t("messages.previewError"));
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    const formData = buildFormData();
    if (!formData) {
      setFileError(t("validation.file.required"));
      return;
    }

    setIsConfirming(true);

    try {
      const result = await confirmDatasetFileUpdateWithFormData(formData);
      if (!result.success) {
        toast.error(result.error || t("messages.confirmError"));
        return;
      }

      toast.success(t("messages.confirmSuccess"));
      router.push(`/admin/datasets/${dataset.id}/editor`);
      router.refresh();
    } catch (error) {
      console.error("Confirm dataset update error:", error);
      toast.error(t("messages.confirmError"));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>{t("currentFile.title")}</CardTitle>
          <CardDescription>{t("currentFile.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("currentFile.filename")}</dt>
              <dd className="font-medium">{dataset.filename}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("currentFile.size")}</dt>
              <dd className="font-medium">{formatFileSize(dataset.fileSize)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>{t("replacement.title")}</CardTitle>
          <CardDescription>{t("replacement.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field data-invalid={Boolean(fileError)}>
            <FieldLabel>{t("replacement.fileLabel")}</FieldLabel>
            <FieldGroup>
              <FileUpload
                data-testid="app.admin.dataset.update-file.input"
                maxFiles={1}
                maxSize={100 * 1024 * 1024}
                accept=".sav"
                className="w-full"
                value={files}
                onValueChange={(value) => {
                  setFiles(value);
                  setPreview(null);
                  setFileError(null);
                }}
                onFileReject={(_, message) => {
                  setFileError(message);
                  setPreview(null);
                }}
                multiple={false}>
                <FileUploadDropzone>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="flex items-center justify-center rounded-full border p-2.5">
                      <Upload className="text-muted-foreground size-6" />
                    </div>
                    <p className="text-muted-foreground mb-2 text-sm">
                      <span className="font-semibold">{t("replacement.clickToUpload")}</span>{" "}
                      {t("replacement.orDragAndDrop")}
                    </p>
                    <p className="text-muted-foreground text-xs">{t("replacement.supportedFormats")}</p>
                  </div>
                </FileUploadDropzone>
                <FileUploadList>
                  {files.map((file, index) => (
                    <FileUploadItem key={index} value={file} data-testid="app.admin.dataset.update-file.selected-file">
                      <FileUploadItemPreview />
                      <FileUploadItemMetadata />
                      <FileUploadItemDelete asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <X />
                        </Button>
                      </FileUploadItemDelete>
                    </FileUploadItem>
                  ))}
                </FileUploadList>
              </FileUpload>
            </FieldGroup>
            {fileError ? <FieldError>{fileError}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel>{t("replacement.missingValues")}</FieldLabel>
            <FieldGroup>
              <TextArrayEditor value={missingValues} onChange={setMissingValues} />
            </FieldGroup>
            <p className="text-muted-foreground text-sm">{t("replacement.missingValuesHelp")}</p>
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPreviewing || isConfirming}>
              {t("buttons.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handlePreview}
              disabled={!selectedFile || isPreviewing || isConfirming}
              data-testid="app.admin.dataset.update-file.preview">
              {isPreviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPreviewing ? t("buttons.previewing") : t("buttons.preview")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview ? (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>{t("preview.title")}</CardTitle>
            <CardDescription>{t("preview.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">{t("preview.newFilename")}</dt>
                <dd className="font-medium">{preview.file.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("preview.newSize")}</dt>
                <dd className="font-medium">{formatFileSize(preview.file.size)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("preview.variableCount")}</dt>
                <dd className="font-medium">{preview.file.variableCount}</dd>
              </div>
            </div>

            {preview.deletedVariables.length > 0 ? (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertTitle>{t("preview.deleteWarningTitle")}</AlertTitle>
                <AlertDescription>{t("preview.deleteWarningDescription")}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="space-y-3">
                <h3 className="font-semibold">
                  {t("preview.deletedVariables", { count: preview.deletedVariables.length })}
                </h3>
                <VariableList emptyLabel={t("preview.noDeletedVariables")} variables={preview.deletedVariables} />
              </section>
              <section className="space-y-3">
                <h3 className="font-semibold">
                  {t("preview.addedVariables", { count: preview.addedVariables.length })}
                </h3>
                <VariableList emptyLabel={t("preview.noAddedVariables")} variables={preview.addedVariables} />
              </section>
            </div>

            <section className="space-y-3">
              <h3 className="font-semibold">
                {t("preview.unchangedVariables", { count: preview.unchangedVariables.length })}
              </h3>
              <p className="text-muted-foreground text-sm">{t("preview.preservedFields")}</p>
            </section>

            <div className="flex flex-wrap gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => setPreview(null)} disabled={isConfirming}>
                {t("buttons.changeFile")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={isConfirming}
                data-testid="app.admin.dataset.update-file.confirm">
                {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isConfirming ? t("buttons.confirming") : t("buttons.confirm")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
