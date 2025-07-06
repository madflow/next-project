"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { uploadDataset } from "@/actions/dataset";
import { listProjects } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";
import { Organization } from "@/types/organization";

type FileWithPreview = File & {
  preview?: string;
};

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  organizationId: z.string().min(1, "Organization selection is required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function DatasetUploadForm() {
  const router = useRouter();
  const t = useTranslations("adminDataset");
  const [isPending] = useTransition();
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Validate file type
  const validTypes = [".sav"]; //".xlsx", ".csv", ".ods", ".parquet"];

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const result = await fetch("/api/organizations").then((res) => res.json());
        setOrganizations(result.rows);
      } catch (error) {
        console.error("Failed to load organizations", error);
        toast.error(t("messages.error.generic"));
      } finally {
        setIsLoading(false);
      }
    }
    loadOrganizations();
  }, [t]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      organizationId: "",
      description: "",
    },
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
    const currentName = form.getValues("name");
    if (!currentName) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      form.setValue("name", fileNameWithoutExt);
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

  const onSubmit = async (data: FormData) => {
    if (!selectedFile) {
      toast.error(t("errors.noFileSelected"));
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadDataset({
        file: selectedFile,
        name: data.name,
        organizationId: data.organizationId,
        description: data.description || undefined,
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
  if (isLoadingProjects) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  data-testid="app.admin.dataset.file-upload"
                  ref={fileInputRef}
                  name="file-upload"
                  type="file"
                  className="hidden"
                  accept={validTypes.join(",")}
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isPending || isUploading}
                    aria-label="Remove file">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* File Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("form.nameLabel")} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder={t("form.namePlaceholder")} disabled={isPending || isUploading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.organization.label")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="organization-select">
                  <FormControl>
                    <SelectTrigger className="w-full sm:max-w-[50%]">
                      <SelectValue placeholder={t("form.organization.placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoading ? (
                      <div className="text-muted-foreground px-2 py-1.5 text-sm">{t("form.organization.loading")}</div>
                    ) : organizations.length === 0 ? (
                      <div className="text-muted-foreground px-2 py-1.5 text-sm">{t("form.organization.notFound")}</div>
                    ) : (
                      organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id} data-testid={`org-option-${org.slug}`}>
                          {org.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.descriptionLabel")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("form.descriptionPlaceholder")}
                    disabled={isPending || isUploading}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending || isUploading}>
              {t("actions.cancel")}
            </Button>
            <Button
              type="submit"
              data-testid="app.admin.dataset.upload-button"
              disabled={isPending || isUploading || !selectedFile || projects.length === 0}>
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
        </form>
      </Form>
    </div>
  );
}
