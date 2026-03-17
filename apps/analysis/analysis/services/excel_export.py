# pyright: reportMissingImports=false

from dataclasses import dataclass, field
from importlib import import_module
from io import BytesIO
from pathlib import Path
from typing import Any, cast

from openpyxl import Workbook
from openpyxl.chart import BarChart, PieChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.worksheet.worksheet import Worksheet

XLSX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
DEFAULT_LIGHT_TEXT_HEX = "#FFFFFF"
DEFAULT_DARK_TEXT_HEX = "#000000"
DEFAULT_HEADER_FILL_HEX = "#3B82F6"
HEADER_ROW_INDEX = 4
DATA_ROW_INDEX = 5
TABLE_STYLE_NAME = "TableStyleMedium9"
INVALID_SHEET_TITLE_CHARS = "[]:*?/\\"
PERCENT_NUMBER_FORMAT = '0.00"%"'
PIE_PERCENT_NUMBER_FORMAT = "0%"
MEAN_NUMBER_FORMAT = "0.0"


@dataclass
class WorksheetTableSpec:
    headers: list[str]
    rows: list[list[Any]]
    header_fill_colors: dict[int, str] = field(default_factory=dict)
    cell_fill_colors: dict[tuple[int, int], str] = field(default_factory=dict)
    number_formats: dict[int, str] = field(default_factory=dict)
    table_name: str = "ChartExportData"


def _normalize_hex_color(color: str) -> str:
    normalized = color.strip().removeprefix("#")
    if len(normalized) != 6:
        raise ValueError(f"Unsupported color value '{color}'")
    return normalized.upper()


def _argb_hex_color(color: str) -> str:
    return f"FF{_normalize_hex_color(color)}"


def _rgb_components(color: str) -> tuple[int, int, int]:
    normalized = _normalize_hex_color(color)
    return (
        int(normalized[0:2], 16),
        int(normalized[2:4], 16),
        int(normalized[4:6], 16),
    )


def _relative_luminance(color: str) -> float:
    def to_linear(channel: int) -> float:
        value = channel / 255
        if value <= 0.03928:
            return value / 12.92
        return ((value + 0.055) / 1.055) ** 2.4

    red, green, blue = _rgb_components(color)
    return (
        0.2126 * to_linear(red) + 0.7152 * to_linear(green) + 0.0722 * to_linear(blue)
    )


def _contrast_ratio(first_color: str, second_color: str) -> float:
    first_luminance = _relative_luminance(first_color)
    second_luminance = _relative_luminance(second_color)
    lighter = max(first_luminance, second_luminance)
    darker = min(first_luminance, second_luminance)
    return (lighter + 0.05) / (darker + 0.05)


def _best_text_color(background_color: str | None) -> str:
    if not background_color:
        return _argb_hex_color(DEFAULT_LIGHT_TEXT_HEX)

    try:
        dark_contrast = _contrast_ratio(background_color, DEFAULT_DARK_TEXT_HEX)
        light_contrast = _contrast_ratio(background_color, DEFAULT_LIGHT_TEXT_HEX)
    except ValueError:
        return _argb_hex_color(DEFAULT_LIGHT_TEXT_HEX)

    if dark_contrast >= light_contrast:
        return _argb_hex_color(DEFAULT_DARK_TEXT_HEX)

    return _argb_hex_color(DEFAULT_LIGHT_TEXT_HEX)


def _sanitize_sheet_title(value: str) -> str:
    sanitized = "".join(
        character
        for character in value.strip()
        if character not in INVALID_SHEET_TITLE_CHARS
    )
    sanitized = sanitized[:31].strip()
    return sanitized or "Chart Export"


def _sanitize_table_name(value: str) -> str:
    sanitized = "".join(character for character in value if character.isalnum())
    if not sanitized:
        return "ChartExportData"
    if sanitized[0].isdigit():
        return f"T{sanitized}"
    return sanitized


