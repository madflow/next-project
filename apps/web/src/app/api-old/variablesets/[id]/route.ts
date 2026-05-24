import { NextResponse } from "next/server";
import { assertUserIsAdmin } from "@/dal/dal";
import { assertVariablesetAccess, remove } from "@/dal/dataset-variableset";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await assertUserIsAdmin();
    await assertVariablesetAccess(id);

    await remove(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
