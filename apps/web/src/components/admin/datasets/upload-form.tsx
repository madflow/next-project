"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadDataset } from "@/actions/dataset";
import { Button } from "@/components/ui/button";
import { useQueryApi } from "@/hooks/use-query-api";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
};

type FileWithPreview = File & {
  preview?: string;
};

export function DatasetUploadForm() {
  const router = useRouter();
  const t = useTranslations("adminDataset");
  const [isPending] = useTransition();
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [".sav", ".xlsx", ".csv", ".ods", ".parquet"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (fileExt && !validTypes.includes(`.${fileExt}`)) {
      toast.error(t("errors.invalidFileType"));
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error(t("errors.fileTooLarge", { maxSize: "100MB" }));
      return;
    }

    const fileWithPreview = Object.assign(file, {
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    });

    setSelectedFile(fileWithPreview);

    // Set default name if not set
    if (!name) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setName(fileNameWithoutExt);
    }
  };

  const handleRemoveFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error(t("errors.noFileSelected"));
      return;
    }

    if (!name.trim()) {
      toast.error(t("errors.nameRequired"));
      return;
    }

    if (!organizationId) {
      toast.error(t("errors.organizationRequired"));
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadDataset({
        file: selectedFile,
        name: name.trim(),
        organizationId,
        description: description.trim() || undefined,
        contentType: selectedFile.type,
      });

      if (result.success) {
        toast.success(t("uploadSuccess"));
        router.push("/admin/datasets");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error(result.error || t("errors.uploadFailed"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("errors.unknownError"));
    } finally {
      setIsUploading(false);
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (selectedFile?.preview) {
        URL.revokeObjectURL(selectedFile.preview);
      }
    };
  }, [selectedFile]);

  // Show loading state while projects are loading
  if (isLoadingOrganizations) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* File Upload Area */}
      <div className="space-y-2">
        <div className="flex w-full items-center justify-center">
          <label
            htmlFor="file-upload"
            className={cn(
              "flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed",
              "hover:bg-accent/50 transition-colors",
              (isPending || isUploading) && "cursor-not-allowed opacity-50"
            )}
            onClick={(e) => {
              // Prevent opening the file dialog if already uploading
              if (isUploading) e.preventDefault();
            }}>
            <div className="flex flex-col items-center justify-center px-4 pt-5 pb-6 text-center">
              <Upload className="text-muted-foreground mb-3 h-10 w-10" />
              <p className="text-muted-foreground mb-2 text-sm">
                <span className="font-semibold">{t("upload.clickToUpload")}</span> {t("upload.orDragAndDrop")}
              </p>
              <p className="text-muted-foreground text-xs">{t("upload.supportedFormats")} (max 100MB)</p>
            </div>
            <input
              id="file-upload"
              ref={fileInputRef}
              name="file-upload"
              type="file"
              className="hidden"
              accept=".sav,.xlsx,.csv,.ods,.parquet"
              onChange={handleFileChange}
              disabled={isPending || isUploading}
            />
          </label>
        </div>

        {selectedFile && (
          <div className="bg-card mt-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-md">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-muted-foreground text-xs">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                disabled={isPending || isUploading}
                aria-label="Remove file">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-foreground block text-sm font-medium">
          {t("form.nameLabel")} <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(
            "border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          placeholder={t("form.namePlaceholder")}
          disabled={isPending || isUploading}
          required
        />
      </div>

      {/* Project Selection */}
      <div className="space-y-2">
        <label htmlFor="project" className="text-foreground block text-sm font-medium">
          {t("form.projectLabel")} <span className="text-destructive">*</span>
        </label>
        <select
          id="organization"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          className={cn(
            "border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          disabled={isPending || isUploading || organizations.length === 0}
          required>
          <option value="">{projects.length === 0 ? t("form.noProjectsAvailable") : t("form.selectProject")}</option>
          {projects.map((project: Project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-foreground block text-sm font-medium">
          {t("form.descriptionLabel")}
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={cn(
            "border-input bg-background ring-offset-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm",
            "placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          placeholder={t("form.descriptionPlaceholder")}
          disabled={isPending || isUploading}
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending || isUploading}>
          {t("actions.cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || isUploading || !selectedFile || !projectId || projects.length === 0}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("actions.uploading")}
            </>
          ) : (
            t("actions.uploadFile")
          )}
        </Button>
      </div>
    </div>
  );
}
