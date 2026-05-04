"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

type TextArrayEditorProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function TextArrayEditor({ value, onChange }: TextArrayEditorProps) {
  const t = useTranslations("adminDatasetEditor");
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem) {
      onChange([...value, newItem]);
      setNewItem("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <InputGroup>
        <InputGroupInput
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={t("editVariable.form.missingValues.placeholder")}
          type="number"
          aria-label={t("editVariable.form.missingValues.placeholder")}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            onClick={handleAdd}
            size="icon-sm"
            variant="ghost"
            aria-label={t("common.add")}
          >
            <Plus className="h-4 w-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <div className="space-y-2">
        {value.map((item, index) => (
          <InputGroup key={index}>
            <InputGroupInput value={item} readOnly type="number" aria-label={item} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                onClick={() => handleRemove(index)}
                size="icon-sm"
                variant="ghost"
                aria-label={t("common.remove")}
              >
                <X className="h-4 w-4" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        ))}
      </div>
    </div>
  );
}
