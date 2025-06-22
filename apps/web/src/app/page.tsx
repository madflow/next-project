import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-client";

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  } else {
    redirect("/dashboard");
  }
}
