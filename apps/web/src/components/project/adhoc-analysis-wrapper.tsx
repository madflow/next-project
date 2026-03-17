"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ActiveThemeProvider } from "@/components/active-theme";
import { useAdhocPersistence } from "@/hooks/use-adhoc-persistence";
import { type Project } from "@/types/project";

// Dynamically import AdHocAnalysis without SSR to avoid hydration issues with Radix UI Select
const AdHocAnalysis = dynamic(() => import("./adhoc-analysis").then((mod) => ({ default: mod.AdHocAnalysis })), {
  ssr: false,
});

type AdhocAnalysisWrapperProps = {
  project: Project;
};

export function AdhocAnalysisWrapper({ project }: AdhocAnalysisWrapperProps) {
  const { saveTheme } = useAdhocPersistence(project.id);

  return (
    <ActiveThemeProvider onThemeChangeAction={saveTheme}>
      <Suspense fallback={null}>
        <AdHocAnalysis project={project} />
      </Suspense>
    </ActiveThemeProvider>
  );
}
