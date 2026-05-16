import { implement } from "@orpc/server";
import { organization as organizationSchema } from "@repo/database/schema";
import { contract } from "../../contract/organization";
import type { Context } from "../context";

const os = implement(contract).$context<Context>();

const list = os.list.handler(async ({ context, input }) => {
  const { db } = context;

  const { limit, offset } = input;

  const rows = await db.select().from(organizationSchema).limit(limit).offset(offset).execute();

  return rows;
});

export const organization = {
  list,
};
