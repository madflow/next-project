import { implement } from "@orpc/server";
import { contract } from "../../contract/organization.js";

const os = implement({ organization: contract });

const list = os.organization.list.handler(({ input }) => {
  return [];
});

export const organization = {
  list,
};
