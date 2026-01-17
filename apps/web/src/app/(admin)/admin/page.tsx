import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PageLayout } from "@/components/page/page-layout";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Page() {
  const t = await getTranslations("adminDashboard");

  return (
    <PageLayout title={t("title")} description={t("description")} data-testid="admin.page">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-between shadow-xs">
          <CardHeader>
            <CardTitle>{t("organizations.title")}</CardTitle>
            <CardDescription>{t("organizations.description")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/admin/organizations" className="underline underline-offset-4">
              {t("organizations.link")}
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col items-center justify-between shadow-xs">
          <CardHeader>
            <CardTitle>{t("users.title")}</CardTitle>
            <CardDescription>{t("users.description")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/admin/users" className="underline underline-offset-4">
              {t("users.link")}
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col items-center justify-between shadow-xs">
          <CardHeader>
            <CardTitle>{t("projects.title")}</CardTitle>
            <CardDescription>{t("projects.description")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/admin/projects" className="underline underline-offset-4">
              {t("projects.link")}
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col items-center justify-between shadow-xs">
          <CardHeader>
            <CardTitle>{t("datasets.title")}</CardTitle>
            <CardDescription>{t("datasets.description")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/admin/datasets" className="underline underline-offset-4">
              {t("datasets.link")}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
}
