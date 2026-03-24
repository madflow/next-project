from typing import Any, Optional, cast

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.chart.axis import ChartLines
from openpyxl.chart.marker import DataPoint
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.colors import ColorChoice
from openpyxl.worksheet.worksheet import Worksheet

CHART_BORDER_WIDTH = 9360
AXIS_BORDER_WIDTH = 3600
SERIES_BORDER_WIDTH = 12600


def make_color(color: str) -> ColorChoice:
    """Create a chart color from a hex RGB string."""
    return ColorChoice(srgbClr=cast(Any, color))


def make_graphical_properties(
    *,
    fill_color: Optional[str] = None,
    line_color: Optional[str] = None,
    line_width: Optional[int] = None,
    no_fill: bool = False,
    no_line: bool = False,
    round_line: bool = False,
) -> GraphicalProperties:
    """Build chart graphical properties for fills and borders."""
    properties = GraphicalProperties()

    if fill_color is not None:
        properties.solidFill = make_color(fill_color)
    if no_fill:
        properties.noFill = True
    if line_width is not None:
        properties.line.width = line_width
    if line_color is not None:
        properties.line.solidFill = make_color(line_color)
    if no_line:
        properties.line.noFill = True
    if round_line:
        properties.line.round = True

    return properties


def main() -> None:
    """Generate the patterned bar chart workbook."""
    wb = Workbook()
    ws = cast(Worksheet, wb.active)

    rows = [
        ("Sample",),
        (1,),
        (2,),
        (3,),
        (2,),
        (3,),
        (3,),
        (1,),
        (2,),
    ]

    for row in rows:
        ws.append(row)

    chart = BarChart()
    data = Reference(ws, min_col=1, min_row=1, max_row=8)
    chart.add_data(data, titles_from_data=True)
    chart.title = "Chart with patterns"

    chart.graphical_properties = make_graphical_properties(
        fill_color="ffffff",
        line_width=CHART_BORDER_WIDTH,
        no_line=True,
    )
    chart.plot_area.spPr = make_graphical_properties(
        fill_color="ffffff",
        line_color="999999",
        line_width=AXIS_BORDER_WIDTH,
        round_line=True,
    )

    chart.x_axis.axPos = "b"
    chart.x_axis.crossesAt = 0
    chart.x_axis.tickLblPos = "nextTo"
    chart.x_axis.spPr = make_graphical_properties(
        line_color="999999",
        line_width=AXIS_BORDER_WIDTH,
        round_line=True,
    )

    chart.y_axis.crossesAt = 0
    chart.y_axis.tickLblPos = "nextTo"
    chart.y_axis.spPr = make_graphical_properties(
        line_color="999999",
        line_width=AXIS_BORDER_WIDTH,
        round_line=True,
    )
    chart.y_axis.majorGridlines = ChartLines(
        spPr=make_graphical_properties(
            line_color="999999",
            line_width=AXIS_BORDER_WIDTH,
            round_line=True,
        )
    )

    chart.legend.spPr = make_graphical_properties(
        no_fill=True,
        line_width=0,
        no_line=True,
    )

    series = chart.series[0]
    series.invertIfNegative = False
    series.graphicalProperties = make_graphical_properties(
        fill_color="ffff00",
        line_color="ff0000",
        line_width=SERIES_BORDER_WIDTH,
        round_line=True,
    )

    point = DataPoint(idx=5)
    point.invertIfNegative = False
    point.graphicalProperties = make_graphical_properties(
        no_fill=True,
        line_width=0,
        no_line=True,
    )
    series.dPt = [point]

    ws.add_chart(chart, "C1")
    wb.save("pattern.xlsx")


if __name__ == "__main__":
    main()
