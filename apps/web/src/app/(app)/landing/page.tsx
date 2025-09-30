import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page/page-layout";
import { LandingDashboard } from "@/components/landing-dashboard";

export default async function Dashboard() {
  const t = await getTranslations("pageLanding");
  return (
    <PageLayout data-testid="app.landing.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>
      <LandingDashboard />
    </PageLayout>
  );
}
