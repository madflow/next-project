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
import { useProjectsByOrg } from "@/hooks/use-projects-by-org";

type ProjectSelectProps = {
  organizationId: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
  triggerProps?: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "default" };
};

export function ProjectSelect({ organizationId, onValueChange, defaultValue, triggerProps }: ProjectSelectProps) {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue || "");
  const { data: projects, isLoading, isError } = useProjectsByOrg(organizationId);

  if (isLoading) {
    return (
      <Select disabled value={selectedValue}>
        <SelectTrigger {...triggerProps} data-testid="project-dropdown-loading">
          <SelectValue placeholder="Loading projects..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (isError) {
    return (
      <Select disabled value={selectedValue}>
        <SelectTrigger {...triggerProps} data-testid="project-dropdown-error">
          <SelectValue placeholder="Error loading projects." />
        </SelectTrigger>
      </Select>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Select disabled value={selectedValue}>
        <SelectTrigger {...triggerProps} data-testid="project-dropdown-empty">
          <SelectValue placeholder="No projects found." />
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
      <SelectTrigger {...triggerProps} className="w-[180px]" data-testid="project-dropdown">
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent data-testid="project-dropdown-content">
        <SelectGroup key="project-group">
          <SelectLabel key="project-label">Select a project</SelectLabel>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id} data-testid={`project-dropdown-item-${project.slug}`}>
              {project.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