def _chart_anchor(column_count: int) -> str:
    chart_column = max(column_count + 2, 5)
    return f"{get_column_letter(chart_column)}{HEADER_ROW_INDEX}"


def _graphical_properties(color: str) -> GraphicalProperties:
    normalized = _normalize_hex_color(color)
    properties = GraphicalProperties(solidFill=normalized)
    properties.line.solidFill = normalized
    return properties


def _new_data_point(index: int, color: str) -> Any:
    marker_module = import_module("openpyxl.chart.marker")
    data_point = cast(Any, marker_module.DataPoint)(idx=index)
    data_point.graphicalProperties = _graphical_properties(color)
    return data_point


def _series_reference(
    worksheet: Worksheet,
    min_col: int,
    max_col: int,
    row_count: int,
) -> Reference:
    return Reference(
        worksheet,
        min_col=min_col,
        min_row=HEADER_ROW_INDEX,
        max_col=max_col,
        max_row=HEADER_ROW_INDEX + row_count,
    )


def _category_reference(worksheet: Worksheet, row_count: int) -> Reference:
    return Reference(
        worksheet,
        min_col=1,
        min_row=DATA_ROW_INDEX,
        max_row=DATA_ROW_INDEX + row_count - 1,
    )


def _configure_data_labels(
    chart: BarChart | PieChart,
    *,
    position: str,
    number_format: str,
    show_percent: bool = False,
) -> None:
    labels = DataLabelList()
    labels.position = position
    labels.numFmt = number_format
    if show_percent:
        labels.showPercent = True
    else:
        labels.showVal = True
    chart.dataLabels = labels


def _set_value_axis_range(
    chart: BarChart,
    minimum: float,
    maximum: float,
    number_format: str,
) -> None:
    chart.y_axis.scaling.min = minimum
    chart.y_axis.scaling.max = maximum
    chart.y_axis.numFmt = number_format


def _apply_point_fills(series: Any, colors: list[str]) -> None:
    if not colors:
        return

    series.graphicalProperties = _graphical_properties(colors[0])
    series.dPt = [_new_data_point(index, color) for index, color in enumerate(colors)]


def _apply_series_fills(series_list: list[Any], colors: list[str]) -> None:
    for series, color in zip(series_list, colors, strict=True):
        series.graphicalProperties = _graphical_properties(color)


def _style_title_block(
    worksheet: Worksheet,
    title: str,
    meta_line: str,
    column_count: int,
) -> None:
    last_column = max(column_count, 1)
    worksheet.merge_cells(
        start_row=1,
        start_column=1,
        end_row=1,
        end_column=last_column,
    )
    worksheet.merge_cells(
        start_row=2,
        start_column=1,
        end_row=2,
        end_column=last_column,
    )

    title_cell = worksheet.cell(row=1, column=1, value=title)
    title_cell.font = Font(size=16, bold=True)
    title_cell.alignment = Alignment(horizontal="left", vertical="center")

    meta_cell = worksheet.cell(row=2, column=1, value=meta_line)
    meta_cell.font = Font(size=10, color="FF6B7280")
    meta_cell.alignment = Alignment(
        horizontal="left",
        vertical="center",
        wrap_text=True,
    )

    worksheet.row_dimensions[1].height = 24
    worksheet.row_dimensions[2].height = 18


def _style_header_row(
    worksheet: Worksheet,
    spec: WorksheetTableSpec,
    default_fill_color: str,
) -> None:
    for column_index, header in enumerate(spec.headers, start=1):
        fill_color = spec.header_fill_colors.get(column_index - 1, default_fill_color)
        cell = worksheet.cell(row=HEADER_ROW_INDEX, column=column_index, value=header)
        cell.font = Font(bold=True, color=_best_text_color(fill_color))
        cell.fill = PatternFill(fill_type="solid", fgColor=_argb_hex_color(fill_color))
        cell.alignment = Alignment(horizontal="left", vertical="center")


