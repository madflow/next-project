import tempfile
from typing import Any, Dict, Optional, Tuple
from uuid import UUID

import pyreadstat
from fastapi import Depends, HTTPException, Security, status
from fastapi.routing import APIRouter
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from analysis.db.dependencies import get_db_session
from analysis.db.models.models import Dataset
from analysis.services.s3_client import S3Client
from analysis.settings import settings
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
    data: Optional[Dict[str, Any]] = {}
    metadata: Optional[Dict[str, Any]] = {}
    
    class Config:
        json_encoders = {
            # Handle numpy types that might be in the metadata
            'int64': int,
            'float64': float,
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
    
    with tempfile.NamedTemporaryFile(suffix='.sav') as temp_file:
        try:
            # Download file from S3 to a temporary file
            s3_client.download_file(
                Bucket=settings.s3_bucket_name,
                Key=s3_key,
                Filename=temp_file.name
            )
            
            # Read the SAV file
            df, meta = pyreadstat.read_sav(temp_file.name, metadataonly=True)
            
            # Convert to dict for JSON serialization
            data = {
                'records': df.to_dict(orient='records') if df is not None else [],
                'columns': list(df.columns) if df is not None else []
            }
            metadata = {k: v for k, v in meta.__dict__.items() if not k.startswith('_')} if hasattr(meta, '__dict__') else {}
            
            return data, metadata
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading SAV file: {str(e)}"
            )

@router.post("/datasets/{dataset_id}/import", response_model=ImportResponse)
async def import_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_db_session),
    api_key: str = Security(get_api_key),
) -> ImportResponse:
    """
    Import a dataset by its ID.
    
    The dataset's file_name field should be the S3 key where the SAV file is stored.
    """
    dataset = await _get_dataset_by_id(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if not dataset.s3_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset has no associated S3 key"
        )
    
    try:
        # Read the SAV file from S3
        data, metadata = _read_sav_from_s3(dataset.s3_key)
        
        return ImportResponse(
            status="success",
            message=f"Successfully imported dataset {dataset_id}",
            dataset_id=dataset_id,
            data=data,
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing dataset: {str(e)}"
        )
