---
name: xlsx-manipulation
description: Reads, creates, and edits Excel `.xlsx` and `.xlsm` workbooks with Python `openpyxl`, including sheets, cells, formulas, styles, and workbook structure. Use when the user mentions Excel automation, spreadsheet inspection, workbook generation, or programmatic `.xlsx` changes.
license: MIT
compatibility: opencode
metadata:
  audience: general
  language: python
---

# XLSX Manipulation

## When to use this skill

Use this skill for Excel workbook automation with `openpyxl`.
Prefer it when sheet structure, formulas, formatting, merged cells, filters, validation, or charts matter.
Do not use it for legacy `.xls` files.

## Usage

**DO NOT CREATE A NEW SCRIPT!** Use the pre-installed wrapper:

```bash
./xlsx-manipulation-skill.sh - <<'PY'
from openpyxl import Workbook
wb = Workbook()
ws = wb.active
ws["A1"] = "Name"
ws.append(["Ada"])
wb.save("output.xlsx")
PY
```

The wrapper runs Python from the skill-local virtual environment at `./venv/`.
If `./venv/` is missing, bootstrap it once:

```bash
cd /path/to/xlsx-manipulation && python3 -m venv venv && venv/bin/pip install -r requirements.txt
```

## Workflow

1. Confirm the file type and goal: inspect, transform, format, or generate.
2. For existing workbooks, inspect `wb.sheetnames`, target sheet titles, headers, formulas, merged ranges, and dimensions before editing.
3. Choose the right mode: `data_only=True` for cached formula results, `read_only=True` for large reads, `keep_vba=True` to preserve macros in `.xlsm`, `Workbook(write_only=True)` for large exports.
4. Make focused edits and save to a new path unless the user clearly wants in-place overwrite.
5. Reload the saved workbook and verify key sheets, cells, formulas, and formatting.

## Common patterns

```python
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation
wb = load_workbook("book.xlsx")
ws = wb["Sheet1"]
value = ws["A1"].value
rows = list(ws.iter_rows(min_row=2, max_row=5, values_only=True))
ws["B2"] = 42
ws["C2"] = "=B2*2"
ws.append(["Ada", 10, "=SUM(B2:B2)"])
ws.freeze_panes = "A2"
ws.auto_filter.ref = ws.dimensions
ws.row_dimensions[1].height = 24
ws.column_dimensions["A"].width = 18
ws["A1"].font = Font(bold=True)
ws["A1"].fill = PatternFill("solid", fgColor="D9EAD3")
ws["A1"].alignment = Alignment(horizontal="center")
dv = DataValidation(type="list", formula1='"Yes,No"', allow_blank=True)
ws.add_data_validation(dv)
dv.add("D2:D100")
wb.save("book.xlsx")
```

## Important caveats

- `openpyxl` preserves formulas but does not calculate them. Use `data_only=True` only when the workbook already has cached results.
- If the user needs fresh calculated values, recalculate the workbook in Excel, LibreOffice, or another engine after writing it.
- For `.xlsm`, use `load_workbook(..., keep_vba=True)` to preserve macros; `openpyxl` does not edit VBA code.
- `insert_rows()`, `insert_cols()`, `delete_rows()`, `delete_cols()`, and `move_range()` do not fully update dependent formulas, tables, charts, or named ranges.
- `move_range(..., translate=True)` only translates formulas in the moved cells.
- Merged ranges keep value and style on the top-left cell; style that cell, not the placeholders.
- `copy_worksheet()` only works within the same workbook, not in read-only or write-only mode, and does not copy images or charts.
- Write-only workbooks support `append()`-driven output and can be saved only once.

## Useful APIs

- `Workbook()`, `load_workbook()`, `wb.sheetnames`, `wb.create_sheet()`, `wb.remove()`, `wb.copy_worksheet()`
- `ws.cell()`, `ws["A1"]`, `ws.iter_rows()`, `ws.iter_cols()`, `ws.append()`, `ws.merge_cells()`, `ws.unmerge_cells()`
- `ws.freeze_panes`, `ws.auto_filter.ref`, `ws.add_data_validation()`, `ws.add_chart()`, `ws.add_table()`, `ws.add_image()`
