---
name: spss-file-metadata
description: Extract metadata from SPSS .sav files as JSON using pyreadstat
license: MIT
compatibility: opencode
metadata:
  audience: data-analysts
  language: python
---

## Usage

**DO NOT CREATE A NEW SCRIPT!** Use the pre-installed script:

```bash
./spss-file-metadata-skill.sh <path_to_sav_file> [output_json_file]
```

Examples:

```bash
# Output to stdout
./spss-file-metadata-skill.sh blueprint.sav

# Save to file
./spss-file-metadata-skill.sh blueprint.sav metadata.json
```

## What it does

Extracts metadata from SPSS `.sav` files without loading data rows (fast, memory efficient):

- Column names, labels, types, formats
- Value labels for categorical variables
- File properties (encoding, row/column counts)
- Missing value ranges

Uses `pyreadstat` with `metadataonly=True`. All dependencies are pre-installed in the skill-local virtual environment at `./venv/`.
