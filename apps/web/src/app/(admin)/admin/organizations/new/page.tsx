import { getTranslations } from "next-intl/server";
import { CreateOrganizationForm } from "@/components/admin/organization/create-organization-form";
import { PageLayout } from "@/components/page/page-layout";

export default async function NewOrganizationPage() {
  const t = await getTranslations();
  return (
    <PageLayout
      title={t("organization.create.title")}
      description={t("organization.create.description")}
      data-testid="admin.organizations.new.page">
      <CreateOrganizationForm />
    </PageLayout>
  );
}
