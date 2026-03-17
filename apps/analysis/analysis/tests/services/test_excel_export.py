from io import BytesIO
from zipfile import ZipFile

import pytest
from openpyxl import load_workbook
from pydantic import ValidationError

from analysis.services.excel_export import build_workbook
from analysis.web.api.schemas.datasets import ExcelExportRequest


def test_build_workbook_for_mean_bar_uses_numeric_axis_format() -> None:
    """Mean bar exports should keep a numeric axis instead of percentages."""
    payload = {
        "file_name": "mean-bar-2026-03-17.xlsx",
        "title": "Satisfaction",
        "meta_line": "Dataset: Survey 2026 | Exported: Mar 17, 2026",
        "labels": {
            "label": "Label",
            "value": "Value",
            "value_percent": "Value (%)",
            "color": "Color",
            "metric": "Metric",
        },
        "palette": ["#3b82f6"],
        "chart": {
            "kind": "meanBar",
            "points": [
                {"label": "Mean", "value": 4.2},
                {"label": "Median", "value": 4.0},
            ],
            "min_value": 1,
            "max_value": 5,
            "color": "#3b82f6",
        },
    }

    workbook_bytes = build_workbook(payload)

    with ZipFile(BytesIO(workbook_bytes)) as archive:
        chart_xml = archive.read("xl/charts/chart1.xml").decode("utf-8")

    assert 'formatCode="0.0"' in chart_xml
    assert '<max val="5"/>' in chart_xml
    assert '<min val="1"/>' in chart_xml


def test_build_workbook_for_distribution_preserves_point_colors() -> None:
    """Distribution exports should keep each point color in the chart."""
    payload = {
        "file_name": "bar-export-2026-03-17.xlsx",
        "title": "Age group",
        "meta_line": "Dataset: Survey 2026 | Exported: Mar 17, 2026",
        "labels": {
            "label": "Label",
            "value": "Value",
            "value_percent": "Value (%)",
            "color": "Color",
            "metric": "Metric",
        },
        "palette": ["#ff0000", "#00ff00"],
        "chart": {
            "kind": "bar",
            "points": [
                {"label": "18-29", "value": 55, "color": "#ff0000"},
                {"label": "30-44", "value": 45, "color": "#00ff00"},
            ],
        },
    }

    workbook_bytes = build_workbook(payload)

    with ZipFile(BytesIO(workbook_bytes)) as archive:
        chart_xml = archive.read("xl/charts/chart1.xml").decode("utf-8")

    assert '<a:srgbClr val="FF0000"/>' in chart_xml
    assert '<a:srgbClr val="00FF00"/>' in chart_xml


def test_build_workbook_for_stacked_chart_uses_percent_format_and_legend() -> None:
    """Stacked chart exports should use percent labels and a bottom legend."""
    payload = {
        "file_name": "stacked-export-2026-03-17.xlsx",
        "title": "Awareness by segment",
        "meta_line": "Dataset: Survey 2026 | Exported: Mar 17, 2026",
        "labels": {
            "label": "Label",
            "value": "Value",
            "value_percent": "Value (%)",
            "color": "Color",
            "metric": "Metric",
        },
        "palette": ["#1f2937", "#e5e7eb"],
        "chart": {
            "kind": "horizontalStackedBar",
            "rows": [
                {
                    "label": "Group A",
                    "segments": [
                        {"label": "Yes", "value": 60, "color": "#1f2937"},
                        {"label": "No", "value": 40, "color": "#e5e7eb"},
                    ],
                }
            ],
        },
    }

    workbook_bytes = build_workbook(payload)

    with ZipFile(BytesIO(workbook_bytes)) as archive:
        chart_xml = archive.read("xl/charts/chart1.xml").decode("utf-8")

    assert 'grouping val="percentStacked"' in chart_xml
    assert 'legendPos val="b"' in chart_xml
    assert chart_xml.count('formatCode="0.00&quot;%&quot;"') >= 2


def test_build_workbook_for_metrics_creates_styled_table_without_chart() -> None:
    """Metrics exports should generate a workbook table with no chart sheet parts."""
    payload = {
        "file_name": "metrics-2026-03-17.xlsx",
        "title": "Metrics",
        "meta_line": "Dataset: Survey 2026 | Exported: Mar 17, 2026",
        "labels": {
            "label": "Label",
            "value": "Value",
            "value_percent": "Value (%)",
            "color": "Color",
            "metric": "Metric",
        },
        "palette": ["#3b82f6", "#ef4444"],
        "chart": {
            "kind": "metrics",
            "metrics": [
                {"label": "Count", "value": "100"},
                {"label": "Mean", "value": "1.5"},
            ],
        },
    }

    workbook = load_workbook(BytesIO(build_workbook(payload)))
    worksheet = workbook.active

    assert worksheet is not None
    assert worksheet["A5"].value == "Count"
    assert worksheet["B6"].value == "1.5"
    assert worksheet.tables["MetricsData"].ref == "A4:B6"


