import { NextResponse } from "next/server";
import { list } from "@/dal/project";
import { raiseExceptionResponse } from "@/lib/exception";
import { processUrlParams } from "@/app/api/handler";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const { limit, offset, search, orderBy } = processUrlParams(
      new URL(request.url).searchParams
    );

    const result = await list({
      limit,
      offset,
      search,
      searchColumns: ["name", "slug"],
      orderBy,
      filters: [
        {
          column: "organizationId",
          operator: "eq",
          value: id,
        },
      ],
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
