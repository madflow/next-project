import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { columns } from "@/components/admin/organization/columns";
import { OrganizationsDataTable } from "@/components/admin/organization/data-table";
import { PageLayout } from "@/components/page/page-layout";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const t = await getTranslations("organization");

  return (
    <PageLayout title={t("title")} description={t("description")} data-testid="admin.organizations.page">
      <Button asChild data-testid="admin.organizations.create.button" className="self-start">
        <Link href="/admin/organizations/new">{t("createButton")}</Link>
      </Button>
      <OrganizationsDataTable columns={columns} />
    </PageLayout>
  );
}
