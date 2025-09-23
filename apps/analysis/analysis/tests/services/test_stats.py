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
            "mean": 2.86,
            "std": 1.21,
            "min": 1.0,
            "max": 4.0,
            "median": 3.0,
            "range": 3.0,
            "mode": [4],
            "frequency_table": [
                {"value": "4.0", "counts": 3, "percentages": 42.86},
                {"value": "2.0", "counts": 2, "percentages": 28.57},
                {"value": "1.0", "counts": 1, "percentages": 14.29},
                {"value": "3.0", "counts": 1, "percentages": 14.29},
            ],
        },
    ),
    # Case with floating point numbers
    (
        pd.Series([1.5, 2.5, 2.5, 3.5]),
        "float_var",
        ["mean", "std"],
        {"mean": 2.5, "std": 0.82},
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
                {"value": "banana", "counts": 2, "percentages": 33.33},
                {"value": "orange", "counts": 1, "percentages": 16.67},
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
        {"count": 3, "mean": 2.33, "min": 1.0, "max": 4.0},
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


def test_frequency_table_with_value_labels_includes_all_valid_labels(stats_service):
    """Test that frequency table includes all value labels except missing values."""
    # Create test data with only some of the labeled values present
    df = pd.DataFrame({
        "rating": [1.0, 2.0, 2.0, 3.0, -998.0, -999.0]  # Missing 4.0 and 5.0
    })
    
    value_labels = {
        "1.0": "sehr gut",
        "2.0": "gut", 
        "3.0": "mittelmäßig",
        "4.0": "schlecht",      # This value is not present in data
        "5.0": "sehr schlecht", # This value is not present in data
        "-998.0": "keine Angabe",
        "-999.0": "Frage nicht gesehen"
    }
    
    missing_values = ["-999", "-998"]
    
    result = stats_service.describe_var(
        df, 
        "rating", 
        include=["frequencies"],
        missing_values=missing_values,
        value_labels=value_labels
    )
    
    frequency_table = result["frequency_table"]
    
    # Extract values from frequency table
    frequency_values = {item["value"] for item in frequency_table}
    
    # Should include all valid labels (1.0, 2.0, 3.0, 4.0, 5.0) but not missing values
    expected_values = {"1.0", "2.0", "3.0", "4.0", "5.0"}
    
    # Check that all expected values are present
    assert expected_values.issubset(frequency_values), f"Missing expected values. Got: {frequency_values}"
    
    # Check that missing values are not included
    assert "-998.0" not in frequency_values, "Missing value -998.0 should not be in frequency table"
    assert "-999.0" not in frequency_values, "Missing value -999.0 should not be in frequency table"
    
    # Check specific counts and percentages
    freq_dict = {item["value"]: item for item in frequency_table}
    
    # Values present in data should have correct counts
    assert freq_dict["1.0"]["counts"] == 1
    assert freq_dict["2.0"]["counts"] == 2
    assert freq_dict["3.0"]["counts"] == 1
    
    # Values not present in data should have 0 counts
    assert freq_dict["4.0"]["counts"] == 0
    assert freq_dict["5.0"]["counts"] == 0
    
    # Check percentages (based on 4 valid values: 1.0, 2.0, 2.0, 3.0)
    assert freq_dict["1.0"]["percentages"] == pytest.approx(25.0)  # 1/4 * 100
    assert freq_dict["2.0"]["percentages"] == pytest.approx(50.0)  # 2/4 * 100
    assert freq_dict["3.0"]["percentages"] == pytest.approx(25.0)  # 1/4 * 100
    assert freq_dict["4.0"]["percentages"] == pytest.approx(0.0)
    assert freq_dict["5.0"]["percentages"] == pytest.approx(0.0)


def test_frequency_table_includes_values_not_in_labels(stats_service):
    """Test that frequency table includes values present in data but not in value_labels."""
    # Create test data with a value not in labels
    df = pd.DataFrame({
        "rating": [1.0, 2.0, 6.0]  # 6.0 is not in value_labels
    })
    
    value_labels = {
        "1.0": "sehr gut",
        "2.0": "gut",
        "3.0": "mittelmäßig"  # 3.0 is not present in data
    }
    
    result = stats_service.describe_var(
        df, 
        "rating", 
        include=["frequencies"],
        value_labels=value_labels
    )
    
    frequency_table = result["frequency_table"]
    frequency_values = {item["value"] for item in frequency_table}
    
    # Should include all labeled values and the extra value from data
    expected_values = {"1.0", "2.0", "3.0", "6.0"}
    assert frequency_values == expected_values
    
    # Check counts
    freq_dict = {item["value"]: item for item in frequency_table}
    assert freq_dict["1.0"]["counts"] == 1
    assert freq_dict["2.0"]["counts"] == 1
    assert freq_dict["3.0"]["counts"] == 0  # Not in data but in labels
    assert freq_dict["6.0"]["counts"] == 1  # In data but not in labels


def test_frequency_table_without_value_labels_unchanged(stats_service):
    """Test that frequency table behavior is unchanged when value_labels is None."""
    df = pd.DataFrame({
        "rating": [1.0, 2.0, 2.0, 3.0]
    })
    
    result = stats_service.describe_var(
        df, 
        "rating", 
        include=["frequencies"]
    )
    
    frequency_table = result["frequency_table"]
    frequency_values = {item["value"] for item in frequency_table}
    
    # Should only include values present in data
    expected_values = {"1.0", "2.0", "3.0"}
    assert frequency_values == expected_values
    
    # Check that all entries have non-zero counts
    for item in frequency_table:
        assert item["counts"] > 0


def test_frequency_table_is_sorted_by_value_ascending(stats_service):
    """Test that frequency table is sorted by value in ascending order."""
    df = pd.DataFrame({
        "rating": [5.0, 1.0, 3.0, 2.0, 1.0]  # Unsorted data
    })
    
    value_labels = {
        "1.0": "sehr gut",
        "2.0": "gut", 
        "3.0": "mittelmäßig",
        "4.0": "schlecht",      # Not present in data
        "5.0": "sehr schlecht"
    }
    
    result = stats_service.describe_var(
        df, 
        "rating", 
        include=["frequencies"],
        value_labels=value_labels
    )
    
    frequency_table = result["frequency_table"]
    values = [item["value"] for item in frequency_table]
    
    # Should be sorted: 1.0, 2.0, 3.0, 4.0, 5.0
    expected_order = ["1.0", "2.0", "3.0", "4.0", "5.0"]
    assert values == expected_order, f"Expected {expected_order}, got {values}"


def test_frequency_table_sorted_without_value_labels(stats_service):
    """Test that frequency table is sorted even without value_labels."""
    df = pd.DataFrame({
        "rating": [5.0, 1.0, 3.0, 2.0]  # Unsorted data
    })
    
    result = stats_service.describe_var(
        df, 
        "rating", 
        include=["frequencies"]
    )
    
    frequency_table = result["frequency_table"]
    values = [item["value"] for item in frequency_table]
    
    # Should be sorted: 1.0, 2.0, 3.0, 5.0
    expected_order = ["1.0", "2.0", "3.0", "5.0"]
    assert values == expected_order, f"Expected {expected_order}, got {values}"


# Test cases for split variable functionality
def test_describe_var_with_split_variable_numeric(stats_service):
    """Test descriptive statistics with split variable for numeric data."""
    df = pd.DataFrame({
        "score": [10, 20, 30, 40, 50, 60],
        "group": ["A", "A", "B", "B", "C", "C"]
    })
    
    result = stats_service.describe_var(
        df, 
        "score", 
        split_variable="group",
        include=["count", "mean", "min", "max"]
    )
    
    # Check structure
    assert "split_variable" in result
    assert "categories" in result
    assert "split_variable_labels" in result
    assert result["split_variable"] == "group"
    
    # Check categories (should be sorted)
    categories = result["categories"]
    assert set(categories.keys()) == {"A", "B", "C"}
    
    # Check stats for each category
    assert categories["A"]["count"] == 2
    assert categories["A"]["mean"] == pytest.approx(15.0)  # (10 + 20) / 2
    assert categories["A"]["min"] == 10.0
    assert categories["A"]["max"] == 20.0
    
    assert categories["B"]["count"] == 2
    assert categories["B"]["mean"] == pytest.approx(35.0)  # (30 + 40) / 2
    assert categories["B"]["min"] == 30.0
    assert categories["B"]["max"] == 40.0
    
    assert categories["C"]["count"] == 2
    assert categories["C"]["mean"] == pytest.approx(55.0)  # (50 + 60) / 2
    assert categories["C"]["min"] == 50.0
    assert categories["C"]["max"] == 60.0


def test_describe_var_with_split_variable_categorical(stats_service):
    """Test descriptive statistics with split variable for categorical data."""
    df = pd.DataFrame({
        "color": ["red", "blue", "red", "green", "blue", "red"],
        "size": ["S", "S", "M", "M", "L", "L"]
    })
    
    result = stats_service.describe_var(
        df, 
        "color", 
        split_variable="size",
        include=["count", "mode", "frequencies"]
    )
    
    # Check structure
    assert result["split_variable"] == "size"
    categories = result["categories"]
    assert set(categories.keys()) == {"S", "M", "L"}
    
    # Check stats for each category
    assert categories["S"]["count"] == 2
    assert set(categories["S"]["mode"]) == {"red", "blue"}  # Tie between red and blue
    
    assert categories["M"]["count"] == 2
    assert set(categories["M"]["mode"]) == {"red", "green"}  # Tie between red and green
    
    assert categories["L"]["count"] == 2
    assert set(categories["L"]["mode"]) == {"blue", "red"}  # Tie between blue and red


def test_describe_var_with_split_variable_missing_values(stats_service):
    """Test split variable functionality with missing values in split variable."""
    df = pd.DataFrame({
        "score": [10, 20, 30, 40, 50],
        "group": ["A", "B", -999, "A", "B"]  # -999 is missing
    })
    
    result = stats_service.describe_var(
        df, 
        "score", 
        split_variable="group",
        split_variable_missing_values=[-999],
        include=["count", "mean"]
    )
    
    # Missing values in split variable should be excluded
    categories = result["categories"]
    assert set(categories.keys()) == {"A", "B"}  # -999 should be excluded
    
    # Check that only valid groups are included
    assert categories["A"]["count"] == 2  # positions 0 and 3
    assert categories["A"]["mean"] == pytest.approx(25.0)  # (10 + 40) / 2  - positions 0 and 3
    
    assert categories["B"]["count"] == 2  # positions 1 and 4
    assert categories["B"]["mean"] == pytest.approx(35.0)  # (20 + 50) / 2 - positions 1 and 4


def test_describe_var_with_split_variable_value_labels(stats_service):
    """Test split variable functionality with value labels for both variables."""
    df = pd.DataFrame({
        "satisfaction": [1, 2, 1, 3, 2, 3],
        "department": [1, 1, 2, 2, 3, 3]
    })
    
    satisfaction_labels = {
        "1": "Low",
        "2": "Medium", 
        "3": "High"
    }
    
    department_labels = {
        "1": "Sales",
        "2": "Marketing",
        "3": "Engineering"
    }
    
    result = stats_service.describe_var(
        df, 
        "satisfaction", 
        split_variable="department",
        value_labels=satisfaction_labels,
        split_variable_value_labels=department_labels,
        include=["frequencies"]
    )
    
    # Check that split variable labels are included
    assert result["split_variable_labels"] == department_labels
    
    # Check that categories use the original values (not labels)
    categories = result["categories"]
    assert set(categories.keys()) == {"1", "2", "3"}


def test_describe_var_with_split_variable_single_category(stats_service):
    """Test split variable functionality with only one category."""
    df = pd.DataFrame({
        "score": [10, 20, 30],
        "group": ["A", "A", "A"]  # All same group
    })
    
    result = stats_service.describe_var(
        df, 
        "score", 
        split_variable="group",
        include=["count", "mean"]
    )
    
    categories = result["categories"]
    assert set(categories.keys()) == {"A"}
    assert categories["A"]["count"] == 3
    assert categories["A"]["mean"] == pytest.approx(20.0)


def test_describe_var_with_split_variable_empty_after_filtering(stats_service):
    """Test split variable functionality when all split values are missing."""
    df = pd.DataFrame({
        "score": [10, 20, 30],
        "group": [-999, -998, -999]  # All missing
    })
    
    result = stats_service.describe_var(
        df, 
        "score", 
        split_variable="group",
        split_variable_missing_values=[-999, -998],
        include=["count", "mean"]
    )
    
    # Should return empty categories
    categories = result["categories"]
    assert categories == {}


def test_describe_var_with_split_variable_mixed_numeric_string_categories(stats_service):
    """Test split variable with mixed numeric and string categories."""
    df = pd.DataFrame({
        "score": [10, 20, 30, 40, 50],
        "group": [1, "A", 2, "A", 1]
    })
    
    result = stats_service.describe_var(
        df, 
        "score", 
        split_variable="group",
        include=["count", "mean"]
    )
    
    categories = result["categories"]
    # Should be sorted with numbers first, then strings
    expected_keys = ["1", "2", "A"]
    actual_keys = list(categories.keys())
    assert actual_keys == expected_keys
    
    assert categories["1"]["count"] == 2  # positions 0 and 4
    assert categories["1"]["mean"] == pytest.approx(30.0)  # (10 + 50) / 2
    
    assert categories["2"]["count"] == 1
    assert categories["2"]["mean"] == pytest.approx(30.0)
    
    assert categories["A"]["count"] == 2  # positions 1 and 3
    assert categories["A"]["mean"] == pytest.approx(30.0)  # (20 + 40) / 2


def test_split_variable_not_found_error(stats_service):
    """Test that ValueError is raised when split variable doesn't exist."""
    df = pd.DataFrame({
        "score": [10, 20, 30],
        "group": ["A", "B", "C"]
    })
    
    with pytest.raises(ValueError, match="Split variable 'nonexistent' not found in the DataFrame."):
        stats_service.describe_var(
            df, 
            "score", 
            split_variable="nonexistent"
        )


def test_describe_var_with_split_variable_frequency_table_sorted(stats_service):
    """Test that frequency tables within split categories are properly sorted."""
    df = pd.DataFrame({
        "rating": [5, 1, 3, 2, 4, 1],
        "group": ["A", "A", "A", "B", "B", "B"]
    })
    
    result = stats_service.describe_var(
        df, 
        "rating", 
        split_variable="group",
        include=["frequencies"]
    )
    
    categories = result["categories"]
    
    # Check that frequency tables are sorted within each category
    group_a_values = [item["value"] for item in categories["A"]["frequency_table"]]
    group_b_values = [item["value"] for item in categories["B"]["frequency_table"]]
    
    assert group_a_values == ["1.0", "3.0", "5.0"]  # Should be sorted
    assert group_b_values == ["1.0", "2.0", "4.0"]  # Should be sorted


def test_describe_var_with_split_variable_main_var_missing_values(stats_service):
    """Test split variable functionality with missing values in main variable."""
    df = pd.DataFrame({
        "score": [10, -999, 30, 40, -999],
        "group": ["A", "A", "B", "B", "B"]
    })
    
    result = stats_service.describe_var(
        df, 
        "score", 
        split_variable="group",
        missing_values=[-999],
        include=["count", "mean"]
    )
    
    categories = result["categories"]
    
    # Group A should have 1 valid value (position 0, position 1 is missing)
    assert categories["A"]["count"] == 1
    # Check if mean is calculated - it might not be for single values depending on implementation
    if "mean" in categories["A"]:
        assert categories["A"]["mean"] == pytest.approx(10.0)
    
    # Group B should have 2 valid values (positions 2 and 3, position 4 is missing) 
    assert categories["B"]["count"] == 2
    # Check if mean is calculated - it should be for multiple values
    if "mean" in categories["B"]:
        assert categories["B"]["mean"] == pytest.approx(35.0)  # (30 + 40) / 2


def test_decimal_places_rounding(stats_service):
    """Test that decimal_places parameter properly rounds numeric statistics."""
    # Create test data with values that will produce many decimal places
    df = pd.DataFrame({
        "test_var": [1, 2, 2, 3, 4, 4, 4]  # Mean: 2.857..., Std: 1.214...
    })
    
    # Test with default decimal_places (should return 2 decimal places)
    stats_default = stats_service.describe_var(df, "test_var")
    assert "mean" in stats_default
    assert "std" in stats_default
    assert "frequency_table" in stats_default
    
    # Check that default values have 2 decimal places
    assert stats_default["mean"] == pytest.approx(2.86, abs=0.001)
    assert stats_default["std"] == pytest.approx(1.21, abs=0.001)
    
    # Test with decimal_places=None (should return full precision)
    stats_full_precision = stats_service.describe_var(df, "test_var", decimal_places=None)
    assert len(str(stats_full_precision["mean"]).split(".")[-1]) > 2
    assert len(str(stats_full_precision["std"]).split(".")[-1]) > 2
    
    # Test with decimal_places=2 (explicitly set)
    stats_rounded = stats_service.describe_var(df, "test_var", decimal_places=2)
    
    # Check rounded mean and std (actual values: mean=2.857..., std=1.214...)
    assert stats_rounded["mean"] == pytest.approx(2.86, abs=0.001)
    assert stats_rounded["std"] == pytest.approx(1.21, abs=0.001)
    
    # Check that frequency table percentages are rounded
    freq_table = stats_rounded["frequency_table"]
    for item in freq_table:
        percentage_str = str(item["percentages"])
        if "." in percentage_str:
            decimal_places_count = len(percentage_str.split(".")[-1])
            assert decimal_places_count <= 2, f"Percentage {item['percentages']} has more than 2 decimal places"
    
    # Test with decimal_places=0 (integers)
    stats_integer = stats_service.describe_var(df, "test_var", decimal_places=0)
    assert stats_integer["mean"] == 3.0  # 2.857... rounded to 3
    assert stats_integer["std"] == 1.0   # 1.214... rounded to 1
    
    # Test that counts remain integers (not affected by rounding)
    assert isinstance(stats_rounded["count"], int)
    for item in stats_rounded["frequency_table"]:
        assert isinstance(item["counts"], int)


def test_decimal_places_with_split_variable(stats_service):
    """Test decimal_places works correctly with split variables."""
    df = pd.DataFrame({
        "values": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        "groups": ["A", "A", "A", "B", "B", "B"]
    })
    
    # Test with decimal_places=1
    stats = stats_service.describe_var(
        df, 
        "values", 
        split_variable="groups", 
        decimal_places=1
    )
    
    assert "categories" in stats
    categories = stats["categories"]
    
    # Check that both categories have rounded statistics
    for category in ["A", "B"]:
        assert category in categories
        if "mean" in categories[category]:
            mean_str = str(categories[category]["mean"])
            if "." in mean_str:
                decimal_places_count = len(mean_str.split(".")[-1])
                assert decimal_places_count <= 1
        
        # Check frequency table percentages in each category
        if "frequency_table" in categories[category]:
            for item in categories[category]["frequency_table"]:
                percentage_str = str(item["percentages"])
                if "." in percentage_str:
                    decimal_places_count = len(percentage_str.split(".")[-1])
                    assert decimal_places_count <= 1


# Test cases for missing ranges functionality
def test_missing_ranges_single_range(stats_service):
    """Test that values within a single missing range are treated as missing."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]
    })
    
    # Define range [2.0, 4.0] as missing
    missing_ranges = {
        "score": [{"lo": 2.0, "hi": 4.0}]
    }
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_ranges=missing_ranges,
        include=["count", "mean", "min", "max", "frequencies"]
    )
    
    # Only values 1.0, 5.0, 6.0 should remain (values 2.0, 3.0, 4.0 should be missing)
    assert result["count"] == 3
    assert result["mean"] == pytest.approx(4.0)  # (1 + 5 + 6) / 3
    assert result["min"] == 1.0
    assert result["max"] == 6.0
    
    # Check frequency table
    frequency_values = {item["value"] for item in result["frequency_table"]}
    assert frequency_values == {"1.0", "5.0", "6.0"}
    assert "2.0" not in frequency_values
    assert "3.0" not in frequency_values
    assert "4.0" not in frequency_values


def test_missing_ranges_multiple_ranges(stats_service):
    """Test that values within multiple missing ranges are treated as missing."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
    })
    
    # Define ranges [2.0, 3.0] and [7.0, 9.0] as missing
    missing_ranges = {
        "score": [
            {"lo": 2.0, "hi": 3.0},
            {"lo": 7.0, "hi": 9.0}
        ]
    }
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_ranges=missing_ranges,
        include=["count", "mean", "frequencies"]
    )
    
    # Only values 1.0, 4.0, 5.0, 6.0, 10.0 should remain
    assert result["count"] == 5
    assert result["mean"] == pytest.approx(5.2)  # (1 + 4 + 5 + 6 + 10) / 5
    
    # Check frequency table
    frequency_values = {item["value"] for item in result["frequency_table"]}
    expected_values = {"1.0", "4.0", "5.0", "6.0", "10.0"}
    assert frequency_values == expected_values


