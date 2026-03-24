from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.chart.marker import DataPoint

from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.fill import (
    PatternFillProperties,
    ColorChoice,
    SolidColorFillProperties,
)

wb = Workbook()
ws = wb.active

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

for r in rows:
    ws.append(r)


c = BarChart()
data = Reference(ws, min_col=1, min_row=1, max_row=8)
c.add_data(data, titles_from_data=True)
c.title = "Chart with patterns"

# Styling the plot area

plot_area_properties = GraphicalProperties()
# plot_area_properties.solidFill = ColorChoice(prstClr="blue")
c.plot_area.graphicalProperties = plot_area_properties


# Styling the chart area

c.graphical_properties = GraphicalProperties()
c.graphical_properties.line.noFill = True
c.graphical_properties.line.prstDash = None

# Styling the series

series_properties = GraphicalProperties()
series_properties.solidFill = ColorChoice(prstClr="yellow")
series_properties.line.solidFill = ColorChoice(prstClr="red")

# set a pattern for the whole series
series = c.series[0]
series.graphicalProperties = series_properties

# set a pattern for a 6th data point (0-indexed)
pt = DataPoint(idx=5)
pt.graphicalProperties.pattFill = PatternFillProperties(prst="ltHorz")
series.dPt.append(pt)

ws.add_chart(c, "C1")

wb.save("pattern.xlsx")
