import uuid

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    slug = Column(Text, nullable=False, unique=True)
    logo = Column(Text)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    org_metadata = Column("metadata", JSONB, nullable=True)

    # Relationship to datasets
    datasets = relationship("Dataset", back_populates="organization")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text)
    filename = Column(Text, nullable=False)
    file_type = Column(Text, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_hash = Column(Text, nullable=False)
    s3_key = Column(Text, nullable=False)
    uploaded_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(DateTime(timezone=True))

    # Relationship to organization
    organization = relationship("Organization", back_populates="datasets")

    # Relationship to dataset variables
    variables = relationship(
        "DatasetVariable", back_populates="dataset", cascade="all, delete-orphan"
    )


class DatasetVariable(Base):
    __tablename__ = "dataset_variables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    label = Column(Text)
    type = Column(Text, nullable=False)
    measure = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    variable_labels = Column("variable_labels", JSONB)
    value_labels = Column("value_labels", JSONB)
    missing_values = Column("missing_values", JSONB)
    dataset_id = Column(
        UUID(as_uuid=True),
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False,
    )

    dataset = relationship("Dataset", back_populates="variables")

    __table_args__ = (
        UniqueConstraint("name", "dataset_id", name="dataset_variable_unique_idx"),
    )
