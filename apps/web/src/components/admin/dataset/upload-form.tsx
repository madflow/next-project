"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { uploadDataset } from "@/actions/dataset";
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

const formSchema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Please select exactly one file")
    .refine((files) => files.every((file) => file.size <= 100 * 1024 * 1024), {
      message: "File size must be less than 100MB",
      path: ["files"],
    }),
  name: z.string().min(1, "Name is required").trim(),
  organizationId: z.string().min(1, "Organization selection is required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function DatasetUploadForm() {
  const router = useRouter();
  const t = useTranslations("adminDataset");
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
      files: [],
      name: "",
      organizationId: "",
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

  return (
    <div className="max-w-2xl space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onErrors)} className="space-y-6">
          <FormField
            control={form.control}
            name="files"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.fileLabel")}</FormLabel>
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
                          form.setValue("name", fileValue.name);
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
                        <p className="text-muted-foreground text-xs">{t("upload.supportedFormats")} (max 100MB)</p>
                      </div>
                    </FileUploadDropzone>
                    <FileUploadList>
                      {field.value.map((file, index) => (
                        <FileUploadItem key={index} value={file}>
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
                <FormLabel>
                  {t("form.nameLabel")} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder={t("form.namePlaceholder")} {...field} />
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  data-testid="app.admin.dataset.organization-select">
                  <FormControl>
                    <SelectTrigger
                      className="w-full sm:max-w-[50%]"
                      data-testid="app.admin.dataset.organization-trigger">
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
            <Button type="submit" data-testid="app.admin.dataset.upload-button" disabled={isPending || isUploading}>
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
