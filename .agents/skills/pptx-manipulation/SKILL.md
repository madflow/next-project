---
name: pptx-manipulation
description: Reads, creates, and edits PowerPoint `.pptx` and `.pptm` presentations with `python-pptx`, including slides, layouts, placeholders, text, images, tables, charts, and notes. Use when the user mentions PowerPoint automation, slide deck inspection, presentation generation, or programmatic `.pptx` changes.
license: MIT
compatibility: opencode
metadata:
  audience: general
  language: python
---

# PPTX Manipulation

## When to use this skill

Use this skill for PowerPoint presentation automation with `python-pptx`.
Prefer it when slide layouts, placeholders, speaker notes, tables, charts, images, or deck structure matter.
Do not use it for legacy `.ppt` files.

## Usage

**DO NOT CREATE A NEW SCRIPT!** Use the pre-installed wrapper:

```bash
./pptx-manipulation-skill.sh - <<'PY'
from pptx import Presentation

prs = Presentation()
slide = prs.slides.add_slide(prs.slide_layouts[0])
slide.shapes.title.text = "Quarterly Update"
slide.placeholders[1].text = "python-pptx was here"
prs.save("output.pptx")
PY
```

The wrapper runs Python from the skill-local virtual environment at `./venv/`.
If `./venv/` is missing, bootstrap it once:

```bash
cd /path/to/pptx-manipulation && python3 -m venv venv && venv/bin/pip install -r requirements.txt
```

## Workflow

1. Confirm the file type and goal: inspect, transform, restyle, or generate.
2. For existing presentations, inspect slide count, layout names, placeholder `idx` values, titles, notes, and shapes before editing.
3. Choose the right approach: `Presentation()` for a new deck, `Presentation(path)` for an existing deck, layouts/placeholders for template-driven slides, and explicit shapes for fixed-position content.
4. Make focused edits and save to a new path unless the user clearly wants in-place overwrite.
5. Reload the saved presentation and verify slide count, titles, notes, placeholders, tables, charts, and media placement.

## Common patterns

```python
from pptx import Presentation
from pptx.chart.data import ChartData
from pptx.enum.chart import XL_CHART_TYPE
from pptx.util import Inches, Pt

prs = Presentation("deck.pptx")
slide = prs.slides[0]

if slide.shapes.title is not None:
    slide.shapes.title.text = "Quarterly Update"

body = slide.placeholders[1].text_frame
body.clear()
p = body.paragraphs[0]
p.text = "Revenue up 18%"
p.font.size = Pt(24)

slide.shapes.add_picture("logo.png", Inches(8.0), Inches(0.5), height=Inches(1.0))

table = slide.shapes.add_table(2, 2, Inches(0.7), Inches(4.5), Inches(4.8), Inches(1.0)).table
table.cell(0, 0).text = "Region"
table.cell(0, 1).text = "Sales"
table.cell(1, 0).text = "EMEA"
table.cell(1, 1).text = "$1.2M"

chart_data = ChartData()
chart_data.categories = ["Q1", "Q2", "Q3"]
chart_data.add_series("Revenue", (1.0, 1.3, 1.5))
chart = slide.shapes.add_chart(
    XL_CHART_TYPE.COLUMN_CLUSTERED,
    Inches(5.8),
    Inches(3.0),
    Inches(3.2),
    Inches(2.4),
    chart_data,
).chart

notes = slide.notes_slide.notes_text_frame
if notes is not None:
    notes.text = "Mention launch timeline."

prs.save("deck-updated.pptx")
```

## Important caveats

- `python-pptx` works with PowerPoint 2007+ Open XML files such as `.pptx` and `.pptm`; it does not open legacy `.ppt`.
- Save to a new file by default. Saving to the same path overwrites the original presentation without prompting.
- `slide.placeholders[idx]` uses placeholder `idx` keys, not visual order; inspect layouts and placeholders before assuming `1` is the body placeholder.
- Rich-content placeholder methods such as `insert_chart()` replace the original placeholder XML, so the old placeholder reference becomes invalid after insertion.
- `python-pptx` can round-trip many unsupported presentation features, but it cannot manipulate every PowerPoint feature directly.
- Macro-enabled `.pptm` files can be opened and saved, but `python-pptx` does not edit VBA code.
- Notes text is accessible through `slide.notes_slide.notes_text_frame`, but full notes-page authoring and layout control are limited.
- Most positions and sizes are in EMUs; use helpers like `Inches()`, `Cm()`, and `Pt()` for readable code.

## Useful APIs

- `Presentation()`, `prs.slides`, `prs.slide_layouts`, `prs.core_properties`
- `prs.slides.add_slide()`, `slide.shapes.title`, `slide.placeholders`, `slide.notes_slide`
- `shape.has_text_frame`, `shape.text_frame`, `shape.has_table`, `shape.table`, `shape.has_chart`, `shape.chart`
- `slide.shapes.add_textbox()`, `slide.shapes.add_picture()`, `slide.shapes.add_table()`, `slide.shapes.add_chart()`
- `placeholder.insert_picture()`, `placeholder.insert_table()`, `placeholder.insert_chart()`
