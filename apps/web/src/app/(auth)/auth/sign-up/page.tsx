import { notFound } from "next/navigation";
import { connection } from "next/server";
import { env } from "@/env";
import { SignUpForm } from "./form";

export default async function Page() {
  await connection();
  const signUpDisabled = !!env.AUTH_DISABLE_SIGNUP;

  if (signUpDisabled) {
    return notFound();
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4" data-testid="auth.sign-up.page">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </main>
  );
}
