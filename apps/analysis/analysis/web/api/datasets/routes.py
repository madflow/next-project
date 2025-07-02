from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Security
from fastapi.routing import APIRouter
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from analysis.db.dependencies import get_db_session
from analysis.db.models.models import Dataset
from analysis.web.api.security import get_api_key
from analysis.web.api.schemas.datasets import DatasetResponse

router = APIRouter(tags=["datasets"])


async def _get_dataset_by_id(db: AsyncSession, dataset_id: str) -> Optional[Dataset]:
    """
    Fetches a dataset from the database by its ID.
    """
    try:
        result = await db.execute(select(Dataset).filter(Dataset.id == dataset_id))
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
    """
    Retrieves a dataset by its ID.
    """
    dataset = await _get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return DatasetResponse.model_validate(dataset)


class ImportResponse(BaseModel):
    status: str
    message: str
    dataset_id: str


@router.post("/datasets/{dataset_id}/import", response_model=ImportResponse)
async def import_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_db_session),
    api_key: str = Security(get_api_key),
) -> ImportResponse:
    """
    Import a dataset by its ID.
    """
    dataset = await _get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Here you would typically add your import logic
    # For now, we'll just return a success message with the dataset ID
    return ImportResponse(
        status="success",
        message=f"Dataset {dataset_id} import started",
        dataset_id=dataset_id
    )
