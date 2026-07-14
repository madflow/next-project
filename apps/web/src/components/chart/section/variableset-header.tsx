import type { VariablesetTreeNode } from "@/types/dataset-variableset";

type VariablesetHeaderProps = {
  variableset: VariablesetTreeNode;
};

export function VariablesetHeader({ variableset }: VariablesetHeaderProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{variableset.name}</h2>
      {variableset.description && <p className="text-muted-foreground mt-1 text-sm">{variableset.description}</p>}
    </div>
  );
}
