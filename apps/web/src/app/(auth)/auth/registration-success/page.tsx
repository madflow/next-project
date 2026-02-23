import { RegistrationSuccessCard } from "./card";

export default function Page() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      data-testid="auth.registration-success.page">
      <div className="w-full max-w-md">
        <RegistrationSuccessCard />
      </div>
    </main>
  );
}
