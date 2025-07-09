import { NextResponse } from "next/server";
import { list } from "@/dal/dataset";
import { raiseExceptionResponse } from "@/lib/exception";
import { processUrlParams } from "../handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { limit, offset, search, orderBy } = processUrlParams(new URL(request.url).searchParams);

    const result = await list({
      limit,
      offset,
      search,
      searchColumns: ["name", "slug"],
      orderBy,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
