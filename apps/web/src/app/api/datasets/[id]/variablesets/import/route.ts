import { NextResponse } from "next/server";
import { assertAccess } from "@/dal/dataset";
import { importVariableSets } from "@/dal/dataset-variableset-export";
import { raiseExceptionResponse } from "@/lib/exception";
import { assertUserIsAdmin } from "@/lib/dal";
import { VariableSetExportFileSchema, VariableSetImportOptionsSchema } from "@/types/dataset-variableset-export";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    // Ensure only admin users can import variable sets
    await assertUserIsAdmin();
    await assertAccess(id);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const optionsJson = formData.get("options") as string;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes("json") && !file.name.endsWith(".json")) {
      return NextResponse.json({ error: "File must be a JSON file" }, { status: 400 });
    }

    // Parse import options
    let options;
    try {
      const parsedOptions = optionsJson ? JSON.parse(optionsJson) : {};
      options = VariableSetImportOptionsSchema.parse(parsedOptions);
    } catch {
      return NextResponse.json({ error: "Invalid import options" }, { status: 400 });
    }

    // Read and parse file content
    let importData;
    try {
      const fileContent = await file.text();
      const parsedContent = JSON.parse(fileContent);
      importData = VariableSetExportFileSchema.parse(parsedContent);
    } catch {
      return NextResponse.json({ 
        error: "Invalid file format. Please upload a valid variable sets export file." 
      }, { status: 400 });
    }

    // Perform import
    const result = await importVariableSets(id, importData, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in variableset import:", error);
    return raiseExceptionResponse(error);
  }
}