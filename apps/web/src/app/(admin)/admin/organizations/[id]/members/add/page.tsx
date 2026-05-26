import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AddMemberForm } from "@/components/admin/organization-members/add-member";
import { PageLayout } from "@/components/page/page-layout";
import { isNotFoundAPIError } from "@/lib/api-errors";
import { getServerAPIClient } from "@/lib/server-api-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrganisationUserAddPage({ params }: PageProps) {
  const { id } = await params;
  const api = await getServerAPIClient();
  let organization;

  try {
    organization = await api.organization.get({ id });
  } catch (error) {
    if (isNotFoundAPIError(error)) {
      notFound();
    }

    throw error;
  }

  if (!organization) {
    notFound();
  }

  const t = await getTranslations("organizationMembers");

  return (
    <PageLayout
      title={t("add.title")}
      description={t("add.description")}
      data-test-id="app.organization-members.add.page">
      <AddMemberForm organizationId={id} />
    </PageLayout>
  );
}
