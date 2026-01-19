"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getVariableLabel } from "@/lib/variable-helpers";
import { type DatasetVariable } from "@/types/dataset-variable";

interface UnsupportedChartPlaceholderProps {
  variableName: string;
  variableLabel?: string;
  variable?: DatasetVariable;
  reason?: string;
  className?: string;
  "data-testid"?: string;
}

export function UnsupportedChartPlaceholder({
  variableName,
  variableLabel,
  variable,
  reason,
  className,
  "data-testid": dataTestId,
}: UnsupportedChartPlaceholderProps) {
  // Determine the label to use
  const displayLabel = variable ? getVariableLabel(variable) : (variableLabel ?? variableName);

  return (
    <div className={className} data-testid={dataTestId}>
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>{displayLabel}</CardTitle>
          <CardDescription>{"Unsupported Chart Type"}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="text-muted-foreground h-12 w-12" data-testid="unsupported-icon" />
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-lg font-medium">{"Chart cannot be displayed"}</h3>
              {reason && (
                <p className="text-muted-foreground max-w-md text-sm" data-testid="unsupported-reason">
                  {reason}
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
