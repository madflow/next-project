import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EditUserForm } from "@/components/admin/user/edit-user-form";
import { PageLayout } from "@/components/page/page-layout";
import { isNotFoundAPIError } from "@/lib/api-errors";
import { getServerAPIClient } from "@/lib/server-api-client";

type EditUserPageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  const api = await getServerAPIClient();
  let user;

  try {
    user = await api.user.get({ id });
  } catch (error) {
    if (isNotFoundAPIError(error)) {
      notFound();
    }

    throw error;
  }

  if (!user) {
    notFound();
  }

  const t = await getTranslations("user.editUser");

  return (
    <PageLayout title={t("title")} description={t("description")} data-testid="admin.users.edit.page">
      <EditUserForm user={user} />
    </PageLayout>
  );
}
