import { ResetPasswordForm } from "./form";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4" data-testid="auth.reset-password.page">
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </main>
  );
}
