import { ArrowBigDownIcon, ArrowRightCircle } from "lucide-react";
import { useState } from "react";
import { useDatasetVariables } from "@/hooks/use-dataset-variables";
import { DatasetVariable } from "@/types/dataset-variable";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

type AdHocAnalysisProps = {
  datasetId: string;
  onAddVariable: (variable: DatasetVariable) => void;
};

export function AdHocVariables({ datasetId, onAddVariable }: AdHocAnalysisProps) {
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const { data } = useDatasetVariables(datasetId, {
    limit: perPage,
    order: [{ column: "name", direction: "asc" }],
    filters: [{ column: "type", value: "double", operator: "eq" }],
    search,
  });

  function handleSearch(value: string) {
    setSearch(value);
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="px-3">
        <Input type="text" placeholder="Search..." onChange={(e) => handleSearch(e.target.value)} value={search} />
      </CardHeader>
      <CardContent className="px-3">
        <ScrollArea className="flex max-h-[400px] min-h-[300px] flex-col gap-2">
          {data &&
            data.rows.map((variable) => (
              <div key={variable.id} className="flex items-center gap-2 py-1 text-sm">
                <Button variant={"ghost"} className="h-4 w-4 p-0" onClick={() => onAddVariable(variable)}>
                  <ArrowRightCircle />
                </Button>
                <span className="text-sm">
                  {variable.label} {"("}
                  {variable.name}
                  {")"}
                </span>
              </div>
            ))}
        </ScrollArea>
      </CardContent>
      <CardFooter className="px-3">
        <Button variant={"outline"} className="w-full" onClick={() => setPerPage(perPage + 10)}>
          <ArrowBigDownIcon />
        </Button>
      </CardFooter>
    </Card>
  );
}
