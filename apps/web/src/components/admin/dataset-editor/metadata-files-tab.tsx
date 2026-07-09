"use client";

import { keepPreviousData as keepPreviousQueryData, useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@repo/ui/components/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { MetadataFileDeleteDialog } from "@/components/admin/dataset-editor/metadata-file-delete-dialog";
import { MetadataFileUploadForm } from "@/components/admin/dataset-editor/metadata-file-upload-form";
import { buildCollectionQueryInput } from "@/lib/collection-query";

type MetadataFilesTabProps = {
  datasetId: string;
};

type DatasetMetadataFile = {
  datasetId: string;
  description: string | null;
  fileHash: string;
  fileSize: number;
  fileType: string;
  id: string;
  metadataType: "documentation" | "other" | "questionnaire" | "variable_descriptions";
  name: string;
  organizationId: string;
  storageKey: string;
  uploadedAt: string;
  uploadedBy: string;
};

type MetadataFilesResponse = {
  count: number;
  limit: number;
  offset: number;
  orderBy?: Array<{ direction: "asc" | "desc"; field: string }>;
  rows: DatasetMetadataFile[];
};

const metadataTypeLabelKey = {
  documentation: "types.documentation",
  other: "types.other",
  questionnaire: "types.questionnaire",
  variable_descriptions: "types.variable_descriptions",
} as const;

export function MetadataFilesTab({ datasetId }: MetadataFilesTabProps) {
  const locale = useLocale();
  const t = useTranslations("adminDatasetEditor.metadata");
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale]
  );
  const input = useMemo(
    () =>
      buildCollectionQueryInput({
        input: {},
        pagination: { pageIndex: 0, pageSize: 100 },
        search: "",
        sorting: [],
      }),
    []
  );
  const { data, isError, isLoading, refetch } = useQuery({
    enabled: !!datasetId,
    placeholderData: keepPreviousQueryData,
    queryFn: async () => {
      const url = new URL(`/api/datasets/${datasetId}/metadata-files`, window.location.origin);

      for (const [key, value] of Object.entries(input)) {
        if (Array.isArray(value)) {
          value.forEach((item) => url.searchParams.append(key, item));
        } else if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }

      const response = await fetch(url.toString(), { credentials: "include" });
      if (!response.ok) {
        throw new Error(t("messages.fetchError"));
      }

      return (await response.json()) as MetadataFilesResponse;
    },
    queryKey: ["dataset-metadata-files", datasetId, input],
  });

  const handleUploaded = async () => {
    await refetch();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mt-6 text-base font-medium">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Card className="rounded-md shadow-xs">
          <CardHeader>
            <CardTitle>{t("upload.title")}</CardTitle>
            <CardDescription>{t("upload.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MetadataFileUploadForm datasetId={datasetId} onUploaded={handleUploaded} />
          </CardContent>
        </Card>

        <Card className="rounded-md shadow-xs">
          <CardHeader>
            <CardTitle>{t("files.title")}</CardTitle>
            <CardDescription>{t("files.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <p className="text-destructive text-sm">{t("messages.fetchError")}</p>
            ) : isLoading ? (
              <p className="text-muted-foreground text-sm">{t("files.loading")}</p>
            ) : data && data.rows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("files.columns.name")}</TableHead>
                    <TableHead>{t("files.columns.type")}</TableHead>
                    <TableHead>{t("files.columns.size")}</TableHead>
                    <TableHead>{t("files.columns.uploadedAt")}</TableHead>
                    <TableHead className="text-right">{t("files.columns.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((file) => (
                    <TableRow key={file.id} data-testid={`admin.dataset.metadata-file.row.${file.id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{file.name}</div>
                          {file.description ? (
                            <div className="text-muted-foreground text-xs">{file.description}</div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t(metadataTypeLabelKey[file.metadataType])}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                      <TableCell>{formatter.format(new Date(file.uploadedAt))}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            nativeButton={false}
                            render={
                              <a
                                href={`/api/datasets/${datasetId}/metadata-files/${file.id}`}
                                download
                                data-testid={`admin.dataset.metadata-file.download.${file.id}`}
                              />
                            }>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">{t("files.download")}</span>
                          </Button>
                          <MetadataFileDeleteDialog
                            datasetId={datasetId}
                            fileId={file.id}
                            fileName={file.name}
                            onDeleted={refetch}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="border px-6 py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>{t("files.emptyTitle")}</EmptyTitle>
                  <EmptyDescription>{t("files.emptyDescription")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
