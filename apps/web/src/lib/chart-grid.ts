type PlotAreaOffset = {
  offset: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

export function getPlotAreaHorizontalBorderCoordinates({ offset }: PlotAreaOffset): number[] {
  return [offset.top, offset.top + offset.height];
}

export function getPlotAreaVerticalBorderCoordinates({ offset }: PlotAreaOffset): number[] {
  return [offset.left, offset.left + offset.width];
}
