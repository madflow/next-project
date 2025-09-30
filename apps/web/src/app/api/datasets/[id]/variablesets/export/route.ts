import { NextResponse } from "next/server";
import { assertAccess, find } from "@/dal/dataset";
import { exportVariableSets } from "@/dal/dataset-variableset-export";
import { raiseExceptionResponse } from "@/lib/exception";
import { assertUserIsAdmin } from "@/lib/dal";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    // Ensure only admin users can export variable sets
    await assertUserIsAdmin();
    await assertAccess(id);
    const dataset = await find(id);

    if (!dataset) {
      return new NextResponse("Dataset not found", { status: 404 });
    }

    const exportData = await exportVariableSets(id);
    
    // Generate filename with dataset name and current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `dataset-${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}-variablesets-${date}.json`;

    // Return JSON file as download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in variableset export:", error);
    return raiseExceptionResponse(error);
  }
}