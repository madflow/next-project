import { z } from "zod";

export const datafileMetadataSchema = z.object({
  version: z.string(),
  variables: z.array(
    z.object({
      name: z.string(),
      label: z.string(),
      type: z.string(),
      format: z.string(),
    })
  ),
});

export type DatafileMetadata = z.infer<typeof datafileMetadataSchema>;

export interface Datafile {
  id: string;
  name: string;
  description: string | null;
  filename: string;
  fileType: string;
  fileSize: number;
  fileHash: string;
  storageKey: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date | null;
  uploadedAt: Date;
  metadata: DatafileMetadata | null;
}
