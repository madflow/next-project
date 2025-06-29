import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const APP_CONTEXT_KEY = "app_context";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
