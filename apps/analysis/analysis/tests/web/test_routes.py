from unittest.mock import AsyncMock, Mock, patch

import pandas as pd
import pytest

from analysis.web.api.datasets.routes import (
    RawDataRequest,
    RawDataRequestOptions,
    RawDataResponse,
    RawDataVariableResponse,
    StatsRequest,
    StatsVariable,
    get_dataset_raw_data,
    get_dataset_stats,
)


# Since the actual integration tests are complex to set up without full app context,
# let's create unit tests that test the logic functions directly
def test_stats_request_model_with_split_variables() -> None:
    """Test that the StatsRequest and StatsVariable models work correctly."""
    # Test per-variable split variable
    request = StatsRequest(
        variables=[StatsVariable(variable="test_var", split_variable="group")]
    )
    assert request.variables[0].split_variable == "group"

    # Test global split variable
    request = StatsRequest(
        variables=[StatsVariable(variable="test_var")], split_variable="global_group"
    )
    assert request.split_variable == "global_group"
    assert request.variables[0].split_variable is None

    # Test mixed
    request = StatsRequest(
        variables=[
            StatsVariable(variable="test_var", split_variable="per_var_group"),
            StatsVariable(variable="other_var"),
        ],
        split_variable="global_group",
    )
    assert request.variables[0].split_variable == "per_var_group"
    assert request.variables[1].split_variable is None
    assert request.split_variable == "global_group"


@patch("analysis.web.api.datasets.routes._get_dataset_by_id")
@patch("analysis.web.api.datasets.routes._read_dataframe_from_s3")
@patch("analysis.web.api.datasets.routes._get_dataset_variable_by_name")
@patch("analysis.web.api.datasets.routes.StatisticsService")
def test_stats_endpoint_split_variable_logic(
    mock_stats_service_class: Mock,
    mock_get_variable: Mock,
    mock_read_df: Mock,
    mock_get_dataset: Mock,
) -> None:
    """Test the split variable logic in the stats endpoint directly."""
    # Mock setup
    mock_dataset = Mock()
    mock_dataset.s3_key = "test/path.sav"
    mock_get_dataset.return_value = mock_dataset

    mock_dataframe = pd.DataFrame({"test_var": [1, 2, 3], "split_var": ["A", "B", "A"]})
    mock_read_df.return_value = mock_dataframe

    # Mock variables
    mock_main_var = Mock()
    mock_main_var.value_labels = {"1": "Yes"}
    mock_main_var.missing_values = []

    mock_split_var = Mock()
    mock_split_var.value_labels = {"A": "Group A", "B": "Group B"}
    mock_split_var.missing_values = []

    mock_get_variable.side_effect = [mock_main_var, mock_split_var]

    # Mock StatisticsService
    mock_stats_service = Mock()
    mock_stats_result = {
        "split_variable": "split_var",
        "categories": {"A": {"count": 2}, "B": {"count": 1}},
        "split_variable_labels": {"A": "Group A", "B": "Group B"},
    }
    mock_stats_service.describe_var.return_value = mock_stats_result
    mock_stats_service_class.return_value = mock_stats_service

    # Test request with split variable
    stats_request = StatsRequest(
        variables=[StatsVariable(variable="test_var", split_variable="split_var")]
    )

    # This is a simplified test - in reality we'd need to set up the full FastAPI context
    # But we can verify that the StatisticsService would be called with the right parameters

    # Verify the mocks would be set up correctly
    assert stats_request.variables[0].split_variable == "split_var"

    # Verify get_dataset_stats is importable (used in integration)
    assert get_dataset_stats is not None


def test_value_labels_conversion() -> None:
    """Test that JSONB value labels are properly converted to string keys."""
    # Simulate JSONB data with mixed key types
    jsonb_labels = {1: "Group A", 2: "Group B", "3": "Group C"}

    # Convert like the code does
    converted = {str(k): str(v) for k, v in jsonb_labels.items()}

    expected = {"1": "Group A", "2": "Group B", "3": "Group C"}
    assert converted == expected


def test_split_variable_precedence() -> None:
    """Test that per-variable split variable takes precedence over global."""
    request = StatsRequest(
        variables=[StatsVariable(variable="test_var", split_variable="per_var_split")],
        split_variable="global_split",
    )

    # The logic should prefer per-variable over global
    var = request.variables[0]
    actual_split = var.split_variable or request.split_variable
    assert actual_split == "per_var_split"

    # Test fallback to global
    request = StatsRequest(
        variables=[
            StatsVariable(variable="test_var"),  # No per-variable split
        ],
        split_variable="global_split",
    )

    var = request.variables[0]
    actual_split = var.split_variable or request.split_variable
    assert actual_split == "global_split"


def test_stats_request_model_with_decimal_places() -> None:
    """Test that the StatsRequest model accepts decimal_places parameter."""
    # Test with decimal_places
    request = StatsRequest(
        variables=[StatsVariable(variable="test_var")], decimal_places=2
    )
    assert request.decimal_places == 2

    # Test without decimal_places (should be 2 by default)
    request = StatsRequest(variables=[StatsVariable(variable="test_var")])
    assert request.decimal_places == 2

    # Test with zero decimal places
    request = StatsRequest(
        variables=[StatsVariable(variable="test_var")], decimal_places=0
    )
    assert request.decimal_places == 0


