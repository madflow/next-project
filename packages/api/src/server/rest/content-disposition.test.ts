import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createAttachmentContentDisposition } from "./content-disposition";

describe("createAttachmentContentDisposition", () => {
  test("keeps ascii filenames readable", () => {
    assert.equal(
      createAttachmentContentDisposition("report.csv"),
      "attachment; filename=\"report.csv\"; filename*=UTF-8''report.csv"
    );
  });

  test("creates a latin-1 safe fallback for unicode filenames", () => {
    assert.equal(
      createAttachmentContentDisposition("metadata fu\u0308r.csv"),
      "attachment; filename=\"metadata fu_r.csv\"; filename*=UTF-8''metadata%20fu%CC%88r.csv"
    );
  });

  test("removes header-breaking characters from the fallback", () => {
    assert.equal(
      createAttachmentContentDisposition('evil\r\n"file".csv'),
      "attachment; filename=\"evil___file_.csv\"; filename*=UTF-8''evil%0D%0A%22file%22.csv"
    );
  });
});
