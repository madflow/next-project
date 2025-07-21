"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={t("editVariable.form.missingValues.placeholder")}
          type="number"
        />
        <Button type="button" onClick={handleAdd} size="icon" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input value={item} readOnly type="number" />
            <Button type="button" onClick={() => handleRemove(index)} size="icon" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
