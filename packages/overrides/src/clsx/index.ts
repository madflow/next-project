// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassValue = string | number | boolean | undefined | null | ClassValue[] | { [key: string]: any };

export function clsx(...args: ClassValue[]): string {
  const toVal = (mix: ClassValue): string => {
    if (typeof mix === "string" || typeof mix === "number") return String(mix);
    if (!mix || typeof mix !== "object") return "";
    if (Array.isArray(mix)) return mix.filter(Boolean).map(toVal).filter(Boolean).join(" ");
    return Object.keys(mix)
      .filter((k) => mix[k])
      .join(" ");
  };

  return args.filter(Boolean).map(toVal).filter(Boolean).join(" ");
}
