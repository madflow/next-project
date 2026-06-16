import "server-only";
import { getActiveOrganizationId, getSession } from "@/lib/auth/session";
import type { AuthOrganization } from "@/lib/auth/types";
import { type Project } from "@/types/project";
import { isNotFoundAPIError } from "./api-errors";
import { getServerAPIClient } from "./server-api-client";

type InitialAppContext = {
  organization: AuthOrganization | null;
  project: Project | null;
};

/**
 * Gets the initial organization and project context from the server side.
 * This is used to avoid race conditions on first load by providing the
 * active organization and project to client components before hydration.
 */
export async function getInitialAppContext(projectSlug?: string): Promise<InitialAppContext> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { organization: null, project: null };
    }

    const activeOrganizationId = getActiveOrganizationId(session.session);

    if (!activeOrganizationId) {
      return { organization: null, project: null };
    }

    const api = await getServerAPIClient();

    let org;

    try {
      org = await api.organization.get({ id: activeOrganizationId });
    } catch (error) {
      if (isNotFoundAPIError(error)) {
        return { organization: null, project: null };
      }

      throw error;
    }

    if (!org) {
      return { organization: null, project: null };
    }

    const organization: AuthOrganization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo ?? null,
      createdAt: org.createdAt,
      metadata: org.metadata ?? null,
    };

    let project: Project | null = null;
    if (projectSlug) {
      const projects = await api.project.list({
        limit: "1",
        organizationId: activeOrganizationId,
        slug: projectSlug,
      });
      const proj = projects.rows[0] ?? null;

      if (proj && proj.organizationId === activeOrganizationId) {
        project = proj;
      }
    }

    return { organization, project };
  } catch (error) {
    console.error("Error getting initial app context:", error);
    return { organization: null, project: null };
  }
}
