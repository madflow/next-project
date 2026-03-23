---
name: spss-file-convert
description: Convert between CSV and SPSS .sav format using pyreadstat. Supports csv->sav and sav->csv conversions.
license: MIT
compatibility: opencode
metadata:
  audience: data-analysts
  language: python
---

## Usage

**DO NOT CREATE A NEW SCRIPT!** Use the pre-installed script:

```bash
./spss-file-convert-skill.sh <input_file> <output_file>
```

The conversion direction is detected automatically from the file extensions.

Examples:

```bash
# CSV to SPSS
./spss-file-convert-skill.sh data.csv data.sav

# SPSS to CSV
./spss-file-convert-skill.sh data.sav data.csv

# With full paths
./spss-file-convert-skill.sh /path/to/input.csv /path/to/output.sav
```

## What it does

- **CSV -> SAV**: Reads a CSV file, auto-detects numeric vs. string columns, and writes a valid SPSS `.sav` file.
- **SAV -> CSV**: Reads an SPSS `.sav` file (including string variables) and writes a plain CSV.

Uses `pyreadstat` and `pandas`. Both are pre-installed in the skill-local virtual environment at `./venv/`.
