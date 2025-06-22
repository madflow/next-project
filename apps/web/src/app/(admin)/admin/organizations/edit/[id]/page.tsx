import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EditOrganizationForm } from "@/components/admin/organization/edit-organization-form";
import { PageLayout } from "@/components/page/page-layout";
import { find } from "@/dal/organization";

type EditOrganizationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditOrganizationPage({ params }: EditOrganizationPageProps) {
  const { id } = await params;
  const organization = await find(id);

  if (!organization) {
    notFound();
  }

  const t = await getTranslations("organization");

  return (
    <PageLayout title={t("edit.title")} description={t("edit.description")} data-testid="admin.organizations.edit.page">
      <EditOrganizationForm organization={organization} />
    </PageLayout>
  );
}
