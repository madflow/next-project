import { LoginForm } from "./form";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center" data-testid="auth.login.page">
      <div className="w-md">
        <LoginForm />
      </div>
    </main>
  );
}
