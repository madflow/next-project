import { oc } from "@orpc/contract";
import { z } from "zod";
import { selectOrganizationSchema } from "@repo/database/schema";

const emptyInputSchema = z.object({});

const currentUserSchema = z.object({
  email: z.email(),
  emailVerified: z.boolean(),
  id: z.uuid(),
  image: z.string().nullable(),
  locale: z.string().nullable(),
  name: z.string(),
  role: z.string().nullable(),
});

const getCurrentUserContract = oc.input(emptyInputSchema).output(currentUserSchema.nullable()).route({
  method: "GET",
  path: "/currentuser",
});

const listCurrentUserOrganizationsContract = oc
  .input(emptyInputSchema)
  .output(z.array(selectOrganizationSchema))
  .route({
    method: "GET",
    path: "/currentuser/organizations",
  });

export const currentuserContract = {
  get: getCurrentUserContract,
  organizations: {
    list: listCurrentUserOrganizationsContract,
  },
};
