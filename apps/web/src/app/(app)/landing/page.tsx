import { Inbox } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page/page-layout";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const t = await getTranslations("pageLanding");
  return (
    <PageLayout data-testid="app.landing.page">
      <Empty className="items-start justify-start">
        <EmptyHeader className="items-start text-start">
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </PageLayout>
  );
}
