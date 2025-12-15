import { NextResponse } from "next/server";
import { getCurrentUser } from "@/dal/user";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getCurrentUser();
    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
