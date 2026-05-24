import { NextResponse } from "next/server";
import { processUrlParams } from "@/app/api/handler";
import { hasAccess } from "@/dal/organization";
import { listAuthenticated } from "@/dal/project";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const check = await hasAccess(id);
    if (!check) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { limit, offset, search, orderBy, filters } = processUrlParams(new URL(request.url).searchParams);

    const filtersWithOrganizationId = [
      ...filters,
      {
        column: "organizationId",
        operator: "eq",
        value: id,
      },
    ];

    const result = await listAuthenticated({
      limit,
      offset,
      search,
      searchColumns: ["name", "slug"],
      orderBy,
      filters: filtersWithOrganizationId,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
