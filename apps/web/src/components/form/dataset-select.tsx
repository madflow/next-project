"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { useTranslations } from "next-intl";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDatasetsByProject } from "@/hooks/use-datasets-by-project";

type DatasetSelectProps = {
  projectId: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
  triggerProps?: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "default" };
};

export function DatasetSelect({ projectId, onValueChange, defaultValue, triggerProps }: DatasetSelectProps) {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue || "");
  const { data, isLoading, isError } = useDatasetsByProject(projectId);
  const t = useTranslations("formDatasetSelect");

  // Update selectedValue when defaultValue changes and validate it exists
  React.useEffect(() => {
    if (!defaultValue) {
      setSelectedValue("");
      return;
    }

    // If data is loaded, check if the defaultValue exists in available datasets
    if (data?.rows) {
      const datasetExists = data.rows.some((item) => item.datasets.id === defaultValue);
      if (datasetExists) {
        setSelectedValue(defaultValue);
      } else {
        // Dataset no longer exists, clear the selection and notify parent
        setSelectedValue("");
        onValueChange("");
      }
    } else {
      // Data not loaded yet, set the value optimistically
      setSelectedValue(defaultValue);
    }
  }, [defaultValue, data?.rows, onValueChange]);

  if (isLoading) {
    return (
      <Select disabled value={selectedValue}>
        <SelectTrigger {...triggerProps} data-testid="app.dropdown.dataset.loading">
          <SelectValue placeholder={t("loadingDatasets")} />
        </SelectTrigger>
      </Select>
    );
  }

  if (isError) {
    return (
      <Select disabled value={selectedValue}>
        <SelectTrigger data-testid="app.dropdown.dataset.error">
          <SelectValue placeholder={t("errorLoading")} />
        </SelectTrigger>
      </Select>
    );
  }

  if (!data?.rows || data.rows.length === 0) {
    return (
      <Select disabled value={selectedValue}>
        <SelectTrigger data-testid="app.dropdown.dataset.empty">
          <SelectValue placeholder={t("noDatasets")} />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      onValueChange={(value) => {
        setSelectedValue(value);
        onValueChange(value);
      }}
      value={selectedValue}>
      <SelectTrigger data-testid="app.dropdown.dataset.trigger" className="w-full">
        <SelectValue placeholder={t("selectDataset")} />
      </SelectTrigger>
      <SelectContent data-testid="app.dropdown.dataset.content">
        <SelectGroup key="dataset-group">
          <SelectLabel key="dataset-label">{t("selectDataset")}</SelectLabel>
          {data.rows.map((item) => (
            <SelectItem
              className="truncate"
              key={item.datasets.id}
              value={item.datasets.id}
              data-testid={`dataset-dropdown-item-${item.datasets.id}`}>
              {item.datasets.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
