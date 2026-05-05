import { fileTypeFromBuffer } from "file-type";
import { createHash } from "node:crypto";

export const MAX_METADATA_FILE_SIZE = 10 * 1024 * 1024;

const metadataMimeTypes = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  odp: "application/vnd.oasis.opendocument.presentation",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odt: "application/vnd.oasis.opendocument.text",
  pdf: "application/pdf",
  png: "image/png",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  webp: "image/webp",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

const ALLOWED_METADATA_FILE_EXTENSIONS = Object.keys(metadataMimeTypes) as (keyof typeof metadataMimeTypes)[];

type MetadataFileExtension = (typeof ALLOWED_METADATA_FILE_EXTENSIONS)[number];

type MetadataFileValidationSuccess = {
  success: true;
  buffer: Buffer;
  extension: MetadataFileExtension;
  fileHash: string;
  mimeType: (typeof metadataMimeTypes)[MetadataFileExtension];
};

type MetadataFileValidationFailure = {
  success: false;
  error: string;
};

type MetadataFileValidationResult = MetadataFileValidationSuccess | MetadataFileValidationFailure;

const allowedFileTypeExtensions = new Set<MetadataFileExtension>(["jpeg", "jpg", "pdf", "png", "webp"]);

const zipContainerSignatures: Record<
  Exclude<MetadataFileExtension, "jpeg" | "jpg" | "pdf" | "png" | "webp">,
  string[]
> = {
  docx: ["word/"],
  odp: ["mimetypeapplication/vnd.oasis.opendocument.presentation", "content.xml", "META-INF/manifest.xml"],
  ods: ["mimetypeapplication/vnd.oasis.opendocument.spreadsheet", "content.xml", "META-INF/manifest.xml"],
  odt: ["mimetypeapplication/vnd.oasis.opendocument.text", "content.xml", "META-INF/manifest.xml"],
  pptx: ["ppt/"],
  xlsx: ["xl/"],
};

function detectZipContainerType(buffer: Buffer): MetadataFileExtension | null {
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    return null;
  }

  const bufferText = buffer.toString("latin1");

  for (const [extension, markers] of Object.entries(zipContainerSignatures) as [
    Exclude<MetadataFileExtension, "jpeg" | "jpg" | "pdf" | "png" | "webp">,
    string[],
  ][]) {
    if (markers.every((marker) => bufferText.includes(marker))) {
      return extension;
    }
  }

  return null;
}

function getExtensionFromName(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension || null;
}

export async function validateMetadataFile(file: File): Promise<MetadataFileValidationResult> {
  if (file.size > MAX_METADATA_FILE_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size: ${MAX_METADATA_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  const originalExtension = getExtensionFromName(file.name);
  if (!originalExtension || !ALLOWED_METADATA_FILE_EXTENSIONS.includes(originalExtension as MetadataFileExtension)) {
    return {
      success: false,
      error: "Invalid file type. Allowed types: PDF, DOCX, XLSX, PPTX, ODT, ODS, ODP, WEBP, PNG, JPEG.",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileType = await fileTypeFromBuffer(buffer);

  let detectedExtension: MetadataFileExtension | null = null;
  if (fileType?.ext === "apng") {
    detectedExtension = "png";
  } else if (fileType?.ext && allowedFileTypeExtensions.has(fileType.ext as MetadataFileExtension)) {
    detectedExtension = fileType.ext === "jpeg" ? "jpg" : (fileType.ext as MetadataFileExtension);
  } else {
    detectedExtension = detectZipContainerType(buffer);
  }

  if (!detectedExtension) {
    return {
      success: false,
      error: "Could not detect file type. Please upload a valid document.",
    };
  }

  const normalizedOriginalExtension = originalExtension === "jpeg" ? "jpg" : originalExtension;
  if (normalizedOriginalExtension !== detectedExtension) {
    return {
      success: false,
      error: "File extension does not match the actual file content.",
    };
  }

  const fileHash = createHash("sha256").update(buffer).digest("hex");

  return {
    success: true,
    buffer,
    extension: detectedExtension,
    fileHash,
    mimeType: metadataMimeTypes[detectedExtension],
  };
}
