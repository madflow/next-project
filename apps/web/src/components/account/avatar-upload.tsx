"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChangeEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAvatar, uploadAvatar } from "@/actions/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { updateUser, useSession } from "@/lib/auth-client";

export function AvatarUpload() {
  // Use the correct namespace for translations
  const t = useTranslations("account.profile.avatar");
  const { data: session } = useSession();
  const user = session?.user;
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive preview URL from user data or selected file preview
  const previewUrl =
    selectedFilePreview || (user?.image ? `/api/users/${user.id}/avatars/${encodeURIComponent(user.image)}` : null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("error.fileType"));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("error.fileSize"));
      return;
    }

    // Create a preview URL for the selected image
    const imageUrl = URL.createObjectURL(file);
    setSelectedFilePreview(imageUrl);
    setSelectedFile(file);
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || !user?.image) return;

    try {
      startTransition(async () => {
        // Extract the filename from the image URL
        const filename = user.image?.split("/").pop();
        if (!filename) throw new Error(t("error.invalidUrl"));

        // Delete the avatar from S3
        const deleteResult = await deleteAvatar(user.id, filename);
        if (!deleteResult.success) {
          throw new Error(deleteResult.error || "Failed to delete avatar");
        }

        // Update the user's profile to remove the avatar reference
        await updateUser({
          image: null,
          fetchOptions: {
            onError: () => {
              toast.error(t("error.deleteFailed"));
            },
            onSuccess: () => {
              toast.success(t("successDelete"));
              setSelectedFilePreview(null);
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            },
          },
        });
      });
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error(error instanceof Error ? error.message : t("error.unknown"));
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !user?.id) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("userId", user.id);
        formData.append("contentType", selectedFile.type);

        const result = await uploadAvatar({
          file: selectedFile,
          userId: user.id,
          contentType: selectedFile.type,
        });

        if (result.success && result.url) {
          // Update the user's profile with the image key (not the full URL)
          await updateUser({
            image: result.url,
            fetchOptions: {
              onError: () => {
                toast.error(t("error.updateFailed"));
              },
              onSuccess: () => {
                toast.success(t("success"));
                // Clear the selected file after successful update
                setSelectedFile(null);
                setSelectedFilePreview(null);
              },
            },
          });
        } else {
          toast.error(t("error.uploadFailed"));
        }
      } catch (error) {
        console.error("Error uploading avatar:", error);
        toast.error(t("error.unknown"));
      }
    });
  };

  // Get the user's initials for the avatar fallback
  const getInitials = () => {
    return user?.name?.charAt(0)?.toUpperCase() || t("initial");
  };

  // Show loading state while uploading
  if (isPending) {
    return (
      <div
        className="bg-muted flex h-24 w-24 items-center justify-center rounded-full"
        data-testid="app.user.account.avatar-loading">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4" data-testid="app.user.account.avatar-container">
      <div className="relative">
        <Avatar className="h-24 w-24" data-testid="app.user.account.avatar-image">
          {previewUrl ? (
            <AvatarImage
              src={previewUrl}
              alt={user?.name || t("title")}
              data-testid="app.user.account.avatar-image-preview"
            />
          ) : (
            <AvatarFallback className="text-2xl font-medium" data-testid="app.user.account.avatar-fallback">
              {getInitials()}
            </AvatarFallback>
          )}
        </Avatar>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
          disabled={isPending}
          data-testid="app.user.account.avatar-file-input"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            data-testid="app.user.account.avatar-upload-button">
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? t("change") : t("upload")}
          </Button>
          {previewUrl && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isPending}
                data-testid="app.user.account.avatar-remove-button">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                {isPending ? t("removing") : t("remove")}
              </Button>
            </>
          )}
        </div>

        {selectedFile && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="w-full"
            data-testid="app.user.account.avatar-save-button">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("saveChanges")
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
