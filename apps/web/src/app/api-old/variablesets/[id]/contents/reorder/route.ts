import { NextResponse } from "next/server";
import { assertUserIsAdmin } from "@/dal/dal";
import { assertVariablesetAccess, getContents, reorderContents } from "@/dal/dataset-variableset";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Variableset ID is required" }, { status: 400 });
  }

  try {
    await assertUserIsAdmin();
    await assertVariablesetAccess(id);

    const body = await request.json();
    const { contentIds } = body;

    if (!Array.isArray(contentIds)) {
      return NextResponse.json({ error: "contentIds must be an array" }, { status: 400 });
    }

    if (new Set(contentIds).size !== contentIds.length) {
      return NextResponse.json({ error: "contentIds must not contain duplicates" }, { status: 400 });
    }

    const existingContents = await getContents(id);
    const existingIds = new Set((existingContents ?? []).map((c) => c.id));

    if (contentIds.length !== existingIds.size || contentIds.some((cid) => !existingIds.has(cid))) {
      return NextResponse.json(
        { error: "contentIds must exactly match the existing content IDs for this variable set" },
        { status: 400 }
      );
    }

    const result = await reorderContents(id, contentIds);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
