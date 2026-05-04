"use client"

import { Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

export function PasswordInput(props: React.ComponentProps<typeof InputGroupInput>) {
  const t = useTranslations("ui.passwordInput")
  const [isVisible, setIsVisible] = useState(false)

  return (
    <InputGroup>
      <InputGroupInput {...props} type={isVisible ? "text" : "password"} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? t("hide") : t("show")}
        >
          {isVisible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
