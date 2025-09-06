import { NextResponse } from "next/server";
import { assertAccess } from "@/dal/dataset";
import { getUnassignedVariables, getVariablesInSet } from "@/dal/dataset-variableset";
import { raiseExceptionResponse } from "@/lib/exception";
import { processUrlParams } from "../../../../../handler";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
    setId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { id, setId } = await params;

  if (!id || !setId) {
    return NextResponse.json({ error: "Dataset ID and Set ID are required" }, { status: 400 });
  }

  try {
    await assertAccess(id);

    const url = new URL(request.url);
    const unassigned = url.searchParams.get("unassigned") === "true";

    if (unassigned) {
      // Return variables not assigned to any set
      const { limit, offset, search, orderBy, filters } = processUrlParams(url.searchParams);
      const result = await getUnassignedVariables(id, {
        filters,
        limit,
        offset,
        search,
        orderBy,
      });
      return NextResponse.json(result);
    } else {
      // Return variables in the specific set
      const { limit, offset, search, orderBy, filters } = processUrlParams(url.searchParams);
      const result = await getVariablesInSet(setId, {
        filters,
        limit,
        offset,
        search,
        orderBy,
      });
      return NextResponse.json(result);
    }
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