def _write_table_rows(worksheet: Worksheet, spec: WorksheetTableSpec) -> None:
    for row_offset, row in enumerate(spec.rows):
        worksheet_row = DATA_ROW_INDEX + row_offset
        for column_index, value in enumerate(row, start=1):
            cell = worksheet.cell(row=worksheet_row, column=column_index, value=value)
            cell.alignment = Alignment(
                horizontal="right" if isinstance(value, (int, float)) else "left",
                vertical="center",
            )

            fill_color = spec.cell_fill_colors.get((row_offset, column_index - 1))
            if fill_color:
                cell.fill = PatternFill(
                    fill_type="solid",
                    fgColor=_argb_hex_color(fill_color),
                )
                cell.font = Font(color=_best_text_color(fill_color))

            number_format = spec.number_formats.get(column_index - 1)
            if number_format and isinstance(value, (int, float)):
                cell.number_format = number_format


def _set_column_widths(
    worksheet: Worksheet, total_rows: int, column_count: int
) -> None:
    for column_index in range(1, column_count + 1):
        max_length = 0
        for row_index in range(1, total_rows + 1):
            value = worksheet.cell(row=row_index, column=column_index).value
            if value is None:
                continue
            max_length = max(max_length, len(str(value)))

        worksheet.column_dimensions[get_column_letter(column_index)].width = min(
            max(max_length + 2, 12),
            40,
        )


def _add_table(worksheet: Worksheet, spec: WorksheetTableSpec) -> None:
    last_column_letter = get_column_letter(len(spec.headers))
    last_row = HEADER_ROW_INDEX + len(spec.rows)
    table = Table(
        displayName=_sanitize_table_name(spec.table_name),
        ref=f"A{HEADER_ROW_INDEX}:{last_column_letter}{last_row}",
    )
    table.tableStyleInfo = TableStyleInfo(
        name=TABLE_STYLE_NAME,
        showFirstColumn=False,
        showLastColumn=False,
        showRowStripes=True,
        showColumnStripes=False,
    )
    worksheet.add_table(table)


