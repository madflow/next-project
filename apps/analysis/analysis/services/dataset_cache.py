import tempfile
from pathlib import Path

from fastapi import HTTPException, status

from analysis.services.s3_client import S3Client
from analysis.settings import TEMP_DIR, settings

CACHE_DIRECTORY = TEMP_DIR / "analysis-dataset-cache"


def get_cached_dataset_path(file_hash: str, s3_key: str) -> Path:
    """Return a local cached path for a dataset SAV file."""
    CACHE_DIRECTORY.mkdir(parents=True, exist_ok=True)
    cached_path = CACHE_DIRECTORY / f"{file_hash}.sav"

    if cached_path.exists():
        return cached_path

    return _download_dataset_to_cache(cached_path, s3_key)


def _download_dataset_to_cache(cached_path: Path, s3_key: str) -> Path:
    """Download a dataset from S3 into the local cache."""
    s3_client = S3Client.get_client()

    with tempfile.NamedTemporaryFile(
        suffix=".sav",
        dir=CACHE_DIRECTORY,
        delete=False,
    ) as temp_file:
        temp_path = Path(temp_file.name)

    try:
        s3_client.download_file(
            Bucket=settings.s3_bucket_name,
            Key=s3_key,
            Filename=str(temp_path),
        )

        try:
            temp_path.replace(cached_path)
        except FileExistsError:
            temp_path.unlink(missing_ok=True)

        return cached_path
    except Exception as e:
        temp_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error downloading SAV file from S3: {e!s}",
        ) from e