def test_excel_request_model_accepts_bar_export() -> None:
    """Excel export request validation should allow valid chart payloads."""
    request = ExcelExportRequest.model_validate(
        {
            "file_name": "chart-export-2026-03-17.xlsx",
            "title": "Age group",
            "meta_line": "Dataset: Survey 2026 | Exported: Mar 17, 2026",
            "labels": {
                "label": "Label",
                "value": "Value",
                "value_percent": "Value (%)",
                "color": "Color",
                "metric": "Metric",
            },
            "palette": ["#3b82f6", "#ef4444"],
            "chart": {
                "kind": "bar",
                "points": [
                    {"label": "18-29", "value": 55.0, "color": "#3b82f6"},
                    {"label": "30-44", "value": 45.0, "color": "#3b82f6"},
                ],
            },
        }
    )

    assert request.chart.kind == "bar"
    assert request.file_name.endswith(".xlsx")


def test_excel_request_rejects_too_many_metric_cards() -> None:
    """Metrics export is limited to six rows to match the existing export shape."""
    with pytest.raises(ValidationError):
        ExcelExportRequest.model_validate(
            {
                "file_name": "metrics-2026-03-17.xlsx",
                "title": "Metrics",
                "meta_line": "Dataset: Survey 2026 | Exported: Mar 17, 2026",
                "labels": {
                    "label": "Label",
                    "value": "Value",
                    "value_percent": "Value (%)",
                    "color": "Color",
                    "metric": "Metric",
                },
                "palette": ["#3b82f6"],
                "chart": {
                    "kind": "metrics",
                    "metrics": [
                        {"label": f"Metric {index}", "value": str(index)}
                        for index in range(7)
                    ],
                },
            }
        )


def test_excel_request_rejects_inconsistent_stacked_rows() -> None:
    """Stacked chart rows must share the same segment order."""
    with pytest.raises(ValidationError):
        ExcelExportRequest.model_validate(
            {
                "file_name": "stacked-2026-03-17.xlsx",
                "title": "Age by gender",
                "meta_line": "Dataset: Survey 2026 | Split: Gender | Exported: Mar 17, 2026",
                "labels": {
                    "label": "Label",
                    "value": "Value",
                    "value_percent": "Value (%)",
                    "color": "Color",
                    "metric": "Metric",
                },
                "palette": ["#3b82f6", "#ef4444"],
                "chart": {
                    "kind": "horizontalStackedBar",
                    "rows": [
                        {
                            "label": "Women",
                            "segments": [
                                {"label": "Yes", "value": 60, "color": "#3b82f6"},
                                {"label": "No", "value": 40, "color": "#ef4444"},
                            ],
                        },
                        {
                            "label": "Men",
                            "segments": [
                                {"label": "No", "value": 45, "color": "#ef4444"},
                                {"label": "Yes", "value": 55, "color": "#3b82f6"},
                            ],
                        },
                    ],
                },
            }
        )


def test_excel_request_rejects_inconsistent_stacked_row_colors() -> None:
    """Stacked chart rows must share the same colors for matching segments."""
    with pytest.raises(ValidationError):
        ExcelExportRequest.model_validate(
            {
                "file_name": "stacked-colors-2026-03-17.xlsx",
                "title": "Age by gender",
                "meta_line": "Dataset: Survey 2026 | Split: Gender | Exported: Mar 17, 2026",
                "labels": {
                    "label": "Label",
                    "value": "Value",
                    "value_percent": "Value (%)",
                    "color": "Color",
                    "metric": "Metric",
                },
                "palette": ["#3b82f6", "#ef4444"],
                "chart": {
                    "kind": "horizontalStackedBar",
                    "rows": [
                        {
                            "label": "Women",
                            "segments": [
                                {"label": "Yes", "value": 60, "color": "#3b82f6"},
                                {"label": "No", "value": 40, "color": "#ef4444"},
                            ],
                        },
                        {
                            "label": "Men",
                            "segments": [
                                {"label": "Yes", "value": 55, "color": "#22c55e"},
                                {"label": "No", "value": 45, "color": "#ef4444"},
                            ],
                        },
                    ],
                },
            }
        )


def test_build_workbook_uses_localized_headers() -> None:
    """Excel exports should use localized worksheet headers from the payload."""
    payload = {
        "file_name": "metrics-2026-03-17.xlsx",
        "title": "Kennzahlen",
        "meta_line": "Datensatz: Umfrage 2026 | Exportiert: 17. Mar. 2026",
        "labels": {
            "label": "Bezeichnung",
            "value": "Wert",
            "value_percent": "Wert (%)",
            "color": "Farbe",
            "metric": "Kennzahl",
        },
        "palette": ["#3b82f6"],
        "chart": {
            "kind": "metrics",
            "metrics": [
                {"label": "Anzahl", "value": "100"},
            ],
        },
    }

    workbook = load_workbook(BytesIO(build_workbook(payload)))
    worksheet = workbook.active

    assert worksheet is not None
    assert worksheet["A4"].value == "Kennzahl"
    assert worksheet["B4"].value == "Wert"
