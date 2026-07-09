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
import { User } from "@/types/user";

type InfoUserModalProps = {
  user: User;
};
export const InfoUserModal = ({ user }: InfoUserModalProps) => {
  const t = useTranslations("adminUserInfoModal");
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="cursor-pointer" />}>
        <InfoIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Code scrollAreaClassName="max-h-[60vh]">{JSON.stringify(user, null, 2)}</Code>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t("close")}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
