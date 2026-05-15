import { implement } from "@orpc/server";
import { eq } from "drizzle-orm";
import { member, organization, user as userTable } from "@repo/database/schema";
import { appContract } from "../../../shared/contract/app";
import { type ProcedureContextInput, call, toProcedureContext } from "../../base";
import type { Context } from "../../context";

type CurrentUser = {
  email: string;
  emailVerified: boolean;
  id: string;
  image: string | null;
  locale: string | null;
  name: string;
  role: string | null;
};

const currentuserApi = implement(appContract).$context<Context>().currentuser;

export async function getCurrentUser(context: ProcedureContextInput) {
  const procedureContext = toProcedureContext(context);

  if (procedureContext.principal.kind === "anonymous") {
    return null;
  }

  return call(get, {}, { context: procedureContext });
}

export async function listCurrentUserOrganizations(context: ProcedureContextInput) {
  const procedureContext = toProcedureContext(context);

  if (procedureContext.principal.kind === "anonymous") {
    return [];
  }

  return call(organizationsList, {}, { context: procedureContext });
}

const get = currentuserApi.get.handler(async ({ context }): Promise<CurrentUser | null> => {
  if (context.principal.kind === "anonymous") {
    return null;
  }

  const [user] = await context.db
    .select({
      email: userTable.email,
      emailVerified: userTable.emailVerified,
      id: userTable.id,
      image: userTable.image,
      locale: userTable.locale,
      name: userTable.name,
      role: userTable.role,
    })
    .from(userTable)
    .where(eq(userTable.id, context.principal.user.id))
    .limit(1);

  return user ?? null;
});

const organizationsList = currentuserApi.organizations.list.handler(async ({ context }) => {
  if (context.principal.kind === "anonymous") {
    return [];
  }

  const organizations = await context.db
    .select({
      organization,
    })
    .from(organization)
    .innerJoin(member, eq(member.organizationId, organization.id))
    .where(eq(member.userId, context.principal.user.id));

  return organizations.map((entry) => entry.organization);
});

export const currentuser = {
  get,
  organizations: {
    list: organizationsList,
  },
};