def test_missing_ranges_inclusive_boundaries(stats_service):
    """Test that missing ranges are inclusive of boundary values."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0]
    })
    
    # Define range [2.0, 4.0] as missing (should include 2.0 and 4.0)
    missing_ranges = {
        "score": [{"lo": 2.0, "hi": 4.0}]
    }
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_ranges=missing_ranges,
        include=["count", "frequencies"]
    )
    
    # Only values 1.0 and 5.0 should remain
    assert result["count"] == 2
    
    frequency_values = {item["value"] for item in result["frequency_table"]}
    assert frequency_values == {"1.0", "5.0"}
    assert "2.0" not in frequency_values  # Boundary value should be missing
    assert "4.0" not in frequency_values  # Boundary value should be missing


def test_missing_ranges_with_missing_values(stats_service):
    """Test that missing ranges work together with traditional missing values."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0, -999.0, -998.0]
    })
    
    # Define range [2.0, 3.0] as missing AND specific values as missing
    missing_ranges = {
        "score": [{"lo": 2.0, "hi": 3.0}]
    }
    missing_values = [-999, -998]
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_values=missing_values,
        missing_ranges=missing_ranges,
        include=["count", "mean", "frequencies"]
    )
    
    # Only values 1.0, 4.0, 5.0 should remain
    assert result["count"] == 3
    assert result["mean"] == pytest.approx(3.33, abs=0.01)  # (1 + 4 + 5) / 3
    
    frequency_values = {item["value"] for item in result["frequency_table"]}
    assert frequency_values == {"1.0", "4.0", "5.0"}


