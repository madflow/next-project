function createAsciiFilenameFallback(filename: string) {
  const fallback = filename
    .normalize("NFKD")
    .replace(/[\r\n"]/g, "_")
    .replace(/[^\x20-\x7E]/g, "_")
    .trim();

  return fallback.length > 0 ? fallback : "download";
}

export function createAttachmentContentDisposition(filename: string) {
  const fallback = createAsciiFilenameFallback(filename);
  const encodedFilename = encodeRFC5987ValueChars(filename);

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodedFilename}`;
}

function encodeRFC5987ValueChars(value: string) {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}
