import { NextResponse } from "next/server";
import { getVariablesInSet } from "@/dal/dataset-variableset";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Variableset ID is required" }, { status: 400 });
  }

  try {
    const result = await getVariablesInSet(id, {
      limit: 1000, // Get all variables in the set
      orderBy: [{ column: "name", direction: "asc" }],
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}