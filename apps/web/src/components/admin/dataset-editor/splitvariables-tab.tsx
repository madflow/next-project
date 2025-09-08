"use client";

import { useTranslations } from "next-intl";
import { SplitVariablesAssignment } from "../dataset-splitvariables/split-variables-assignment";

interface SplitVariablesTabProps {
  datasetId: string;
}

export function SplitVariablesTab({ datasetId }: SplitVariablesTabProps) {
  const t = useTranslations("adminDatasetSplitVariables");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-medium mt-6" data-testid="admin.dataset.splitvariables.title">{t("title")}</h2>
        <p className="text-muted-foreground text-sm" data-testid="admin.dataset.splitvariables.description">{t("description")}</p>
      </div>

      {/* Split Variables Assignment */}
      <div className="h-fit">
        <SplitVariablesAssignment datasetId={datasetId} />
      </div>
    </div>
  );
}