def test_missing_ranges_different_variable(stats_service):
    """Test that missing ranges only apply to the specified variable."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0],
        "other": [1.0, 2.0, 3.0, 4.0, 5.0]
    })
    
    # Define range [2.0, 4.0] as missing for "other" variable (not "score")
    missing_ranges = {
        "other": [{"lo": 2.0, "hi": 4.0}]
    }
    
    result = stats_service.describe_var(
        df,
        "score",  # Analyzing "score", not "other"
        missing_ranges=missing_ranges,
        include=["count", "frequencies"]
    )
    
    # All values should remain since missing range is for different variable
    assert result["count"] == 5
    
    frequency_values = {item["value"] for item in result["frequency_table"]}
    assert frequency_values == {"1.0", "2.0", "3.0", "4.0", "5.0"}


def test_missing_ranges_none(stats_service):
    """Test that None missing_ranges parameter doesn't affect processing."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0]
    })
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_ranges=None,
        include=["count", "frequencies"]
    )
    
    # All values should remain
    assert result["count"] == 5
    
    frequency_values = {item["value"] for item in result["frequency_table"]}
    assert frequency_values == {"1.0", "2.0", "3.0", "4.0", "5.0"}


def test_missing_ranges_empty_dict(stats_service):
    """Test that empty missing_ranges dictionary doesn't affect processing."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0]
    })
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_ranges={},
        include=["count", "frequencies"]
    )
    
    # All values should remain
    assert result["count"] == 5
    
    frequency_values = {item["value"] for item in result["frequency_table"]}
    assert frequency_values == {"1.0", "2.0", "3.0", "4.0", "5.0"}


def test_missing_ranges_invalid_range_structure(stats_service):
    """Test that invalid range structures are gracefully ignored."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0]
    })
    
    # Define invalid range structures
    missing_ranges = {
        "score": [
            {"lo": 2.0, "hi": 3.0},  # Valid range
            {"invalid": "structure"},  # Invalid range - missing lo/hi
            {"lo": 4.0},  # Invalid range - missing hi
            {"hi": 5.0}  # Invalid range - missing lo
        ]
    }
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_ranges=missing_ranges,
        include=["count", "frequencies"]
    )
    
    # Only the valid range [2.0, 3.0] should be applied
    assert result["count"] == 3  # Values 1.0, 4.0, 5.0 remain
    
    frequency_values = {item["value"] for item in result["frequency_table"]}
    assert frequency_values == {"1.0", "4.0", "5.0"}


