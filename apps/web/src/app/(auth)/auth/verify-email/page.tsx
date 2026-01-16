import { VerifyEmailCard } from "./card";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4" data-testid="auth.verify-email.page">
      <div className="w-full max-w-md">
        <VerifyEmailCard />
      </div>
    </main>
  );
}
