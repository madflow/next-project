import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { MAX_METADATA_FILE_SIZE, validateMetadataFile } from "./document-validation";

const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a5kAAAAASUVORK5CYII=";

describe("validateMetadataFile", () => {
  test("accepts a valid png file", async () => {
    const file = new File([Buffer.from(pngBase64, "base64")], "evidence.png", {
      type: "image/png",
    });

    const result = await validateMetadataFile(file);

    assert.equal(result.success, true);
    if (!result.success) {
      return;
    }

    assert.equal(result.extension, "png");
    assert.equal(result.mimeType, "image/png");
    assert.equal(result.buffer.length > 0, true);
    assert.equal(result.fileHash.length, 64);
  });

  test("rejects files larger than the size limit", async () => {
    const file = new File([Buffer.alloc(MAX_METADATA_FILE_SIZE + 1)], "too-large.png", {
      type: "image/png",
    });

    const result = await validateMetadataFile(file);

    assert.deepEqual(result, {
      success: false,
      error: `File too large. Maximum size: ${MAX_METADATA_FILE_SIZE / 1024 / 1024}MB.`,
    });
  });

  test("rejects extension spoofing", async () => {
    const file = new File([Buffer.from(pngBase64, "base64")], "fake.pdf", {
      type: "application/pdf",
    });

    const result = await validateMetadataFile(file);

    assert.deepEqual(result, {
      success: false,
      error: "File extension does not match the actual file content.",
    });
  });
});
