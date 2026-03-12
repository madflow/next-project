import { NextResponse } from "next/server";
import { addContentToVariableset, getContents, removeContentFromVariableset } from "@/dal/dataset-variableset";
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
    const contents = await getContents(id);
    return NextResponse.json({ contents });
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Variableset ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { contentType, referenceId, attributes } = body;

    if (!contentType || !referenceId) {
      return NextResponse.json({ error: "contentType and referenceId are required" }, { status: 400 });
    }

    if (contentType !== "variable" && contentType !== "subset") {
      return NextResponse.json({ error: "contentType must be 'variable' or 'subset'" }, { status: 400 });
    }

    const created = await addContentToVariableset(id, contentType, referenceId, attributes);
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Variableset ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { contentId } = body;

    if (!contentId) {
      return NextResponse.json({ error: "contentId is required" }, { status: 400 });
    }

    await removeContentFromVariableset(id, contentId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
