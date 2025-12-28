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
import { useOrganizations } from "@/hooks/use-organizations";

type OrganizationSelectProps = {
  onValueChange: (value: string) => void;
  defaultValue?: string;
  triggerProps?: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "default" };
};

export function OrganizationSelect({ onValueChange, defaultValue, triggerProps }: OrganizationSelectProps) {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue || "");
  const { data: organizations, isLoading, isError } = useOrganizations();
  const t = useTranslations();

  if (isLoading) {
    return (
      <Select disabled value={selectedValue}>
        <SelectTrigger {...triggerProps} data-testid="organization-dropdown-loading">
          <SelectValue placeholder={t("formOrganizationSelect.loadingOrganizations")} />
        </SelectTrigger>
      </Select>
    );
  }

  if (isError) {
    return (
      <Select disabled value={selectedValue}>
        <SelectTrigger {...triggerProps} data-testid="organization-dropdown-error">
          <SelectValue placeholder={t("formOrganizationSelect.errorLoading")} />
        </SelectTrigger>
      </Select>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <Select disabled value={selectedValue}>
        <SelectTrigger {...triggerProps} data-testid="organization-dropdown-empty">
          <SelectValue placeholder={t("formOrganizationSelect.noOrganizations")} />
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
      <SelectTrigger {...triggerProps} className="w-[180px]" data-testid="organization-dropdown">
        <SelectValue placeholder={t("formOrganizationSelect.selectOrganization")} />
      </SelectTrigger>
      <SelectContent data-testid="organization-dropdown-content">
        <SelectGroup key="organization-group">
          <SelectLabel key="organization-label">{t("formOrganizationSelect.selectOrganization")}</SelectLabel>
          {organizations.map((organization) => (
            <SelectItem
              key={organization.id}
              value={organization.id}
              data-testid={`organization-dropdown-item-${organization.slug}`}>
              {organization.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
