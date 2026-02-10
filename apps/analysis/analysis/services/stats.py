from typing import Any, Dict, List, Optional

import pandas as pd


class StatisticsService:
    """Service for calculating descriptive statistics for variables."""

    def _round_if_needed(self, value: float, decimal_places: int | None) -> float:
        """Round a float value to specified decimal places if provided."""
        if decimal_places is not None and value is not None:
            return round(value, decimal_places)
        return value

    def describe_var(
        self,
        data: pd.DataFrame,
        variable_name: str,
        include: list[str] | None = None,
        missing_values: list[str | int | float] | None = None,
        missing_ranges: Optional[List[Dict[str, float]]] = None,
        value_labels: dict[str, str] | None = None,
        split_variable: str | None = None,
        split_variable_value_labels: dict[str, str] | None = None,
        split_variable_missing_values: list[str | int | float] | None = None,
        split_variable_missing_ranges: Optional[List[Dict[str, float]]] = None,
        decimal_places: int | None = 2,
    ) -> dict:
        """
        Generates descriptive statistics for a single variable in a DataFrame
        based on a list of requested metrics. The result is JSON serializable.

        Args:
            data: The input DataFrame.
            variable_name: The name of the variable (column) to describe.
            include: A list of strings specifying which statistics to calculate.
                     Possible values for numeric data: 'count', 'frequencies',
                     'mean', 'std', 'min', 'max', 'median', 'range'.
                     Possible values for all data types: 'mode', 'count'.
                     If None, a default set of statistics will be calculated
                     based on the data type.
            missing_values: A list of values to replace with NaN for the main
                           variable.
            missing_ranges: A dictionary specifying ranges of values to treat
                            as missing for the main variable.
            value_labels: A dictionary mapping values to labels. All keys from
                         this dict (except those in missing_values) will be
                         included in the frequency table, even if they have 0
                         counts.
            split_variable: Optional variable name to use for cross-tabulation.
                           When provided, statistics will be calculated for each
                           category of the split variable.
            split_variable_value_labels: Value labels for the split variable.
            split_variable_missing_values: A list of values to treat as missing
                                          for the split variable.
            split_variable_missing_ranges: Ranges of values to treat as missing
                                          for the split variable.
            decimal_places: Number of decimal places to round numeric statistics
                           to (mean, std, percentages, etc.). If None, no
                           rounding is applied.

        Returns:
            A dictionary containing the requested descriptive statistics. If
            split_variable is provided, returns statistics broken down by split
            variable categories.
        """
        if variable_name not in data.columns:
            raise ValueError(f"Variable '{variable_name}' not found in the DataFrame.")

        if split_variable is not None:
            if split_variable not in data.columns:
                raise ValueError(
                    f"Split variable '{split_variable}' not found in the DataFrame.",
                )
            return self._describe_var_with_split(
                data,
                variable_name,
                split_variable,
                include,
                missing_values,
                missing_ranges,
                value_labels,
                split_variable_value_labels,
                split_variable_missing_values,
                split_variable_missing_ranges,
                decimal_places,
            )

        if missing_values is not None:
            numeric_missing_values = self._convert_to_numeric_missing_values(
                missing_values,
            )
            data = data.replace(numeric_missing_values, pd.NA)

        # Apply missing ranges to mark values within ranges as missing
        if missing_ranges is not None:
            data = self._apply_missing_ranges(data, variable_name, missing_ranges)

        return self._calculate_single_var_stats(
            data,
            variable_name,
            include,
            missing_values,
            missing_ranges,
            value_labels,
            decimal_places,
        )

    def _apply_missing_ranges(
        self,
        data: pd.DataFrame,
        variable_name: str,
        missing_ranges: Optional[List[Dict[str, float]]] = None,
    ) -> pd.DataFrame:
        """
        Apply missing ranges to mark values within specified ranges as missing (pd.NA).

        Args:
            data: The input DataFrame to modify
            variable_name: The name of the variable to apply missing ranges to
            missing_ranges: List of range objects with 'lo' and 'hi' keys
                defining inclusive ranges

        Returns:
            Modified DataFrame with values in specified ranges replaced with pd.NA
        """
        if missing_ranges is None:
            return data

        # Make a copy to avoid modifying the original data
        data = data.copy()
        variable = data[variable_name]

        # Apply each range for this variable
        for range_obj in missing_ranges:
            if (
                not isinstance(range_obj, dict)
                or "lo" not in range_obj
                or "hi" not in range_obj
            ):
                continue

            lo = range_obj["lo"]
            hi = range_obj["hi"]

            # Create mask for values within the range (inclusive)
            mask = (variable >= lo) & (variable <= hi)

            # Replace values within range with pd.NA
            data.loc[mask, variable_name] = pd.NA

        return data

    def _convert_to_numeric_missing_values(self, missing_values: list) -> list:
        """
        Converts missing_values to numeric types (int or float).

        Args:
            missing_values: List of values to convert to numeric

        Returns:
            List of converted numeric values

        Raises:
            ValueError: If any value cannot be converted to a numeric type
        """
        converted_values = []

        for i, value in enumerate(missing_values):
            # If already numeric, keep as is
            if isinstance(value, (int, float)):
                converted_values.append(value)
                continue

            # Try to convert string to numeric
            if isinstance(value, str):
                # Remove whitespace
                stripped_value = value.strip()

                # Try to convert to int first (for whole numbers)
                try:
                    # Check if it's a whole number (no decimal point or .0)
                    if "." not in stripped_value or stripped_value.endswith(".0"):
                        int_val = int(
                            float(stripped_value),
                        )  # Convert via float to handle "123.0"
                        converted_values.append(int_val)
                    else:
                        # Convert to float for decimal numbers
                        float_val = float(stripped_value)
                        converted_values.append(float_val)
                    continue
                except ValueError:
                    pass  # Will raise error below

            # If we get here, conversion failed
            raise ValueError(
                f"Cannot convert missing_values[{i}] = '{stripped_value if isinstance(value, str) else value}' "
                f"(type: {type(value).__name__}) "
                f"to a numeric value. All missing_values must be numeric "
                f"or convertible to numeric.",
            )

        return converted_values

    def get_missing_ranges_values(
        self,
        missing_ranges: Optional[List[Dict[str, float]]],
    ) -> set:
        """
        Get all values that fall within the missing ranges.

        Args:
            missing_ranges: List of range objects with 'lo' and 'hi' keys

        Returns:
            Set of values (as strings) that fall within the missing ranges
        """
        missing_set = set()
        if missing_ranges is None:
            return missing_set

        for range_obj in missing_ranges:
            if (
                not isinstance(range_obj, dict)
                or "lo" not in range_obj
                or "hi" not in range_obj
            ):
                continue

            lo = range_obj["lo"]
            hi = range_obj["hi"]

            # For each value in the range (assuming integer ranges like
            # 97-97, 98-98, 99-99)
            # Generate all possible values in the range
            if isinstance(lo, (int, float)) and isinstance(hi, (int, float)):
                # For ranges like 97-97, 98-98, this will add just that single value
                # For ranges like 97-99, this will add 97, 98, 99
                current = lo
                while current <= hi:
                    # Add different string representations
                    missing_set.add(str(current))
                    missing_set.add(str(float(current)))
                    if isinstance(current, int) or current.is_integer():
                        missing_set.add(f"{int(current)}.0")
                        missing_set.add(str(int(current)))
                    current += 1

        return missing_set

    def _describe_var_with_split(
        self,
        data: pd.DataFrame,
        variable_name: str,
        split_variable: str,
        include: list[str] | None = None,
        missing_values: list[str | int | float] | None = None,
        missing_ranges: Optional[List[Dict[str, float]]] = None,
        value_labels: dict[str, str] | None = None,
        split_variable_value_labels: dict[str, str] | None = None,
        split_variable_missing_values: list[str | int | float] | None = None,
        split_variable_missing_ranges: Optional[List[Dict[str, float]]] = None,
        decimal_places: int | None = 2,
    ) -> dict:
        """
        Generate descriptive statistics for a variable split by categories
        of another variable.

        Args:
            data: The input DataFrame.
            variable_name: The name of the main variable to describe.
            split_variable: The name of the variable to split by.
            include: Statistics to calculate.
            missing_values: Values to treat as missing for the main variable.
            value_labels: Value labels for the main variable.
            split_variable_value_labels: Value labels for the split variable.
            split_variable_missing_values: Values to treat as missing for the
                                          split variable.

        Returns:
            Dictionary with split variable categories as keys, each containing
            statistics for the main variable.
        """
        if missing_values is not None:
            numeric_missing_values = self._convert_to_numeric_missing_values(
                missing_values,
            )
            data = data.replace(numeric_missing_values, pd.NA)

        # Apply missing ranges to main variable
        if missing_ranges is not None:
            data = self._apply_missing_ranges(data, variable_name, missing_ranges)

        # Filter out missing values for the split variable
        if split_variable_missing_values is not None:
            split_numeric_missing_values = self._convert_to_numeric_missing_values(
                split_variable_missing_values,
            )
            # Create mask for split variable missing values
            split_missing_mask = data[split_variable].isin(split_numeric_missing_values)
            # Keep only rows where split variable is not missing
            data = data.loc[~split_missing_mask].copy()

        # Apply missing ranges to split variable
        if split_variable_missing_ranges is not None:
            data = self._apply_missing_ranges(
                data,
                split_variable,
                split_variable_missing_ranges,
            )

        # Get unique categories from split variable (excluding NA and missing values)
        split_categories = data[split_variable].dropna().unique()

        # Sort categories in ascending order
        def sort_key(item: Any) -> tuple[int, float | str]:
            try:
                return (0, float(item))  # Numeric values get priority
            except (ValueError, TypeError):
                return (1, str(item))  # String values come after numbers

        split_categories = sorted(split_categories, key=sort_key)

        # Create result structure with split categories
        result = {
            "split_variable": split_variable,
            "categories": {},
            "split_variable_labels": split_variable_value_labels or {},
        }

        # Calculate statistics for each split category
        for category in split_categories:
            mask = data[split_variable] == category
            category_data = data.loc[mask].copy()
            category_stats = self._calculate_single_var_stats(
                category_data,
                variable_name,
                include,
                missing_values,
                missing_ranges,
                value_labels,
                decimal_places,
            )

            # Convert category to string for JSON serialization
            category_key = str(category)
            result["categories"][category_key] = category_stats

        return result

    def _calculate_single_var_stats(  # noqa: C901, PLR0912, PLR0915
        self,
        data: pd.DataFrame,
        variable_name: str,
        include: list[str] | None = None,
        missing_values: list[str | int | float] | None = None,
        missing_ranges: Optional[List[Dict[str, float]]] = None,
        value_labels: dict[str, str] | None = None,
        decimal_places: int | None = 2,
    ) -> dict:
        """Calculate statistics for a single variable."""
        variable = data[variable_name]
        stats = {}

        # Set default includes if none are provided
        if include is None:
            if pd.api.types.is_numeric_dtype(variable):
                include = [
                    "count",
                    "frequencies",
                    "mean",
                    "std",
                    "min",
                    "max",
                    "median",
                    "range",
                    "mode",
                ]
            else:
                include = ["count", "mode", "frequencies"]

        # --- General Statistics ---
        if "count" in include:
            stats["count"] = int(variable.count())

        if "mode" in include:
            stats["mode"] = variable.mode().tolist()

        # --- Numeric-only Statistics ---
        if pd.api.types.is_numeric_dtype(variable):
            if "mean" in include:
                mean_val = variable.mean()
                if mean_val is not None and str(mean_val) != "nan":
                    stats["mean"] = self._round_if_needed(
                        float(mean_val),
                        decimal_places,
                    )
                else:
                    stats["mean"] = None
            if "std" in include:
                std_val = variable.std()
                if std_val is not None and str(std_val) != "nan":
                    stats["std"] = self._round_if_needed(float(std_val), decimal_places)
                else:
                    stats["std"] = None
            if "min" in include:
                min_val = variable.min()
                if min_val is not None and str(min_val) != "nan":
                    stats["min"] = self._round_if_needed(float(min_val), decimal_places)
                else:
                    stats["min"] = None
            if "max" in include:
                max_val = variable.max()
                if max_val is not None and str(max_val) != "nan":
                    stats["max"] = self._round_if_needed(float(max_val), decimal_places)
                else:
                    stats["max"] = None
            if "median" in include:
                if variable.count() > 0:
                    median_val = variable.median()
                    if median_val is not None and str(median_val) != "nan":
                        stats["median"] = self._round_if_needed(
                            float(median_val),
                            decimal_places,
                        )
                    else:
                        stats["median"] = None
                else:
                    stats["median"] = None
            if "range" in include:
                min_val = variable.min()
                max_val = variable.max()
                if (
                    min_val is not None
                    and str(min_val) != "nan"
                    and max_val is not None
                    and str(max_val) != "nan"
                ):
                    stats["range"] = self._round_if_needed(
                        float(max_val - min_val),
                        decimal_places,
                    )
                else:
                    stats["range"] = None

        if "frequencies" in include:
            counts = variable.value_counts()
            percentages = variable.value_counts(normalize=True) * 100
            frequency_table_df = pd.DataFrame(
                {"counts": counts, "percentages": percentages},
            )
            frequency_table_df.index.name = "value"
            frequency_table_df.reset_index(inplace=True)

            # Convert to records while preserving original string representation
            frequency_records = []

            # If value_labels are provided, ensure all valid labels are included
            if value_labels is not None:
                # Get the missing values for filtering
                missing_set = set()
                if missing_values is not None:
                    # Convert missing values to their various string
                    # representations for comparison
                    numeric_missing_values = self._convert_to_numeric_missing_values(
                        missing_values,
                    )
                    for mv in numeric_missing_values:
                        # Add both integer and float string representations
                        missing_set.add(str(mv))
                        missing_set.add(str(float(mv)))
                        if isinstance(mv, int):
                            missing_set.add(f"{mv}.0")
                        elif isinstance(mv, float) and mv.is_integer():
                            missing_set.add(str(int(mv)))

                # Add missing ranges values to the missing set
                if missing_ranges is not None:
                    missing_ranges_set = self.get_missing_ranges_values(missing_ranges)
                    missing_set.update(missing_ranges_set)

                # Create a set of all valid label keys
                # (excluding missing values and ranges)
                valid_label_keys = set()
                for key in value_labels:
                    if key not in missing_set:
                        valid_label_keys.add(key)

                # Create a mapping from actual values
                value_to_data = {}

                # First, add all values that appear in the data
                for _, row in frequency_table_df.iterrows():
                    value = row["value"]
                    try:
                        value_str = str(value) if pd.notna(value).item() else value
                    except (AttributeError, ValueError):
                        value_str = str(value)

                    value_to_data[value_str] = {
                        "counts": int(row["counts"]),
                        "percentages": self._round_if_needed(
                            float(row["percentages"]),
                            decimal_places,
                        ),
                    }

                # Then, add all valid label keys with 0 counts if they don't exist
                for label_key in valid_label_keys:
                    if label_key not in value_to_data:
                        value_to_data[label_key] = {
                            "counts": 0,
                            "percentages": self._round_if_needed(0.0, decimal_places),
                        }

                # Convert to frequency records
                for value_str, freq_data in value_to_data.items():
                    frequency_records.append(
                        {
                            "value": value_str,
                            "counts": freq_data["counts"],
                            "percentages": freq_data["percentages"],
                        },
                    )
            else:
                # Original behavior when no value_labels are provided
                for _, row in frequency_table_df.iterrows():
                    value = row["value"]
                    # Always preserve as string to maintain exact format
                    # (e.g., "1.0" stays "1.0")
                    try:
                        value = str(value) if pd.notna(value).item() else value
                    except (AttributeError, ValueError):
                        value = str(value)

                    frequency_records.append(
                        {
                            "value": value,
                            "counts": int(row["counts"]),
                            "percentages": self._round_if_needed(
                                float(row["percentages"]),
                                decimal_places,
                            ),
                        },
                    )

            # Sort frequency records by value (numeric first, then string)
            def sort_key(item: dict[str, Any]) -> tuple[int, float | str]:
                try:
                    return (0, float(item["value"]))  # Numeric values get priority
                except (ValueError, TypeError):
                    return (1, str(item["value"]))  # String values come after numbers

            frequency_records.sort(key=sort_key)
            stats["frequency_table"] = frequency_records

        return stats
