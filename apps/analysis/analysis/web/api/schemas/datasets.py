from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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


class DatasetUpdate(DatasetBase):
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
