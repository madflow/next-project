from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import pyreadstat
from fastapi import Depends, HTTPException, Security, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from fastapi.routing import APIRouter
from loguru import logger
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from analysis.db.dependencies import get_db_session
from analysis.db.models.models import Dataset, DatasetVariable
from analysis.services.dataset_cache import get_cached_dataset_path
from analysis.services.excel_export import (
    XLSX_MEDIA_TYPE,
    build_workbook,
)
from analysis.services.excel_export import (
    build_content_disposition as build_excel_content_disposition,
)
from analysis.services.powerpoint_export import (
    PPTX_MEDIA_TYPE,
    build_presentation,
)
from analysis.services.powerpoint_export import (
    build_content_disposition as build_powerpoint_content_disposition,
)
from analysis.services.stats import RawDataService, StatisticsService
from analysis.web.api.schemas.datasets import (
    DatasetResponse,
    ExcelExportRequest,
    PowerPointExportRequest,
)
from analysis.web.api.security import get_api_key

router = APIRouter(tags=["datasets"])


class StatsVariable(BaseModel):
    """A variable for which statistics are to be calculated."""

    variable: str
    split_variable: Optional[str] = None


class StatsRequest(BaseModel):
    """Request model for dataset statistics."""

    variables: List[StatsVariable]
    # Keep global split_variable for backward compatibility
    split_variable: Optional[str] = None
    # Number of decimal places for numeric statistics (mean, std, percentages, etc.)
    decimal_places: Optional[int] = 2


class RawDataRequestOptions(BaseModel):
    """Options for raw data request."""

    exclude_empty: bool = True
    max_values: int = 1000
    page: int = 1
    page_size: int = 5


class RawDataRequest(BaseModel):
    """Request model for raw data endpoint."""

    variables: List[str]
    options: RawDataRequestOptions = RawDataRequestOptions()


class RawDataVariableResponse(BaseModel):
    """Response model for a single variable's raw data."""

    values: List[str]
    total_count: int
    non_empty_count: int
    total_non_empty_count: int
    total_pages: int
    page: int
    error: Optional[str] = None


class RawDataResponse(BaseModel):
    """Response model for raw data endpoint."""

    model_config = ConfigDict(
        json_encoders={
            # Handle numpy types that might be in the metadata
            np.int64: int,
            np.float64: float,
        },
    )

    status: str
    message: str
    dataset_id: str
    data: Dict[str, RawDataVariableResponse]


async def _get_dataset_by_id(db: AsyncSession, dataset_id: str) -> Optional[Dataset]:
    """Fetches a dataset from the database by its ID."""
    try:
        result = await db.execute(select(Dataset).filter(Dataset.id == dataset_id))
        return result.scalar_one_or_none()
    except ValueError:
        # This handles cases where id is not a valid UUID
        return None


async def _get_dataset_variable_by_name(
    db: AsyncSession,
    dataset_id: str,
    variable_name: str,
) -> Optional[DatasetVariable]:
    try:
        result = await db.execute(
            select(DatasetVariable).filter(
                DatasetVariable.dataset_id == dataset_id,
                DatasetVariable.name == variable_name,
            ),
        )
        return result.scalar_one_or_none()
    except ValueError:
        # This handles cases where id is not a valid UUID
        return None


@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_db_session),
    api_key: str = Security(get_api_key),
) -> DatasetResponse:
    """Retrieves a dataset by its ID."""
    dataset = await _get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return DatasetResponse.model_validate(dataset)


class MetadataResponse(BaseModel):
    """Response model for dataset metadata."""

    model_config = ConfigDict(
        json_encoders={
            # Handle numpy types that might be in the metadata
            np.int64: int,
            np.float64: float,
        },
    )

    status: str
    message: str
    dataset_id: str
    data: Optional[Dict[str, Any]] = {}
    metadata: Optional[Dict[str, Any]] = {}


def _get_cached_dataset_file_path(dataset: Dataset) -> str:
    """Return the local cached file path for a dataset."""
    if dataset.s3_key is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset has no associated S3 key",
        )

    return str(get_cached_dataset_path(str(dataset.file_hash), str(dataset.s3_key)))


