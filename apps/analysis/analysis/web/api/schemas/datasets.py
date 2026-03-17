from datetime import datetime
from typing import Annotated, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

HexColor = Annotated[str, Field(pattern=r"^#[0-9A-Fa-f]{6}$")]


class DatasetBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    description: Optional[str] = None
    filename: str
    file_type: str
    file_size: int
    file_hash: str
    s3_key: str
    uploaded_at: datetime
    organization_id: UUID


class DatasetCreate(DatasetBase):
    pass


class DatasetUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = None
    description: Optional[str] = None
    filename: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    s3_key: Optional[str] = None


class DatasetInDB(DatasetBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


# For responses that include related data
class DatasetResponse(DatasetInDB):
    pass


class ExportPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=200)
    value: float = Field(ge=0, le=100)
    color: HexColor


class ExportStackedSegment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=200)
    value: float = Field(ge=0, le=100)
    color: HexColor


class ExportStackedRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=200)
    segments: list[ExportStackedSegment] = Field(min_length=1, max_length=50)


class ExportMetric(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=100)


class DistributionChartExportSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["bar", "horizontalBar", "multiResponse"]
    points: list[ExportPoint] = Field(min_length=1, max_length=250)


class HorizontalStackedBarExportSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["horizontalStackedBar"]
    rows: list[ExportStackedRow] = Field(min_length=1, max_length=250)

    @model_validator(mode="after")
    def validate_rows(self) -> "HorizontalStackedBarExportSpec":
        """Ensure each stacked row uses the same segment order and labels."""
        first_row = self.rows[0]
        first_row_labels = [segment.label for segment in first_row.segments]
        first_row_colors = [segment.color for segment in first_row.segments]

        for row in self.rows:
            row_labels = [segment.label for segment in row.segments]
            if row_labels != first_row_labels:
                raise ValueError(
                    "All stacked chart rows must use the same segment labels and order"
                )

            row_colors = [segment.color for segment in row.segments]
            if row_colors != first_row_colors:
                raise ValueError(
                    "All stacked chart rows must use the same colors for matching segment labels"
                )

            total = sum(segment.value for segment in row.segments)
            if abs(total - 100) > 1:
                raise ValueError("Each stacked chart row must total approximately 100")

        return self


class PieChartExportSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["pie"]
    points: list[ExportPoint] = Field(min_length=1, max_length=250)


class MeanBarPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=100)
    value: float


class MeanBarExportSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["meanBar"]
    points: list[MeanBarPoint] = Field(min_length=2, max_length=2)
    min_value: float
    max_value: float
    color: HexColor

    @model_validator(mode="after")
    def validate_value_range(self) -> "MeanBarExportSpec":
        """Ensure the configured min/max value range is valid."""
        if self.min_value > self.max_value:
            raise ValueError("min_value must be less than or equal to max_value")

        for point in self.points:
            if point.value < self.min_value or point.value > self.max_value:
                raise ValueError(
                    "All mean bar points must fall within the configured value range"
                )

        return self


class MetricsExportSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["metrics"]
    metrics: list[ExportMetric] = Field(min_length=1, max_length=6)


PowerPointChartExportSpec = Annotated[
    DistributionChartExportSpec
    | HorizontalStackedBarExportSpec
    | PieChartExportSpec
    | MeanBarExportSpec
    | MetricsExportSpec,
    Field(discriminator="kind"),
]


class PowerPointExportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    file_name: str = Field(
        pattern=r"^[A-Za-z0-9._-]+\.pptx$", min_length=1, max_length=120
    )
    title: str = Field(min_length=1, max_length=200)
    meta_line: str = Field(min_length=1, max_length=400)
    palette: list[HexColor] = Field(min_length=1, max_length=6)
    chart: PowerPointChartExportSpec
