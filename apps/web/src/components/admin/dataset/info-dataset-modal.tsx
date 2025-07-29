
import { useTranslations } from "next-intl";
import { InfoIcon } from "lucide-react";
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
import { Dataset } from "@/types/dataset";

type InfoDatasetModalProps = {
  dataset: Dataset;
};
export const InfoDatasetModal = ({ dataset }: InfoDatasetModalProps) => {
  const t = useTranslations('adminDatasetInfoModal');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <InfoIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>{dataset.name}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Code>{JSON.stringify(dataset, null, 2)}</Code>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('buttons.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
