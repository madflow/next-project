"use client";

import { Download, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { DatasetMetadataFile } from "@repo/database/schema";
import { removeDatasetMetadataFile } from "@/actions/dataset-metadata";
import { MetadataFileDeleteDialog } from "@/components/admin/dataset-editor/metadata-file-delete-dialog";
import { MetadataFileUploadForm } from "@/components/admin/dataset-editor/metadata-file-upload-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApiResponsePayload } from "@/hooks/use-api";
import { useQueryApi } from "@/hooks/use-query-api";

type MetadataFilesTabProps = {
  datasetId: string;
};

type MetadataFilesResponse = ApiResponsePayload<DatasetMetadataFile>;

const formatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function MetadataFilesTab({ datasetId }: MetadataFilesTabProps) {
  const t = useTranslations("adminDatasetEditor.metadata");
  const { data, isError, isLoading, refetch } = useQueryApi<MetadataFilesResponse>({
    endpoint: `/api/datasets/${datasetId}/metadata-files`,
    pagination: { pageIndex: 0, pageSize: 100 },
    sorting: [],
    search: "",
    queryKey: ["dataset-metadata-files", datasetId],
  });

  const handleDelete = async (fileId: string) => {
    const result = await removeDatasetMetadataFile(datasetId, fileId);
    if (!result.success) {
      throw new Error(result.error || t("messages.deleteError"));
    }

    toast.success(t("messages.deleteSuccess"));
    await refetch();
  };

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
                        <Badge variant="secondary">{t(`types.${file.metadataType}`)}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                      <TableCell>{formatter.format(new Date(file.uploadedAt))}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="icon" type="button">
                            <a
                              href={`/api/datasets/${datasetId}/metadata-files/${file.id}`}
                              download
                              data-testid={`admin.dataset.metadata-file.download.${file.id}`}>
                              <Download className="h-4 w-4" />
                              <span className="sr-only">{t("files.download")}</span>
                            </a>
                          </Button>
                          <MetadataFileDeleteDialog fileId={file.id} fileName={file.name} onDelete={handleDelete} />
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
