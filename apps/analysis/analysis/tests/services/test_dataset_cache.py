from pathlib import Path
from unittest.mock import Mock, patch

import pytest

from analysis.services import dataset_cache
from analysis.services.dataset_cache import get_cached_dataset_path


@patch("analysis.services.dataset_cache.S3Client.get_client")
def test_get_cached_dataset_path_downloads_on_cache_miss(
    mock_get_client: Mock,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Download the dataset into the cache when no cached file exists."""
    monkeypatch.setattr(dataset_cache, "CACHE_DIRECTORY", tmp_path)

    mock_s3_client = Mock()
    mock_get_client.return_value = mock_s3_client

    mock_s3_client.download_file.side_effect = lambda **kwargs: Path(
        kwargs["Filename"]
    ).write_bytes(b"sav-data")

    result = get_cached_dataset_path("dataset-hash", "datasets/test.sav")

    assert result == tmp_path / "dataset-hash.sav"
    assert result.read_bytes() == b"sav-data"
    mock_s3_client.download_file.assert_called_once()


@patch("analysis.services.dataset_cache.S3Client.get_client")
def test_get_cached_dataset_path_reuses_existing_cached_file(
    mock_get_client: Mock,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Reuse an existing cached file without hitting S3 again."""
    cached_path = tmp_path / "dataset-hash.sav"
    cached_path.write_bytes(b"cached-data")

    monkeypatch.setattr(dataset_cache, "CACHE_DIRECTORY", tmp_path)

    result = get_cached_dataset_path("dataset-hash", "datasets/test.sav")

    assert result == cached_path
    assert result.read_bytes() == b"cached-data"
    mock_get_client.assert_not_called()
