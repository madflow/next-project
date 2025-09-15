import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatasetVariable } from "@/types/dataset-variable";

type InfoDatasetVariableModalProps = {
  datasetVariable: DatasetVariable;
};

export const InfoDatasetVariableModal = ({ datasetVariable }: InfoDatasetVariableModalProps) => {
  const t = useTranslations("adminDatasetInfoModal");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          <InfoIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>{datasetVariable.name}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Code>{JSON.stringify(datasetVariable, null, 2)}</Code>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("buttons.close")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};