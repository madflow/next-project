import { NextResponse } from "next/server";
import { addSplitVariableAction, removeSplitVariableAction } from "@/actions/dataset-splitvariable";
import { assertAccess } from "@/dal/dataset";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
    variableId: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const { id, variableId } = await params;

  if (!id || !variableId) {
    return NextResponse.json({ error: "Dataset ID and Variable ID are required" }, { status: 400 });
  }

  try {
    await assertAccess(id);

    const created = await addSplitVariableAction(id, variableId);
    return NextResponse.json(created);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, variableId } = await params;

  if (!id || !variableId) {
    return NextResponse.json({ error: "Dataset ID and Variable ID are required" }, { status: 400 });
  }

  try {
    await assertAccess(id);

    await removeSplitVariableAction(id, variableId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}