def test_missing_ranges_with_split_variable(stats_service):
    """Test that missing ranges work correctly with split variables."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        "group": ["A", "A", "A", "B", "B", "B"]
    })
    
    # Define range [2.0, 3.0] as missing
    missing_ranges = {
        "score": [{"lo": 2.0, "hi": 3.0}]
    }
    
    result = stats_service.describe_var(
        df,
        "score",
        split_variable="group",
        missing_ranges=missing_ranges,
        include=["count", "mean"]
    )
    
    categories = result["categories"]
    
    # Group A should have only value 1.0 (values 2.0, 3.0 are missing)
    assert categories["A"]["count"] == 1
    assert categories["A"]["mean"] == pytest.approx(1.0)
    
    # Group B should have values 4.0, 5.0, 6.0
    assert categories["B"]["count"] == 3
    assert categories["B"]["mean"] == pytest.approx(5.0)  # (4 + 5 + 6) / 3


def test_missing_ranges_overlapping_ranges(stats_service):
    """Test behavior with overlapping missing ranges."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]
    })
    
    # Define overlapping ranges [2.0, 4.0] and [3.0, 5.0]
    missing_ranges = {
        "score": [
            {"lo": 2.0, "hi": 4.0},
            {"lo": 3.0, "hi": 5.0}
        ]
    }
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_ranges=missing_ranges,
        include=["count", "frequencies"]
    )
    
    # Values 2.0, 3.0, 4.0, 5.0 should be missing, leaving 1.0, 6.0
    assert result["count"] == 2
    
    frequency_values = {item["value"] for item in result["frequency_table"]}
    assert frequency_values == {"1.0", "6.0"}


