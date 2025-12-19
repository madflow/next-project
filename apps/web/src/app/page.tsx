import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserWithContext } from "@/dal/user";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/auth/login");
  } else {
    const userWithContext = await getUserWithContext();

    const data = userWithContext.success ? userWithContext.data : null;

    if (!data) {
      redirect("/auth/login");
    }

    if (data.organizationCount === 1) {
      const firstOrg = data.organizations[0];
      if (firstOrg?.projects.length === 1) {
        const firstProject = firstOrg.projects[0] ?? null;
        if (firstProject) {
          redirect(`/project/${firstProject.slug}/adhoc`);
        }
      }
    }

    redirect("/landing");
  }
}
