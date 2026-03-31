from analysis.services.s3_client import S3Client


def test_check_connection_requires_bucket_name(monkeypatch) -> None:
    """Return a clear failure when the bucket name is blank."""
    monkeypatch.setattr("analysis.services.s3_client.settings.s3_bucket_name", "   ")

    is_connected, message = S3Client.check_connection()

    assert is_connected is False
    assert message == "S3 bucket name is not configured"
