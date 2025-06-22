import { SignUpForm } from "./form";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center" data-testid="auth.sign-up.page">
      <div className="w-md">
        <SignUpForm />
      </div>
    </main>
  );
}
