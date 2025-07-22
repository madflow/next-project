import { auth } from "@/lib/auth";
import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default function Page() {
  const signUpDisabled = auth.options.emailAndPassword.disableSignUp;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center" data-testid="auth.login.page">
      <div className="w-md">
        <LoginForm signUpDisabled={signUpDisabled} />
      </div>
    </main>
  );
}
