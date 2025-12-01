import "server-only";
import { Organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { defaultClient as db } from "@repo/database/clients";
import { organization as organizationTable, project as projectTable } from "@repo/database/schema";
import { auth } from "./auth";

export type InitialProject = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
};

export type InitialAppContext = {
  organization: Organization | null;
  project: InitialProject | null;
};

/**
 * Gets the initial organization and project context from the server side.
 * This is used to avoid race conditions on first load by providing the
 * active organization and project to client components before hydration.
 */
export async function getInitialAppContext(projectSlug?: string): Promise<InitialAppContext> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { organization: null, project: null };
    }

    // Get active organization from session
    const activeOrganizationId = session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      return { organization: null, project: null };
    }

    // Fetch organization details
    const [org] = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.id, activeOrganizationId))
      .limit(1);

    if (!org) {
      return { organization: null, project: null };
    }

    const organization: Organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo ?? null,
      createdAt: org.createdAt,
      metadata: org.metadata ?? null,
    };

    // If projectSlug is provided, fetch the project
    let project: InitialProject | null = null;
    if (projectSlug) {
      const [proj] = await db.select().from(projectTable).where(eq(projectTable.slug, projectSlug)).limit(1);

      if (proj && proj.organizationId === activeOrganizationId) {
        project = {
          id: proj.id,
          organizationId: proj.organizationId,
          name: proj.name,
          slug: proj.slug,
        };
      }
    }

    return { organization, project };
  } catch (error) {
    console.error("Error getting initial app context:", error);
    return { organization: null, project: null };
  }
}
