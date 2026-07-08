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
import type { DatasetWithEmbeddedOrganization } from "@/types/dataset";

type InfoDatasetModalProps = {
  dataset: DatasetWithEmbeddedOrganization;
};
export const InfoDatasetModal = ({ dataset }: InfoDatasetModalProps) => {
  const t = useTranslations("adminDatasetInfoModal");
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="cursor-pointer" />}>
        <InfoIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>{dataset.name}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Code scrollAreaClassName="max-h-[60vh]">{JSON.stringify(dataset, null, 2)}</Code>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t("buttons.close")}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
