import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EditUserForm } from "@/components/admin/user/edit-user-form";
import { PageLayout } from "@/components/page/page-layout";
import { find } from "@/dal/user";

type EditUserPageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  const user = await find(id);

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
