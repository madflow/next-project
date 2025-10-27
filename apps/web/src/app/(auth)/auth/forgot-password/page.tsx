import { ForgotPasswordForm } from "./form";

export default function Page() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      data-testid="auth.forgot-password.page">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
