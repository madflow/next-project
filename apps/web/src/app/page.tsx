import { redirect } from "next/navigation";
import { getServerAPIClient } from "@/lib/server-api-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const api = await getServerAPIClient();
  const currentUser = await api.currentuser.get({});

  if (!currentUser) {
    redirect("/auth/login");
  } else {
    const organizations = await api.currentuser.organizations.list({});

    if (organizations.length === 1) {
      const firstOrg = organizations[0];
      if (firstOrg) {
        const projects = await api.organization.projects.list({ id: firstOrg.id, limit: "2", offset: "0" });
        const firstProject = projects.rows[0] ?? null;

        if (projects.count === 1 && firstProject) {
          redirect(`/project/${firstProject.slug}/adhoc`);
        }
      }
    }

    redirect("/landing");
  }
}
