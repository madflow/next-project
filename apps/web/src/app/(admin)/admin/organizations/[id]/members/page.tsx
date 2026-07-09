import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { columns } from "@/components/admin/organization-members/columns";
import { OrganisationMembersDataTable } from "@/components/admin/organization-members/data-table";
import { PageLayout } from "@/components/page/page-layout";
import { isNotFoundAPIError } from "@/lib/api-errors";
import { getServerAPIClient } from "@/lib/server-api-client";

type OrganisationMembersPageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function OrganisationMembersPage({ params }: OrganisationMembersPageProps) {
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
      title={t("title", { name: organization.name })}
      description={t("description")}
      data-testid="admin.organization-members.page">
      <Button
        data-testid="admin.organizations.members.add.button"
        className="self-start"
        nativeButton={false}
        render={<Link href={`/admin/organizations/${id}/members/add`} />}>
        {t("addMember")}
      </Button>
      <OrganisationMembersDataTable columns={columns} organizationId={id} />
    </PageLayout>
  );
}
