import { PlusIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useDatasetVariables } from "@/hooks/use-dataset-variables";
import { DatasetVariable } from "@/types/dataset-variable";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

type AdHocAnalysisProps = {
  datasetId: string;
  onAddVariable: (variable: DatasetVariable) => void;
};

export function AdHocVariables({ datasetId, onAddVariable }: AdHocAnalysisProps) {
  const { data, isError, isLoading, isFetching } = useDatasetVariables(datasetId);

  if (isFetching || isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error</div>;
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableBody>
            {data &&
              data.rows.map((variable) => (
                <TableRow key={variable.id}>
                  <TableCell className="flex items-center gap-2">
                    <Button onClick={() => onAddVariable(variable)} variant={"outline"}>
                      <PlusIcon />
                    </Button>
                    <span>
                      {variable.label} ({variable.name})
                    </span>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
