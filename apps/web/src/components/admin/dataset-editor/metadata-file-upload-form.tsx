"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { uploadDatasetMetadataFile } from "@/actions/dataset-metadata";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MAX_METADATA_FILE_SIZE } from "@/lib/document-validation";

type FormValues = {
  description: string;
  file: File[];
  metadataType: "documentation" | "other" | "questionnaire" | "variable_descriptions";
  name: string;
};

type MetadataFileUploadFormProps = {
  datasetId: string;
  onUploaded: () => Promise<void> | void;
};

const acceptedExtensions = ".pdf,.docx,.xlsx,.pptx,.odt,.ods,.odp,.webp,.png,.jpg,.jpeg";

export function MetadataFileUploadForm({ datasetId, onUploaded }: MetadataFileUploadFormProps) {
  const t = useTranslations("adminDatasetEditor.metadata");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(
      z.object({
        description: z.string(),
        file: z
          .array(z.custom<File>())
          .min(1, t("validation.file.required"))
          .max(1, t("validation.file.required"))
          .refine((files) => files.every((file) => file.size <= MAX_METADATA_FILE_SIZE), {
            message: t("validation.file.sizeLimit", { size: 10 }),
            path: ["file"],
          }),
        metadataType: z.enum(["documentation", "other", "questionnaire", "variable_descriptions"]),
        name: z.string().trim().min(1, t("validation.name.required")),
      })
    ),
    defaultValues: {
      description: "",
      file: [],
      metadataType: "documentation",
      name: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    const [selectedFile] = data.file;
    if (!selectedFile) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("metadataType", data.metadataType);
      formData.append("name", data.name);
      formData.append("description", data.description);

      const result = await uploadDatasetMetadataFile(datasetId, formData);
      if (!result.success) {
        toast.error(result.error || t("messages.uploadError"));
        return;
      }

      toast.success(t("messages.uploadSuccess"));
      form.reset({
        description: "",
        file: [],
        metadataType: "documentation",
        name: "",
      });
      await onUploaded();
    } catch (error) {
      console.error(error);
      toast.error(t("messages.uploadError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardShell>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="file"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{t("upload.fileLabel")}</FieldLabel>
              <FieldGroup>
                <FileUpload
                  value={field.value}
                  onValueChange={(value) => {
                    const nextFile = value[0];
                    if (nextFile && !form.getValues("name")) {
                      form.setValue("name", nextFile.name, { shouldValidate: true });
                    }
                    field.onChange(value);
                  }}
                  accept={acceptedExtensions}
                  maxFiles={1}
                  maxSize={MAX_METADATA_FILE_SIZE}
                  multiple={false}
                  onFileReject={(_, message) => {
                    form.setError("file", { message });
                  }}
                  data-testid="admin.dataset.metadata-file.upload.input">
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
                    {field.value.map((file) => (
                      <FileUploadItem
                        key={`${file.name}-${file.size}`}
                        value={file}
                        data-testid="admin.dataset.metadata-file.selected-file">
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="metadataType"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("upload.typeLabel")}</FieldLabel>
              <FieldGroup>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={field.name} data-testid="admin.dataset.metadata-file.type-trigger">
                    <SelectValue placeholder={t("upload.typeLabel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="questionnaire">{t("types.questionnaire")}</SelectItem>
                    <SelectItem value="variable_descriptions">{t("types.variable_descriptions")}</SelectItem>
                    <SelectItem value="documentation">{t("types.documentation")}</SelectItem>
                    <SelectItem value="other">{t("types.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("upload.nameLabel")}</FieldLabel>
              <FieldGroup>
                <Input {...field} id={field.name} data-testid="admin.dataset.metadata-file.name-input" />
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("upload.descriptionLabel")}</FieldLabel>
              <FieldGroup>
                <Textarea {...field} id={field.name} rows={3} />
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button type="submit" disabled={isSubmitting} data-testid="admin.dataset.metadata-file.upload.submit">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("upload.uploading")}
            </>
          ) : (
            t("upload.submit")
          )}
        </Button>
      </form>
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border p-4">{children}</div>;
}
