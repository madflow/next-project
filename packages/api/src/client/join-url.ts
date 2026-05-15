export const joinUrl = (base: string, path: string) => {
  const url = new URL(path, base);
  return url.toString();
};
