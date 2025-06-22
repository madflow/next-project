import { NextResponse } from "next/server";
import { find } from "@/dal/user";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const entity = await find(id);
    return NextResponse.json(entity);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
