import tempfile
from typing import Any, ClassVar, Dict, List, Optional, Tuple

import pandas as pd
import pyreadstat
from fastapi import Depends, HTTPException, Security, status
from fastapi.routing import APIRouter
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from analysis.db.dependencies import get_db_session
from analysis.db.models.models import Dataset, DatasetVariable
from analysis.services.s3_client import S3Client
from analysis.services.stats import StatisticsService
from analysis.settings import settings
from analysis.web.api.schemas.datasets import DatasetResponse
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

    status: str
    message: str
    dataset_id: str
    data: Optional[Dict[str, Any]] = {}
    metadata: Optional[Dict[str, Any]] = {}

    class Config:
        json_encoders: ClassVar[Dict[str, Any]] = {
            # Handle numpy types that might be in the metadata
            "int64": int,
            "float64": float,
        }


def _read_sav_from_s3(s3_key: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Read SAV file from S3 and return data and metadata.

    Args:
        s3_key: The S3 object key/path

    Returns:
        Tuple containing (data, metadata) from the SAV file
    """
    s3_client = S3Client.get_client()

    with tempfile.NamedTemporaryFile(suffix=".sav") as temp_file:
        try:
            # Download file from S3 to a temporary file
            s3_client.download_file(
                Bucket=settings.s3_bucket_name,
                Key=s3_key,
                Filename=temp_file.name,
            )

            # Read the SAV file
            df, meta = pyreadstat.read_sav(
                temp_file.name,
                metadataonly=True,
                user_missing=True,
            )

            # Convert to dict for JSON serialization
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


def _read_dataframe_from_s3(s3_key: str) -> pd.DataFrame:
    """Read SAV file from S3 and return a pandas DataFrame."""
    s3_client = S3Client.get_client()

    with tempfile.NamedTemporaryFile(suffix=".sav") as temp_file:
        try:
            # Download file from S3 to a temporary file
            s3_client.download_file(
                Bucket=settings.s3_bucket_name,
                Key=s3_key,
                Filename=temp_file.name,
            )

            # Read the SAV file
            df, _ = pyreadstat.read_sav(temp_file.name)
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

    if dataset.s3_key is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset has no associated S3 key",
        )

    try:
        # Read the SAV file from S3
        data, metadata = _read_sav_from_s3(str(dataset.s3_key))

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

    if dataset.s3_key is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset has no associated S3 key",
        )

    try:
        df = _read_dataframe_from_s3(str(dataset.s3_key))
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
