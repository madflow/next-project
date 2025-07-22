import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignUpForm } from "./form";

export const dynamic = "force-dynamic";

export default function Page() {
  const signUpDisabled = auth.options.emailAndPassword.disableSignUp;

  if (signUpDisabled) {
    return notFound();
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center" data-testid="auth.sign-up.page">
      <div className="w-md">
        <SignUpForm />
      </div>
    </main>
  );
}
