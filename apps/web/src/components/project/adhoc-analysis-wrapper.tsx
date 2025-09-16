"use client";

import { ActiveThemeProvider } from "@/components/active-theme";
import { AdHocAnalysis } from "./adhoc-analysis";
import { useAdhocPersistence } from "@/hooks/use-adhoc-persistence";
import { type Project } from "@/types/project";

type AdhocAnalysisWrapperProps = {
  project: Project;
};

export function AdhocAnalysisWrapper({ project }: AdhocAnalysisWrapperProps) {
  const { saveTheme } = useAdhocPersistence(project.id);

  return (
    <ActiveThemeProvider onThemeChangeAction={saveTheme}>
      <AdHocAnalysis project={project} />
    </ActiveThemeProvider>
  );
}