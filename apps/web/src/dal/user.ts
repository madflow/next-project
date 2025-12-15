import "server-only";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  user as entity,
  member,
  organization,
  selectOrganizationSchema,
  selectUserSchema,
} from "@repo/database/schema";
import { createFind, createList, getAuthenticatedClient, getSessionUser, withAdminCheck } from "@/lib/dal";
import { DalNotAuthorizedException } from "@/lib/exception";

export const find = withAdminCheck(createFind(entity, selectUserSchema));
export const list = withAdminCheck(createList(entity, selectUserSchema));

// Schema for dataset in the tree
export const datasetSchema = z.object({
  id: z.uuid({ version: "v7" }),
  name: z.string(),
});

// Schema for project in the tree
export const projectSchema = z.object({
  id: z.uuid({ version: "v7" }),
  name: z.string(),
  slug: z.string(),
  datasets: z.array(datasetSchema),
});

// Schema for organization in the tree
export const organizationSchema = z.object({
  id: z.uuid({ version: "v7" }),
  name: z.string(),
  slug: z.string(),
  projects: z.array(projectSchema),
});

// Schema for user details
export const userDetailsSchema = z.object({
  id: z.uuid({ version: "v7" }),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  locale: z.string().nullable(),
});

// Main result schema
export const userContextSchema = z.object({
  user: userDetailsSchema,
  isAdmin: z.boolean(),
  organizationCount: z.number().int().nonnegative(),
  organizations: z.array(organizationSchema),
});

// Type exports
export type Dataset = z.infer<typeof datasetSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type UserDetails = z.infer<typeof userDetailsSchema>;
export type UserContext = z.infer<typeof userContextSchema>;

export const getUserWithContext = async (): Promise<
  { success: true; data: UserContext } | { success: false; error: z.ZodError }
> => {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      throw new DalNotAuthorizedException("User is not authenticated");
    }

    const userId = sessionUser.id;

    const db = await getAuthenticatedClient();

    const result = await db.execute(sql`
      WITH 
      -- CTE 1: Get user details (safe for frontend)
      user_info AS (
        SELECT 
          id,
          name,
          email,
          email_verified,
          image,
          role,
          locale,
          created_at,
          updated_at
        FROM users
        WHERE id = ${userId}
      ),
      
      -- CTE 2: Check if user is admin
      user_admin_check AS (
        SELECT 
          id,
          CASE WHEN role = 'admin' THEN true ELSE false END as is_admin
        FROM user_info
      ),
      
      -- CTE 3: Count organizations
      org_count AS (
        SELECT COUNT(DISTINCT organization_id) as organization_count
        FROM members
        WHERE user_id = ${userId}
      ),
      
      -- CTE 4: Get user's organizations
      user_orgs AS (
        SELECT DISTINCT
          o.id as org_id,
          o.name as org_name,
          o.slug as org_slug
        FROM members m
        INNER JOIN organizations o ON m.organization_id = o.id
        WHERE m.user_id = ${userId}
      ),
      
      -- CTE 5: Get projects for user's organizations
      org_projects AS (
        SELECT 
          p.id as project_id,
          p.name as project_name,
          p.slug as project_slug,
          p.organization_id as org_id
        FROM projects p
        INNER JOIN user_orgs uo ON p.organization_id = uo.org_id
      ),
      
      -- CTE 6: Get datasets for projects
      project_datasets AS (
        SELECT 
          dp.project_id,
          d.id as dataset_id,
          d.name as dataset_name
        FROM dataset_projects dp
        INNER JOIN datasets d ON dp.dataset_id = d.id
        INNER JOIN org_projects op ON dp.project_id = op.project_id
      ),
      
      -- CTE 7: Aggregate datasets by project
      projects_with_datasets AS (
        SELECT 
          op.project_id,
          op.project_name,
          op.project_slug,
          op.org_id,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pd.dataset_id,
                'name', pd.dataset_name
              ) ORDER BY pd.dataset_name
            ) FILTER (WHERE pd.dataset_id IS NOT NULL),
            '[]'::json
          ) as datasets
        FROM org_projects op
        LEFT JOIN project_datasets pd ON op.project_id = pd.project_id
        GROUP BY op.project_id, op.project_name, op.project_slug, op.org_id
      ),
      
      -- CTE 8: Aggregate projects by organization
      orgs_with_projects AS (
        SELECT 
          uo.org_id,
          uo.org_name,
          uo.org_slug,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pwd.project_id,
                'name', pwd.project_name,
                'slug', pwd.project_slug,
                'datasets', pwd.datasets
              ) ORDER BY pwd.project_name
            ) FILTER (WHERE pwd.project_id IS NOT NULL),
            '[]'::json
          ) as projects
        FROM user_orgs uo
        LEFT JOIN projects_with_datasets pwd ON uo.org_id = pwd.org_id
        GROUP BY uo.org_id, uo.org_name, uo.org_slug
      ),
      
      -- CTE 9: Build final organizations tree
      organizations_tree AS (
        SELECT 
          json_agg(
            json_build_object(
              'id', org_id,
              'name', org_name,
              'slug', org_slug,
              'projects', projects
            ) ORDER BY org_name
          ) as organizations
        FROM orgs_with_projects
      )
      
      -- Final SELECT: Combine all CTEs
      SELECT 
        json_build_object(
          'user', json_build_object(
            'id', ui.id,
            'name', ui.name,
            'email', ui.email,
            'emailVerified', ui.email_verified,
            'image', ui.image,
            'role', ui.role,
            'locale', ui.locale,
            'createdAt', ui.created_at,
            'updatedAt', ui.updated_at
          ),
          'isAdmin', uac.is_admin,
          'organizationCount', oc.organization_count,
          'organizations', COALESCE(ot.organizations, '[]'::json)
        ) as result
      FROM user_info ui
      CROSS JOIN user_admin_check uac
      CROSS JOIN org_count oc
      LEFT JOIN organizations_tree ot ON true
    `);

    const userRow = result.rows[0] ?? null;

    if (!userRow || !userRow.result) {
      return {
        success: false,
        error: new z.ZodError([
          {
            code: "custom",
            path: [],
            message: "User not found",
          },
        ]),
      };
    }

    const parsed = userContextSchema.safeParse(userRow.result);

    if (parsed.success) {
      return { success: true, data: parsed.data };
    } else {
      return { success: false, error: parsed.error };
    }
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          path: [],
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
      ]),
    };
  }
};

export async function getCurrentUser(): Promise<UserDetails | null> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return null;
  }
  const db = await getAuthenticatedClient();
  const [user] = await db.select().from(entity).where(eq(entity.id, sessionUser.id)).limit(1);
  if (!user) {
    return null;
  }

  const parsed = userDetailsSchema.safeParse({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    role: user.role,
    locale: user.locale,
  });

  if (parsed.success) {
    return parsed.data;
  } else {
    return null;
  }
}

export async function getCurrentUserOrganizations(): Promise<z.infer<typeof selectOrganizationSchema>[]> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return [];
  }

  const userId = sessionUser.id;

  const db = await getAuthenticatedClient();

  const userOrganizations = await db
    .select({ organizations: organization })
    .from(organization)
    .innerJoin(member, eq(member.organizationId, organization.id))
    .innerJoin(entity, eq(member.userId, entity.id))
    .where(eq(member.userId, userId));

  return userOrganizations.map((uo) => {
    return uo.organizations;
  });
}
