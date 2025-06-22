import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AddMemberForm } from "@/components/admin/organization-members/add-member";
import { PageLayout } from "@/components/page/page-layout";
import { find } from "@/dal/organization";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrganisationUserAddPage({ params }: PageProps) {
  const { id } = await params;
  const organization = await find(id);

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
