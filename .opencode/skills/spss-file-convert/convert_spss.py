#!/usr/bin/env python3
"""
Convert between CSV and SPSS .sav formats using pyreadstat.

Supported conversions:
  csv -> sav   (CSV to SPSS)
  sav -> csv   (SPSS to CSV)
"""

import sys
import csv
from pathlib import Path

try:
    import pyreadstat
except ImportError:
    print(
        "Error: pyreadstat is not installed. Install with: pip install pyreadstat",
        file=sys.stderr,
    )
    sys.exit(1)

try:
    import pandas as pd
except ImportError:
    print(
        "Error: pandas is not installed. Install with: pip install pandas",
        file=sys.stderr,
    )
    sys.exit(1)


def csv_to_sav(input_path: str, output_path: str) -> None:
    """Convert a CSV file to SPSS .sav format."""
    # Read CSV manually to avoid pandas dependency
    with open(input_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        column_names = reader.fieldnames or []

    if not rows:
        print("Warning: CSV file contains no data rows.", file=sys.stderr)

    # Build column data as lists, auto-detecting numeric vs string columns
    data = {col: [] for col in column_names}
    for row in rows:
        for col in column_names:
            value = row.get(col, "")
            try:
                if "." in value:
                    data[col].append(float(value))
                else:
                    data[col].append(int(value))
            except (ValueError, TypeError):
                data[col].append(value)

    df = pd.DataFrame(data, columns=list(column_names))
    pyreadstat.write_sav(df, output_path)
    print(
        f"Converted {len(rows)} rows x {len(column_names)} columns  ->  {output_path}",
        file=sys.stderr,
    )


def sav_to_csv(input_path: str, output_path: str) -> None:
    """Convert an SPSS .sav file to CSV format."""
    df, meta = pyreadstat.read_sav(input_path, output_format="dict")

    column_names = meta.column_names
    num_rows = meta.number_rows

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(column_names)
        for i in range(num_rows):
            writer.writerow([df[col][i] for col in column_names])

    print(
        f"Converted {num_rows} rows x {len(column_names)} columns  ->  {output_path}",
        file=sys.stderr,
    )


def detect_direction(input_path: str, output_path: str):
    """Return ('csv_to_sav' | 'sav_to_csv') based on file extensions."""
    src = Path(input_path).suffix.lower()
    dst = Path(output_path).suffix.lower()

    if src == ".csv" and dst == ".sav":
        return "csv_to_sav"
    if src == ".sav" and dst == ".csv":
        return "sav_to_csv"

    print(
        f"Error: Cannot determine conversion direction from '{src}' to '{dst}'.\n"
        "Supported pairs: .csv -> .sav  |  .sav -> .csv",
        file=sys.stderr,
    )
    sys.exit(1)


def main():
    if len(sys.argv) != 3:
        print(
            "Usage: python convert_spss.py <input_file> <output_file>\n"
            "\n"
            "Examples:\n"
            "  python convert_spss.py data.csv    data.sav\n"
            "  python convert_spss.py data.sav    data.csv",
            file=sys.stderr,
        )
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    if not Path(input_file).exists():
        print(f"Error: Input file not found: {input_file}", file=sys.stderr)
        sys.exit(1)

    direction = detect_direction(input_file, output_file)

    try:
        print(f"Converting: {input_file}  ->  {output_file}", file=sys.stderr)
        if direction == "csv_to_sav":
            csv_to_sav(input_file, output_file)
        else:
            sav_to_csv(input_file, output_file)
        print("Done.", file=sys.stderr)
    except Exception as e:
        print(f"Error during conversion: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
