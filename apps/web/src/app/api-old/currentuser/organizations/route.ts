import { NextResponse } from "next/server";
import { getCurrentUserOrganizations } from "@/dal/user";
import { raiseExceptionResponse } from "@/lib/exception";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getCurrentUserOrganizations();
    return NextResponse.json(result);
  } catch (error: unknown) {
    return raiseExceptionResponse(error);
  }
}
