"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MissingRange = {
  lo: number;
  hi: number;
};

type MissingRangesEditorProps = {
  value: MissingRange[];
  onChange: (value: MissingRange[]) => void;
};

export function MissingRangesEditor({ value, onChange }: MissingRangesEditorProps) {
  const t = useTranslations("adminDatasetEditor");
  const [newLow, setNewLow] = useState("");
  const [newHigh, setNewHigh] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAdd = () => {
    if (newLow && newHigh) {
      const lo = parseFloat(newLow);
      const hi = parseFloat(newHigh);

      if (isNaN(lo) || isNaN(hi)) {
        setValidationError("Please enter valid numbers");
        return;
      }

      if (lo > hi) {
        setValidationError(t("editVariable.form.missingRanges.validation.lowGreaterThanHigh"));
        return;
      }

      onChange([...value, { lo, hi }]);
      setNewLow("");
      setNewHigh("");
      setValidationError(null);
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newLow}
            onChange={(e) => {
              setNewLow(e.target.value);
              setValidationError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder={t("editVariable.form.missingRanges.placeholder.low")}
            type="number"
            step="any"
          />
          <Input
            value={newHigh}
            onChange={(e) => {
              setNewHigh(e.target.value);
              setValidationError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder={t("editVariable.form.missingRanges.placeholder.high")}
            type="number"
            step="any"
          />
          <Button type="button" onClick={handleAdd} size="icon" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {validationError && <p className="text-sm text-red-600">{validationError}</p>}
      </div>
      <div className="space-y-2">
        {value.map((range, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input value={range.lo} readOnly type="number" />
            <span className="text-sm text-gray-500">{"-"}</span>
            <Input value={range.hi} readOnly type="number" />
            <Button type="button" onClick={() => handleRemove(index)} size="icon" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
