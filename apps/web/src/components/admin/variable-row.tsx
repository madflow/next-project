import { type ComponentProps, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item";
import { cn } from "@/lib/utils";

type AdminVariableRowProps = Omit<ComponentProps<typeof Item>, "children" | "role" | "size"> & {
  actions?: ReactNode;
  children?: ReactNode;
  label?: string | null;
  measure?: string | null;
  variableName?: string | null;
  variableType?: string | null;
};

export function AdminVariableRow({
  actions,
  children,
  className,
  label,
  measure,
  variableName,
  variableType,
  ...props
}: AdminVariableRowProps) {
  return (
    <Item role="listitem" size="sm" className={cn("items-start gap-2 p-2", className)} {...props}>
      {actions ? <ItemActions className="items-start">{actions}</ItemActions> : null}
      <ItemContent className="min-w-0 overflow-hidden">
        {label ? <ItemTitle className="mb-1 w-full break-words">{label}</ItemTitle> : null}
        <p className="text-muted-foreground mb-1 truncate text-xs">{variableName}</p>
        {measure || variableType ? (
          <div className="flex flex-wrap gap-1">
            {measure ? (
              <Badge variant="outline" className="shrink-0 text-xs">
                {measure}
              </Badge>
            ) : null}
            {variableType ? (
              <Badge variant="outline" className="shrink-0 text-xs">
                {variableType}
              </Badge>
            ) : null}
          </div>
        ) : null}
        {children}
      </ItemContent>
    </Item>
  );
}