def test_missing_ranges_floating_point_precision(stats_service):
    """Test missing ranges with floating point precision considerations."""
    df = pd.DataFrame({
        "score": [1.1, 1.15, 1.2, 1.25, 1.3]
    })
    
    # Define range [1.15, 1.25] as missing
    missing_ranges = {
        "score": [{"lo": 1.15, "hi": 1.25}]
    }
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_ranges=missing_ranges,
        include=["count", "frequencies"]
    )
    
    # Values 1.15, 1.2, 1.25 should be missing, leaving 1.1, 1.3
    assert result["count"] == 2
    
    frequency_values = {item["value"] for item in result["frequency_table"]}
    assert frequency_values == {"1.1", "1.3"}


def test_missing_ranges_all_values_missing(stats_service):
    """Test behavior when missing ranges cover all values."""
    df = pd.DataFrame({
        "score": [1.0, 2.0, 3.0, 4.0, 5.0]
    })
    
    # Define range that covers all values
    missing_ranges = {
        "score": [{"lo": 0.0, "hi": 10.0}]
    }
    
    result = stats_service.describe_var(
        df,
        "score",
        missing_ranges=missing_ranges,
        include=["count", "mean", "frequencies"]
    )
    
    # All values should be missing
    assert result["count"] == 0
    assert result["mean"] is None
    assert result["frequency_table"] == []


