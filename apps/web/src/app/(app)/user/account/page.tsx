import { getTranslations } from "next-intl/server";
import { AvatarUpload } from "@/components/account/avatar-upload";
import { DeleteAccountSection } from "@/components/account/delete-account-section";
import { UpdateEmailForm } from "@/components/account/update-email-form";
import { UpdatePasswordForm } from "@/components/account/update-password-form";
import { UpdateProfileForm } from "@/components/account/update-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountPage() {
  const t = await getTranslations();

  return (
    <div className="w-full max-w-4xl px-4 pt-4 pb-8 sm:px-6 lg:px-8" data-testid="app.user.account.page">
      <div className="space-y-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("account.title")}</h1>

        <div className="space-y-6">
          {/* Avatar Upload Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("account.profile.avatar.title")}</CardTitle>
              <CardDescription>{t("account.profile.avatar.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AvatarUpload />
            </CardContent>
          </Card>

          {/* Name Update Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("account.profile.nameTitle")}</CardTitle>
              <CardDescription>{t("account.profile.nameDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <UpdateProfileForm />
            </CardContent>
          </Card>

          {/* Email Update Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("account.profile.emailTitle")}</CardTitle>
              <CardDescription>{t("account.profile.emailDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <UpdateEmailForm />
            </CardContent>
          </Card>

          {/* Password Update Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("account.password.title")}</CardTitle>
              <CardDescription>{t("account.password.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <UpdatePasswordForm />
            </CardContent>
          </Card>

          {/* Delete Account Section */}
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}
