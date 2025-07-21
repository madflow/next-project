"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
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

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger {...triggerProps} data-testid="app.dropdown.dataset.loading">
          <SelectValue placeholder="Loading datasets..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (isError) {
    return (
      <Select disabled>
        <SelectTrigger data-testid="app.dropdown.dataset.error">
          <SelectValue placeholder="Error loading datasets." />
        </SelectTrigger>
      </Select>
    );
  }

  if (!data?.rows || data.rows.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger data-testid="app.dropdown.dataset.empty">
          <SelectValue placeholder="No datasets found." />
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
        <SelectValue placeholder="Select a dataset" />
      </SelectTrigger>
      <SelectContent data-testid="app.dropdown.dataset.content">
        <SelectGroup key="dataset-group">
          <SelectLabel key="dataset-label">Select a dataset</SelectLabel>
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