def _read_sav_from_dataset(dataset: Dataset) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Read a cached SAV file and return data and metadata.

    Args:
        dataset: Dataset containing the file hash and S3 object key/path

    Returns:
        Tuple containing (data, metadata) from the SAV file
    """
    dataset_file_path = _get_cached_dataset_file_path(dataset)

    try:
        df, meta = pyreadstat.read_sav(
            dataset_file_path,
            metadataonly=True,
            user_missing=True,
        )

        data = {
            "records": df.to_dict(orient="records") if df is not None else [],
            "columns": list(df.columns) if df is not None else [],
        }
        metadata = (
            {k: v for k, v in meta.__dict__.items() if not k.startswith("_")}
            if hasattr(meta, "__dict__")
            else {}
        )

        return data, metadata
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading SAV file: {e!s}",
        ) from e


def _read_dataframe_from_dataset(dataset: Dataset) -> pd.DataFrame:
    """Read a cached SAV file and return a pandas DataFrame."""
    dataset_file_path = _get_cached_dataset_file_path(dataset)

    try:
        df, _ = pyreadstat.read_sav(dataset_file_path)
        if df is None:
            raise ValueError("No data found in SAV file.")
        return df
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading SAV file: {e!s}",
        ) from e


@router.get("/datasets/{dataset_id}/metadata", response_model=MetadataResponse)
async def get_dataset_metadata(
    dataset_id: str,
    db: AsyncSession = Depends(get_db_session),
    api_key: str = Security(get_api_key),
) -> MetadataResponse:
    """
    Import a dataset by its ID.

    The dataset's file_name field should be the S3 key where the SAV file is stored.
    """
    dataset = await _get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        data, metadata = _read_sav_from_dataset(dataset)

        return MetadataResponse(
            status="success",
            message=f"Successfully imported dataset {dataset_id}",
            dataset_id=dataset_id,
            data=data,
            metadata=metadata,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing dataset: {e!s}",
        ) from e


@router.post("/datasets/{dataset_id}/stats")
async def get_dataset_stats(
    dataset_id: str,
    stats_request: StatsRequest,
    db: AsyncSession = Depends(get_db_session),
    api_key: str = Security(get_api_key),
) -> List[Dict[str, Any]]:
    """Calculate statistics for a list of variables in a dataset."""
    dataset = await _get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = _read_dataframe_from_dataset(dataset)
        stats_service = StatisticsService()
        results = []

        for var_request in stats_request.variables:
            try:
                dataset_variable = await _get_dataset_variable_by_name(
                    db,
                    dataset_id,
                    var_request.variable,
                )
                if not dataset_variable:
                    raise ValueError(f"Variable {var_request.variable} not found")

                # Use per-variable split_variable if provided, otherwise fall back to global
                split_var = var_request.split_variable or stats_request.split_variable

                # Get split variable value labels if split variable is provided
                split_variable_value_labels: dict[str, str] | None = None
                split_variable_missing_values: list[str | int | float] | None = None
                split_variable_missing_ranges: Optional[List[Dict[str, float]]] = None
                if split_var:
                    split_variable_obj = await _get_dataset_variable_by_name(
                        db,
                        dataset_id,
                        split_var,
                    )
                    if not split_variable_obj:
                        raise ValueError(f"Split variable {split_var} not found")
                    # Cast JSONB to dict
                    value_labels_raw = split_variable_obj.value_labels
                    if isinstance(value_labels_raw, dict):
                        split_variable_value_labels = {
                            str(k): str(v) for k, v in value_labels_raw.items()
                        }
                    else:
                        split_variable_value_labels = None

                    # Get missing values for split variable
                    split_variable_missing_values = split_variable_obj.missing_values  # type: ignore
                    # Extract split variable missing_ranges array from the object structure
                    split_missing_ranges_raw = split_variable_obj.missing_ranges
                    split_variable_missing_ranges = (
                        split_missing_ranges_raw.get(split_var)
                        if isinstance(split_missing_ranges_raw, dict)
                        else None
                    )

                # Extract missing_ranges array from the object structure
                # DB stores: { variableName: [{ lo, hi }, ...] }
                # Service expects: [{ lo, hi }, ...]
                missing_ranges_raw = dataset_variable.missing_ranges
                missing_ranges = (
                    missing_ranges_raw.get(var_request.variable)
                    if isinstance(missing_ranges_raw, dict)
                    else None
                )

                stats = stats_service.describe_var(
                    df,
                    var_request.variable,
                    missing_values=dataset_variable.missing_values,  # type: ignore
                    missing_ranges=missing_ranges,
                    value_labels=dataset_variable.value_labels,  # type: ignore
                    split_variable=split_var,
                    split_variable_value_labels=split_variable_value_labels,
                    split_variable_missing_values=split_variable_missing_values,
                    split_variable_missing_ranges=split_variable_missing_ranges,
                    decimal_places=stats_request.decimal_places,
                )
                results.append({"variable": var_request.variable, "stats": stats})
            except ValueError as e:
                results.append({"variable": var_request.variable, "error": str(e)})

        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing dataset statistics: {e!s}",
        ) from e


@router.post("/datasets/{dataset_id}/raw-data", response_model=RawDataResponse)
async def get_dataset_raw_data(
    dataset_id: str,
    raw_data_request: RawDataRequest,
    db: AsyncSession = Depends(get_db_session),
    api_key: str = Security(get_api_key),
) -> RawDataResponse:
    """
    Get raw data values for specified variables in a dataset.

    Returns non-empty raw values for string variables and can also be used
    for numeric variables if needed.
    """
    dataset = await _get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = _read_dataframe_from_dataset(dataset)
        raw_data_service = RawDataService()

        raw_data = raw_data_service.get_raw_values(
            df,
            raw_data_request.variables,
            exclude_empty=raw_data_request.options.exclude_empty,
            max_values=raw_data_request.options.max_values,
            page=raw_data_request.options.page,
            page_size=raw_data_request.options.page_size,
        )

        # Convert to response model format
        response_data = {}
        for var_name, var_data in raw_data.items():
            response_data[var_name] = RawDataVariableResponse(
                values=var_data["values"],
                total_count=var_data["totalCount"],
                non_empty_count=var_data["nonEmptyCount"],
                total_non_empty_count=var_data["totalNonEmptyCount"],
                total_pages=var_data["totalPages"],
                page=var_data["page"],
                error=var_data.get("error"),
            )

        return RawDataResponse(
            status="success",
            message=f"Successfully retrieved raw data for {len(raw_data)} variable(s)",
            dataset_id=dataset_id,
            data=response_data,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving raw data: {e!s}",
        ) from e


@router.post("/datasets/{dataset_id}/exports/powerpoint")
async def export_dataset_powerpoint(
    dataset_id: str,
    export_request: PowerPointExportRequest,
    db: AsyncSession = Depends(get_db_session),
    api_key: str = Security(get_api_key),
) -> Response:
    """Generate a PowerPoint export for a dataset chart selection."""
    dataset = await _get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        presentation_bytes = await run_in_threadpool(
            build_presentation,
            export_request.model_dump(),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("PowerPoint export failed for dataset {}", dataset_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating PowerPoint export",
        ) from exc

    return Response(
        content=presentation_bytes,
        media_type=PPTX_MEDIA_TYPE,
        headers={
            "Content-Disposition": build_powerpoint_content_disposition(
                export_request.file_name
            ),
        },
    )


@router.post("/datasets/{dataset_id}/exports/excel")
async def export_dataset_excel(
    dataset_id: str,
    export_request: ExcelExportRequest,
    db: AsyncSession = Depends(get_db_session),
    api_key: str = Security(get_api_key),
) -> Response:
    """Generate an Excel export for a dataset chart selection."""
    dataset = await _get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        workbook_bytes = await run_in_threadpool(
            build_workbook,
            export_request.model_dump(),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Excel export failed for dataset {}", dataset_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating Excel export",
        ) from exc

    return Response(
        content=workbook_bytes,
        media_type=XLSX_MEDIA_TYPE,
        headers={
            "Content-Disposition": build_excel_content_disposition(
                export_request.file_name
            ),
        },
    )
