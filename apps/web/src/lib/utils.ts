import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "@repo/overrides/clsx";

export const APP_CONTEXT_KEY = "app_context";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @param decimals Number of decimal places to show (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format a date to a localized date string
 * @param date Date object or date string
 * @param locale Locale string (default: "en-US")
 * @returns Formatted date string (e.g., "January 1, 2023")
 */
export function formatDate(date: Date | string | number, locale = "en-US"): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}
