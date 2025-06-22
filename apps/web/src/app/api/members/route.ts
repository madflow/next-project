import { NextResponse } from "next/server";
import { listWithUser } from "@/dal/member";
import { raiseExceptionResponse } from "@/lib/exception";
import { processUrlParams } from "../handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { limit, offset, search, orderBy, filters } = processUrlParams(new URL(request.url).searchParams);
    const result = await listWithUser({
      limit,
      offset,
      search,
      searchColumns: ["name", "email"],
      orderBy,
      filters,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
