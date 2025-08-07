"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { uploadDataset } from "@/actions/dataset";
import { TextArrayEditor } from "@/components/form/text-array-editor";
import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
} from "@/components/ui/file-upload";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Organization } from "@/types/organization";

function generateDatasetName(filename: string): string {
  // Return empty string if filename is empty or null
  if (!filename) {
    return "";
  }

  // Remove file extension
  const nameWithoutExtension = filename.includes(".") ? filename.substring(0, filename.lastIndexOf(".")) : filename;

  // Handle cases where filename might be just an extension (e.g., ".bashrc")
  if (!nameWithoutExtension) {
    return "";
  }

  // Replace underscores with hyphens
  const withHyphens = nameWithoutExtension.replace(/_/g, "-");

  // Convert to title case: uppercase first letter, rest lowercase
  const firstChar = withHyphens.charAt(0).toUpperCase();
  const rest = withHyphens.slice(1).toLowerCase();

  return `${firstChar}${rest}`;
}

type FormData = {
  files: File[];
  name: string;
  organizationId: string;
  missingValues?: string[];
  description?: string;
};

export function DatasetUploadForm() {
  const router = useRouter();
  const t = useTranslations("adminDatasetUploadForm");
  const [isPending] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const result = await fetch("/api/organizations").then((res) => res.json());
        setOrganizations(result.rows);
      } catch (error) {
        console.error("Failed to load organizations", error);
        toast.error(t("errors.unknownError"));
      } finally {
        setIsLoading(false);
      }
    }
    loadOrganizations();
  }, [t]);

  const form = useForm<FormData>({
    resolver: zodResolver(
      z.object({
        files: z
          .array(z.custom<File>())
          .min(1, t("validation.files.required"))
          .refine((files) => files.every((file) => file.size <= 100 * 1024 * 1024), {
            message: t("validation.files.sizeLimit"),
            path: ["files"],
          }),
        name: z.string().min(1, t("validation.name.required")).trim(),
        organizationId: z.string().min(1, t("validation.organizationId.required")),
        missingValues: z.array(z.string()).optional(),
        description: z.string().optional(),
      })
    ),
    defaultValues: {
      files: [],
      name: "",
      organizationId: "",
      missingValues: [],
      description: "",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onErrors = (errors: any) => {
    console.log(errors);
  };

  const onSubmit = async (data: FormData) => {
    const selectedFile = data.files[0];

    if (!selectedFile) {
      toast.error(t("validation.files.required"));
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadDataset({
        file: selectedFile,
        name: data.name,
        organizationId: data.organizationId,
        description: data.description || undefined,
        missingValues: data.missingValues || null,
        contentType: selectedFile.type,
      });

      if (result.success) {
        toast.success(t("messages.success"));
        router.push("/admin/datasets");
      } else {
        toast.error(result.error || t("messages.error"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("errors.unknownError"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onErrors)} className="space-y-6">
          <FormField
            control={form.control}
            name="files"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("formLabels.name")}</FormLabel>
                <FormControl>
                  <FileUpload
                    maxFiles={1}
                    maxSize={100 * 1024 * 1024}
                    accept=".sav"
                    className="w-full"
                    value={field.value}
                    onValueChange={(value) => {
                      const nameState = form.getFieldState("name");
                      if (!nameState.isTouched) {
                        const fileValue = value[0] ?? null;
                        if (fileValue) {
                          form.setValue("name", generateDatasetName(fileValue.name));
                        }
                      }
                      field.onChange(value);
                    }}
                    onFileReject={(_, message) => {
                      form.setError("files", {
                        message,
                      });
                    }}
                    multiple={false}>
                    <FileUploadDropzone>
                      <div className="flex flex-col items-center gap-1 text-center">
                        <div className="flex items-center justify-center rounded-full border p-2.5">
                          <Upload className="text-muted-foreground size-6" />
                        </div>
                        <p className="text-muted-foreground mb-2 text-sm">
                          <span className="font-semibold">{t("upload.clickToUpload")}</span> {t("upload.orDragAndDrop")}
                        </p>
                        <p className="text-muted-foreground text-xs">{t("upload.supportedFormats")}</p>
                      </div>
                    </FileUploadDropzone>
                    <FileUploadList>
                      {field.value.map((file, index) => (
                        <FileUploadItem key={index} value={file} data-testid="app.admin.dataset.selected-file">
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("formLabels.name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("formLabels.name")} {...field} data-testid="app.admin.dataset.name-input" />
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
                <FormLabel>{t("formLabels.organization")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  data-testid="app.admin.dataset.organization-select">
                  <FormControl>
                    <SelectTrigger className="w-full" data-testid="app.admin.dataset.organization-trigger">
                      <SelectValue placeholder={t("formLabels.organization")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoading ? (
                      <div className="text-muted-foreground px-2 py-1.5 text-sm">{t("buttons.uploading")}</div>
                    ) : organizations.length === 0 ? (
                      <div className="text-muted-foreground px-2 py-1.5 text-sm">{t("messages.noOrganizations")}</div>
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

          <FormField
            control={form.control}
            name="missingValues"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("formLabels.missingValues")}</FormLabel>
                <FormControl>
                  <TextArrayEditor value={field.value ?? []} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("formLabels.description")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("formLabels.description")}
                    disabled={isPending || isUploading}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-start space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending || isUploading}>
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" data-testid="app.admin.dataset.upload-button" disabled={isPending || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("buttons.uploading")}
                </>
              ) : (
                t("buttons.upload")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
