import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Code } from "@repo/ui/components/code";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { DatasetVariable } from "@/types/dataset-variable";

type InfoDatasetVariableModalProps = {
  datasetVariable: DatasetVariable;
};

export const InfoDatasetVariableModal = ({ datasetVariable }: InfoDatasetVariableModalProps) => {
  const t = useTranslations("adminDatasetInfoModal");
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="cursor-pointer" />}>
        <InfoIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>{datasetVariable.name}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Code scrollAreaClassName="max-h-[60vh]">{JSON.stringify(datasetVariable, null, 2)}</Code>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t("buttons.close")}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
