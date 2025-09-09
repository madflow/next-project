"use client";

import { FolderIcon, VariableIcon } from "lucide-react";
import type { DatasetVariable } from "@/types/dataset-variable";
import type { VariablesetTreeNode } from "@/types/dataset-variableset";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";

type VariablesetDescriptionProps = {
  variableset: VariablesetTreeNode;
  variables?: DatasetVariable[];
};

export function VariablesetDescription({ variableset, variables }: VariablesetDescriptionProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="px-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderIcon className="h-4 w-4" />
          <span>{variableset.name}</span>
          <span className="text-muted-foreground text-sm font-normal">
            {"("}
            {variableset.variableCount}
            {" variables)"}
          </span>
        </CardTitle>
        {variableset.description && <p className="text-muted-foreground text-sm">{variableset.description}</p>}
      </CardHeader>

      {variables && variables.length > 0 && (
        <CardContent className="px-3 pt-0">
          <h4 className="mb-2 text-sm font-medium">{"Variables in this set:"}</h4>

          <ScrollArea className="flex max-h-[500px] min-h-[300px] flex-col gap-2">
            <div className="space-y-1">
              {variables.map((variable) => (
                <div key={variable.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{variable.label}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}