def _add_distribution_chart(
    worksheet: Worksheet,
    title: str,
    points: list[dict[str, Any]],
    *,
    horizontal: bool,
    column_count: int,
) -> None:
    chart = BarChart()
    chart.type = "bar" if horizontal else "col"
    chart.style = 10
    chart.title = title
    chart.legend = None
    chart.width = 10
    chart.height = max(min(len(points) // 2 + 4, 10), 6)

    chart.add_data(
        _series_reference(worksheet, 2, 2, len(points)), titles_from_data=True
    )
    chart.set_categories(_category_reference(worksheet, len(points)))
    _set_value_axis_range(chart, 0.0, 100.0, PERCENT_NUMBER_FORMAT)
    _configure_data_labels(
        chart,
        position="outEnd",
        number_format=PERCENT_NUMBER_FORMAT,
    )
    _apply_point_fills(chart.ser[0], [point["color"] for point in points])

    worksheet.add_chart(chart, _chart_anchor(column_count))


def _add_stacked_bar_chart(
    worksheet: Worksheet,
    title: str,
    rows: list[dict[str, Any]],
    *,
    column_count: int,
) -> None:
    if not rows:
        raise ValueError("Stacked chart export requires at least one row")

    chart = BarChart()
    chart.type = "bar"
    chart.style = 13
    chart.grouping = "percentStacked"
    chart.overlap = 100
    chart.title = title
    legend = chart.legend
    if legend is not None:
        legend.position = "b"

    chart.width = 10
    chart.height = max(min(len(rows) // 2 + 4, 10), 6)

    chart.add_data(
        _series_reference(worksheet, 2, len(rows[0]["segments"]) + 1, len(rows)),
        titles_from_data=True,
    )
    chart.set_categories(_category_reference(worksheet, len(rows)))
    _set_value_axis_range(chart, 0.0, 100.0, PERCENT_NUMBER_FORMAT)
    _configure_data_labels(
        chart,
        position="ctr",
        number_format=PERCENT_NUMBER_FORMAT,
    )
    _apply_series_fills(
        list(chart.ser),
        [segment["color"] for segment in rows[0]["segments"]],
    )

    worksheet.add_chart(chart, _chart_anchor(column_count))


def _add_pie_chart(
    worksheet: Worksheet,
    title: str,
    points: list[dict[str, Any]],
    *,
    column_count: int,
) -> None:
    chart = PieChart()
    chart.title = title
    legend = chart.legend
    if legend is not None:
        legend.position = "b"

    chart.width = 10
    chart.height = 7

    chart.add_data(
        _series_reference(worksheet, 2, 2, len(points)), titles_from_data=True
    )
    chart.set_categories(_category_reference(worksheet, len(points)))
    _configure_data_labels(
        chart,
        position="outEnd",
        number_format=PIE_PERCENT_NUMBER_FORMAT,
        show_percent=True,
    )
    chart.series[0].data_points = [
        _new_data_point(index, point["color"]) for index, point in enumerate(points)
    ]

    worksheet.add_chart(chart, _chart_anchor(column_count))


def _add_mean_bar_chart(
    worksheet: Worksheet,
    title: str,
    chart_payload: dict[str, Any],
    *,
    column_count: int,
) -> None:
    chart = BarChart()
    chart.type = "bar"
    chart.style = 11
    chart.title = title
    chart.legend = None
    chart.width = 10
    chart.height = 6

    chart.add_data(
        _series_reference(worksheet, 2, 2, len(chart_payload["points"])),
        titles_from_data=True,
    )
    chart.set_categories(_category_reference(worksheet, len(chart_payload["points"])))
    _set_value_axis_range(
        chart,
        float(chart_payload["min_value"]),
        float(chart_payload["max_value"]),
        MEAN_NUMBER_FORMAT,
    )
    _configure_data_labels(
        chart,
        position="outEnd",
        number_format=MEAN_NUMBER_FORMAT,
    )
    _apply_series_fills(list(chart.ser), [chart_payload["color"]])

    worksheet.add_chart(chart, _chart_anchor(column_count))


def _build_distribution_table_spec(
    chart: dict[str, Any], labels: dict[str, str], table_name: str
) -> WorksheetTableSpec:
    rows: list[list[Any]] = []
    cell_fill_colors: dict[tuple[int, int], str] = {}

    for row_index, point in enumerate(chart["points"]):
        rows.append([point["label"], point["value"], point["color"]])
        cell_fill_colors[(row_index, 2)] = point["color"]

    return WorksheetTableSpec(
        headers=[labels["label"], labels["value_percent"], labels["color"]],
        rows=rows,
        cell_fill_colors=cell_fill_colors,
        number_formats={1: PERCENT_NUMBER_FORMAT},
        table_name=table_name,
    )


def _build_stacked_table_spec(
    chart: dict[str, Any], labels: dict[str, str]
) -> WorksheetTableSpec:
    first_row = chart["rows"][0]
    headers = [
        labels["label"],
        *[segment["label"] for segment in first_row["segments"]],
    ]
    rows = [
        [row["label"], *[segment["value"] for segment in row["segments"]]]
        for row in chart["rows"]
    ]
    header_fill_colors = {
        index + 1: segment["color"]
        for index, segment in enumerate(first_row["segments"])
    }
    number_formats = dict.fromkeys(range(1, len(headers)), PERCENT_NUMBER_FORMAT)

    return WorksheetTableSpec(
        headers=headers,
        rows=rows,
        header_fill_colors=header_fill_colors,
        number_formats=number_formats,
        table_name="StackedChartData",
    )


def _build_mean_bar_table_spec(
    chart: dict[str, Any], labels: dict[str, str]
) -> WorksheetTableSpec:
    return WorksheetTableSpec(
        headers=[labels["metric"], labels["value"]],
        rows=[[point["label"], point["value"]] for point in chart["points"]],
        header_fill_colors={1: chart["color"]},
        number_formats={1: MEAN_NUMBER_FORMAT},
        table_name="MeanBarData",
    )


def _build_metrics_table_spec(
    chart: dict[str, Any], labels: dict[str, str], palette: list[str]
) -> WorksheetTableSpec:
    safe_palette = list(palette) or [DEFAULT_HEADER_FILL_HEX]
    cell_fill_colors = {
        (index, 0): safe_palette[index % len(safe_palette)]
        for index, _metric in enumerate(chart["metrics"])
    }
    return WorksheetTableSpec(
        headers=[labels["metric"], labels["value"]],
        rows=[[metric["label"], metric["value"]] for metric in chart["metrics"]],
        cell_fill_colors=cell_fill_colors,
        table_name="MetricsData",
    )


def _build_table_spec(
    chart: dict[str, Any], labels: dict[str, str], palette: list[str]
) -> WorksheetTableSpec:
    kind = chart["kind"]

    if kind in {"bar", "horizontalBar", "multiResponse"}:
        return _build_distribution_table_spec(chart, labels, "DistributionChartData")
    if kind == "horizontalStackedBar":
        return _build_stacked_table_spec(chart, labels)
    if kind == "pie":
        return _build_distribution_table_spec(chart, labels, "PieChartData")
    if kind == "meanBar":
        return _build_mean_bar_table_spec(chart, labels)
    if kind == "metrics":
        return _build_metrics_table_spec(chart, labels, palette)

    raise ValueError(f"Unsupported chart kind '{kind}'")


def _add_chart_for_payload(
    worksheet: Worksheet,
    title: str,
    chart_payload: dict[str, Any],
    *,
    column_count: int,
) -> None:
    kind = chart_payload["kind"]

    if kind == "bar":
        _add_distribution_chart(
            worksheet,
            title,
            chart_payload["points"],
            horizontal=False,
            column_count=column_count,
        )
    elif kind in {"horizontalBar", "multiResponse"}:
        _add_distribution_chart(
            worksheet,
            title,
            chart_payload["points"],
            horizontal=True,
            column_count=column_count,
        )
    elif kind == "horizontalStackedBar":
        _add_stacked_bar_chart(
            worksheet,
            title,
            chart_payload["rows"],
            column_count=column_count,
        )
    elif kind == "pie":
        _add_pie_chart(
            worksheet,
            title,
            chart_payload["points"],
            column_count=column_count,
        )
    elif kind == "meanBar":
        _add_mean_bar_chart(
            worksheet,
            title,
            chart_payload,
            column_count=column_count,
        )
    elif kind == "metrics":
        return
    else:
        raise ValueError(f"Unsupported chart kind '{kind}'")


def build_workbook(payload: dict[str, Any]) -> bytes:
    """Build an Excel workbook from the normalized export payload."""
    workbook = Workbook()
    worksheet = cast(Worksheet, workbook.active)
    worksheet.title = _sanitize_sheet_title(payload["title"])
    worksheet.freeze_panes = f"A{DATA_ROW_INDEX}"
    worksheet.sheet_view.showGridLines = False

    palette = list(payload["palette"])
    spec = _build_table_spec(payload["chart"], payload["labels"], palette)
    default_fill_color = palette[0] if palette else DEFAULT_HEADER_FILL_HEX

    _style_title_block(
        worksheet, payload["title"], payload["meta_line"], len(spec.headers)
    )
    _style_header_row(worksheet, spec, default_fill_color)
    _write_table_rows(worksheet, spec)
    _add_table(worksheet, spec)
    _set_column_widths(
        worksheet,
        total_rows=HEADER_ROW_INDEX + len(spec.rows),
        column_count=len(spec.headers),
    )
    _add_chart_for_payload(
        worksheet,
        payload["title"],
        payload["chart"],
        column_count=len(spec.headers),
    )

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def build_content_disposition(file_name: str) -> str:
    """Create a safe attachment header value for the generated workbook."""
    safe_name = (
        Path(file_name).name.replace("\r", "").replace("\n", "").replace('"', "")
    )
    if not safe_name:
        safe_name = "chart-export.xlsx"
    return f'attachment; filename="{safe_name}"'
