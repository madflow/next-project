import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { deleteDatafile, list } from "@/dal/datafile";
import { auth } from "@/lib/auth";
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

export async function DELETE(request: Request) {
  try {
    // Get the session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only allow admins to delete datafiles
    if (session.user.role !== "admin") {
      return new NextResponse("Forbidden: Admin access required", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing datafile ID", { status: 400 });
    }

    await deleteDatafile(id);

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error deleting datafile:", error);
    return raiseExceptionResponse(error);
  }
}
