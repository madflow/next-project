import pandas as pd
import pytest

from analysis.services.stats import StatisticsService


@pytest.fixture
def stats_service():
    """Fixture to provide a StatisticsService instance for testing."""
    return StatisticsService()


# Test cases for numeric data
numeric_test_data = [
    # Standard case with a simple integer series
    (
        pd.Series([1.0, 2.0, 2.0, 3.0, 4.0, 4.0, 4.0]),
        "numeric_var",
        [
            "count",
            "mean",
            "std",
            "min",
            "max",
            "median",
            "range",
            "mode",
            "frequencies",
        ],
        {
            "count": 7,
            "mean": 2.857142857142857,
            "std": 1.2149858938925602,
            "min": 1.0,
            "max": 4.0,
            "median": 3.0,
            "range": 3.0,
            "mode": [4],
            "frequency_table": [
                {"value": "4.0", "counts": 3, "percentages": 42.857142857142854},
                {"value": "2.0", "counts": 2, "percentages": 28.57142857142857},
                {"value": "1.0", "counts": 1, "percentages": 14.285714285714285},
                {"value": "3.0", "counts": 1, "percentages": 14.285714285714285},
            ],
        },
    ),
    # Case with floating point numbers
    (
        pd.Series([1.5, 2.5, 2.5, 3.5]),
        "float_var",
        ["mean", "std"],
        {"mean": 2.5, "std": 0.816496580927726},
    ),
    # Case with negative numbers
    (
        pd.Series([-1.0, -2.0, -3.0, -2.0]),
        "neg_var",
        ["min", "max", "range"],
        {"min": -3.0, "max": -1.0, "range": 2.0},
    ),
    # Case with a single value
    (
        pd.Series([5.0]),
        "single_value_var",
        None,
        {
            "count": 1,
            "mean": 5.0,
            "std": None,
            "min": 5.0,
            "max": 5.0,
            "median": 5.0,
            "range": 0.0,
            "frequency_table": [{"value": 5.0, "counts": 1, "percentages": 100.0}],
        },
    ),
]


@pytest.mark.parametrize("series, var_name, include, expected", numeric_test_data)
def test_describe_var_numeric(stats_service, series, var_name, include, expected):
    """Test descriptive statistics for numeric variables with various scenarios."""
    df = pd.DataFrame({var_name: series})
    result = stats_service.describe_var(df, var_name, include)

    # For numeric results, compare with a tolerance for floating point inaccuracies
    for key, value in expected.items():
        if isinstance(value, float):
            assert result[key] == pytest.approx(value), f"Mismatch on key {key}"
        elif key == "frequency_table":
            # Sort by value to ensure consistent comparison
            sorted_result = sorted(result[key], key=lambda x: x["value"])
            sorted_expected = sorted(value, key=lambda x: x["value"])
            for res_item, exp_item in zip(sorted_result, sorted_expected):
                assert res_item["value"] == str(exp_item["value"])
                assert res_item["counts"] == exp_item["counts"]
                assert res_item["percentages"] == pytest.approx(exp_item["percentages"])
        else:
            assert result[key] == value, f"Mismatch on key {key}"


# Test cases for categorical data
categorical_test_data = [
    # Standard case with string data
    (
        pd.Series(["apple", "banana", "apple", "orange", "banana", "apple"]),
        "fruit_var",
        ["count", "mode", "frequencies"],
        {
            "count": 6,
            "mode": ["apple"],
            "frequency_table": [
                {"value": "apple", "counts": 3, "percentages": 50.0},
                {"value": "banana", "counts": 2, "percentages": 33.33333333333333},
                {"value": "orange", "counts": 1, "percentages": 16.666666666666664},
            ],
        },
    ),
    # Case with mixed data types (treated as object/categorical)
    (
        pd.Series([1.0, "apple", 2.0, "apple"]),
        "mixed_var",
        None,
        {
            "count": 4,
            "mode": ["apple"],
        },
    ),
    # Case with a single category
    (
        pd.Series(["A", "A", "A"]),
        "single_cat_var",
        ["count", "mode", "frequencies"],
        {
            "count": 3,
            "mode": ["A"],
            "frequency_table": [{"value": "A", "counts": 3, "percentages": 100.0}],
        },
    ),
]


@pytest.mark.parametrize("series, var_name, include, expected", categorical_test_data)
def test_describe_var_categorical(stats_service, series, var_name, include, expected):
    """Test descriptive statistics for categorical variables."""
    df = pd.DataFrame({var_name: series})
    result = stats_service.describe_var(df, var_name, include)

    for key, value in expected.items():
        if key == "frequency_table":
            # Sort by value to ensure consistent comparison
            sorted_result = sorted(result[key], key=lambda x: str(x["value"]))
            sorted_expected = sorted(value, key=lambda x: str(x["value"]))
            for res_item, exp_item in zip(sorted_result, sorted_expected):
                assert res_item["value"] == str(exp_item["value"])
                assert res_item["counts"] == exp_item["counts"]
                assert res_item["percentages"] == pytest.approx(exp_item["percentages"])
        else:
            assert result[key] == value, f"Mismatch on key {key}"


# Test cases for edge scenarios
edge_case_data = [
    # Case with all NaN values
    (
        pd.Series([None, None, None], dtype=float),
        "nan_var",
        None,
        {
            "count": 0,
            "mean": None,
            "std": None,
            "min": None,
            "max": None,
            "median": None,
            "range": None,
            "mode": [],
            "frequency_table": [],
        },
    ),
    # Case with some NaN values
    (
        pd.Series([1, 2, None, 4]),
        "some_nan_var",
        ["count", "mean", "min", "max"],
        {"count": 3, "mean": 2.3333333333333335, "min": 1.0, "max": 4.0},
    ),
    # Empty series
    (
        pd.Series([], dtype=float),
        "empty_var",
        None,
        {
            "count": 0,
            "mean": None,
            "std": None,
            "min": None,
            "max": None,
            "median": None,
            "range": None,
            "mode": [],
            "frequency_table": [],
        },
    ),
]


@pytest.mark.parametrize("series, var_name, include, expected", edge_case_data)
def test_describe_var_edge_cases(stats_service, series, var_name, include, expected):
    """Test edge cases like NaN values and empty series."""
    df = pd.DataFrame({var_name: series})
    result = stats_service.describe_var(df, var_name, include)

    for key, value in expected.items():
        if isinstance(value, float):
            assert result[key] == pytest.approx(value), f"Mismatch on key {key}"
        else:
            assert result[key] == value, f"Mismatch on key {key}"


def test_variable_not_found(stats_service):
    """Test that a ValueError is raised if the variable is not in the DataFrame."""
    df = pd.DataFrame({"a": [1, 2, 3]})
    with pytest.raises(ValueError, match="Variable 'b' not found in the DataFrame."):
        stats_service.describe_var(df, "b")
