import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useDatasetVariables } from "@/hooks/use-dataset-variables";
import { Card, CardContent } from "../ui/card";

type AdHocAnalysisProps = {
  datasetId: string;
};

export function AdHocVariables({ datasetId }: AdHocAnalysisProps) {
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
                  <TableCell>
                    {variable.label} ({variable.name})
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
