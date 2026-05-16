import { oc } from "@orpc/contract";
import { z } from "zod";
import { selectOrganizationSchema } from "@repo/database/schema";
import { listInputSchema } from "./query";

const listOrganizationContract = oc.input(listInputSchema).output(z.array(selectOrganizationSchema));

export const contract = {
  list: listOrganizationContract,
};
