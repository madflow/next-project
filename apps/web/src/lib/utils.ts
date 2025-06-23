import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const APP_CONTEXT_KEY = "app_context";

type AppContext = {
  activeProject?: {
    id: string;
    name: string;
    slug: string;
    organizationId: string;
  } | null;
};

export function getAppContext(): AppContext {
  if (typeof window === "undefined") return {};
  
  try {
    const context = localStorage.getItem(APP_CONTEXT_KEY);
    return context ? JSON.parse(context) : {};
  } catch (error) {
    console.error("Failed to parse app context from localStorage", error);
    return {};
  }
}

export function setAppContext(context: Partial<AppContext>) {
  if (typeof window === "undefined") return;
  
  try {
    const currentContext = getAppContext();
    const newContext = { ...currentContext, ...context };
    localStorage.setItem(APP_CONTEXT_KEY, JSON.stringify(newContext));
  } catch (error) {
    console.error("Failed to update app context in localStorage", error);
  }
}

export function getActiveProject(organizationId?: string) {
  const context = getAppContext();
  if (!context.activeProject) return null;
  
  // Only return the project if it belongs to the current organization
  if (organizationId && context.activeProject.organizationId !== organizationId) {
    return null;
  }
  
  return context.activeProject;
}

export function setActiveProject(project: AppContext["activeProject"]) {
  setAppContext({ activeProject: project });
}

export function clearActiveProject() {
  setAppContext({ activeProject: null });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