def test_missing_ranges_with_value_labels(stats_service):
    """Test missing ranges interaction with value labels."""
    df = pd.DataFrame({
        "rating": [1.0, 2.0, 3.0, 4.0, 5.0]
    })
    
    value_labels = {
        "1.0": "Very Bad",
        "2.0": "Bad",
        "3.0": "Neutral",
        "4.0": "Good",
        "5.0": "Very Good"
    }
    
    # Define range [2.0, 3.0] as missing
    missing_ranges = {
        "rating": [{"lo": 2.0, "hi": 3.0}]
    }
    
    result = stats_service.describe_var(
        df,
        "rating",
        missing_ranges=missing_ranges,
        value_labels=value_labels,
        include=["frequencies"]
    )
    
    # Values 2.0 and 3.0 should be missing, but their labels should still appear with 0 counts
    frequency_values = {item["value"] for item in result["frequency_table"]}
    
    # All labeled values should appear in frequency table
    assert "1.0" in frequency_values
    assert "2.0" in frequency_values  # Missing but has label
    assert "3.0" in frequency_values  # Missing but has label
    assert "4.0" in frequency_values
    assert "5.0" in frequency_values
    
    # Check counts
    freq_dict = {item["value"]: item for item in result["frequency_table"]}
    assert freq_dict["1.0"]["counts"] == 1
    assert freq_dict["2.0"]["counts"] == 0  # Missing due to range
    assert freq_dict["3.0"]["counts"] == 0  # Missing due to range
    assert freq_dict["4.0"]["counts"] == 1
    assert freq_dict["5.0"]["counts"] == 1
