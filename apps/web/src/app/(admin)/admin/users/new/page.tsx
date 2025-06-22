import { getTranslations } from "next-intl/server";
import { CreateUserForm } from "@/components/admin/user/create-user-form";
import { PageLayout } from "@/components/page/page-layout";

export default async function NewUserPage() {
  const t = await getTranslations("user.newUser");

  return (
    <PageLayout title={t("title")} description={t("description")} data-testid="admin.users.new.page">
      <CreateUserForm />
    </PageLayout>
  );
}
