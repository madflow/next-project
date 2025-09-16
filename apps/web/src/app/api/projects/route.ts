import { NextResponse } from "next/server";
import { listWithOrganization } from "@/dal/project";
import { raiseExceptionResponse } from "@/lib/exception";
import { processUrlParams } from "../handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { limit, offset, search, orderBy, filters } = processUrlParams(new URL(request.url).searchParams);

    const result = await listWithOrganization({
      limit,
      offset,
      search,
      searchColumns: ["name", "slug"],
      orderBy,
      filters,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
