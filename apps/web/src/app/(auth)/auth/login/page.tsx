import { connection } from "next/server";
import { env } from "@/env";
import { LoginForm } from "./form";

export default async function Page() {
  await connection();
  const signUpDisabled = !!env.AUTH_DISABLE_SIGNUP;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4" data-testid="auth.login.page">
      <div className="w-full max-w-md">
        <LoginForm signUpDisabled={signUpDisabled} />
      </div>
    </main>
  );
}
