import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { columns } from "@/components/admin/user/columns";
import { UsersDataTable } from "@/components/admin/user/data-table";
import { PageLayout } from "@/components/page/page-layout";
import { Button } from "@/components/ui/button";

export default async function AdminUsersPage() {
  const t = await getTranslations("user");

  return (
    <PageLayout title={t("title")} description={t("description")} data-testid="admin.users.page">
      <Button
        data-testid="admin.users.create.button"
        className="self-start"
        nativeButton={false}
        render={<Link href="/admin/users/new" />}>
        {t("createButton")}
      </Button>
      <UsersDataTable columns={columns} />
    </PageLayout>
  );
}