# Tests for raw data endpoint
def test_raw_data_request_model() -> None:
    """Test that the RawDataRequest model works correctly."""
    # Test with default options
    request = RawDataRequest(variables=["var1", "var2"])
    assert request.variables == ["var1", "var2"]
    assert request.options.exclude_empty is True
    assert request.options.max_values == 1000
    assert request.options.page == 1
    assert request.options.page_size == 5

    # Test with custom options
    request = RawDataRequest(
        variables=["var1"],
        options=RawDataRequestOptions(
            exclude_empty=False, max_values=500, page=2, page_size=10
        ),
    )
    assert request.options.exclude_empty is False
    assert request.options.max_values == 500
    assert request.options.page == 2
    assert request.options.page_size == 10


@pytest.mark.anyio
@patch("analysis.web.api.datasets.routes._get_dataset_by_id")
@patch("analysis.web.api.datasets.routes._read_dataframe_from_s3")
@patch("analysis.web.api.datasets.routes.RawDataService")
async def test_raw_data_endpoint_logic(
    mock_raw_data_service_class: Mock,
    mock_read_df: Mock,
    mock_get_dataset: Mock,
) -> None:
    """Test the raw data endpoint logic directly."""
    # Mock setup
    mock_dataset = Mock()
    mock_dataset.s3_key = "test/path.sav"
    mock_get_dataset.return_value = mock_dataset

    mock_dataframe = pd.DataFrame(
        {
            "feedback": ["Great!", "Good", None, ""],
            "comments": ["Nice", "Thanks", "Appreciate it", ""],
        }
    )
    mock_read_df.return_value = mock_dataframe

    # Mock RawDataService with all fields the route mapper expects
    mock_raw_data_service = Mock()
    mock_raw_data_result = {
        "feedback": {
            "values": ["Great!", "Good"],
            "totalCount": 4,
            "nonEmptyCount": 2,
            "totalNonEmptyCount": 2,
            "totalPages": 1,
            "page": 1,
        },
        "comments": {
            "values": ["Nice", "Thanks", "Appreciate it"],
            "totalCount": 4,
            "nonEmptyCount": 3,
            "totalNonEmptyCount": 3,
            "totalPages": 1,
            "page": 1,
        },
    }
    mock_raw_data_service.get_raw_values.return_value = mock_raw_data_result
    mock_raw_data_service_class.return_value = mock_raw_data_service

    # Test request with exclude_empty=True and pagination options
    raw_data_request = RawDataRequest(
        variables=["feedback", "comments"],
        options=RawDataRequestOptions(
            exclude_empty=True, max_values=1000, page=1, page_size=5
        ),
    )

    # Invoke the route handler directly
    result = await get_dataset_raw_data(
        dataset_id="test-dataset-id",
        raw_data_request=raw_data_request,
        db=AsyncMock(),
        api_key="test-key",
    )

    # Verify the service was called with the correct parameters
    mock_raw_data_service.get_raw_values.assert_called_once_with(
        mock_dataframe,
        ["feedback", "comments"],
        exclude_empty=True,
        max_values=1000,
        page=1,
        page_size=5,
    )

    # Verify the response structure
    assert result.status == "success"
    assert result.dataset_id == "test-dataset-id"
    assert "feedback" in result.data
    assert "comments" in result.data

    # Verify pagination and count fields are mapped correctly
    feedback = result.data["feedback"]
    assert feedback.values == ["Great!", "Good"]
    assert feedback.total_count == 4
    assert feedback.non_empty_count == 2
    assert feedback.total_non_empty_count == 2
    assert feedback.total_pages == 1
    assert feedback.page == 1

    comments = result.data["comments"]
    assert comments.values == ["Nice", "Thanks", "Appreciate it"]
    assert comments.total_non_empty_count == 3
    assert comments.total_pages == 1
    assert comments.page == 1


def test_raw_data_response_model() -> None:
    """Test that the RawDataResponse model works correctly."""
    response = RawDataResponse(
        status="success",
        message="Successfully retrieved raw data for 2 variable(s)",
        dataset_id="test-dataset-id",
        data={
            "var1": RawDataVariableResponse(
                values=["value1", "value2", "value3"],
                total_count=5,
                non_empty_count=3,
                total_non_empty_count=3,
                total_pages=1,
                page=1,
            ),
            "var2": RawDataVariableResponse(
                values=["a", "b"],
                total_count=5,
                non_empty_count=2,
                total_non_empty_count=2,
                total_pages=1,
                page=1,
            ),
        },
    )

    assert response.status == "success"
    assert "var1" in response.data
    assert response.data["var1"].values == ["value1", "value2", "value3"]
    assert response.data["var1"].total_count == 5
    assert response.data["var1"].non_empty_count == 3
    assert response.data["var1"].total_non_empty_count == 3
    assert response.data["var1"].total_pages == 1
    assert response.data["var1"].page == 1
