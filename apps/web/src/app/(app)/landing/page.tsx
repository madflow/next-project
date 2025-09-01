import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page/page-layout";

export default async function Dashboard() {
  const t = await getTranslations("pageLanding");
  return <PageLayout data-testid="app.landing.page">{t("title")}</PageLayout>;
}
