"use client"

import { SearchIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

type SearchInputProps = Omit<React.ComponentProps<typeof InputGroupInput>, "type"> & {
  onClear?: () => void
  clearButtonTestId?: string
}

export function SearchInput({
  value,
  onClear,
  clearButtonTestId,
  ...props
}: SearchInputProps) {
  const t = useTranslations("ui.searchInput")
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value)

  return (
    <InputGroup>
      <InputGroupInput {...props} type="text" value={value} />
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <SearchIcon />
        </InputGroupText>
      </InputGroupAddon>
      {hasValue && onClear ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClear}
            aria-label={t("clear")}
            data-testid={clearButtonTestId}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}
