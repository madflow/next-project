import pandas as pd


class StatisticsService:

    def describe_var(
        self,
        data: pd.DataFrame,
        variable_name: str,
        include: list[str] | None = None,
        missing_values: list[str | int | float] | None = None,
    ):
        """
        Generates descriptive statistics for a single variable in a DataFrame based on a list of requested metrics.
        The result is JSON serializable.

        Args:
            data: The input DataFrame.
            variable_name: The name of the variable (column) to describe.
            include: A list of strings specifying which statistics to calculate.
                     Possible values for numeric data: 'count', 'frequencies', 'mean', 'std', 'min', 'max', 'median',
                                                     'range'.
                     Possible values for all data types: 'mode', 'count'.
                     If None, a default set of statistics will be calculated based on the data type.
            missing_values: A list of values to replace with NaN.

        Returns:
            A dictionary containing the requested descriptive statistics.
        """
        if variable_name not in data.columns:
            raise ValueError(f"Variable '{variable_name}' not found in the DataFrame.")

        if missing_values is not None:
            numeric_missing_values = self._convert_to_numeric_missing_values(
                missing_values
            )
            data = data.replace(numeric_missing_values, pd.NA)
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
                if pd.notna(mean_val) == True:
                    stats["mean"] = float(mean_val)
                else:
                    stats["mean"] = None
            if "std" in include:
                std_val = variable.std()
                if pd.notna(std_val) == True:
                    stats["std"] = float(std_val)
                else:
                    stats["std"] = None
            if "min" in include:
                min_val = variable.min()
                if pd.notna(min_val) == True:
                    stats["min"] = float(min_val)
                else:
                    stats["min"] = None
            if "max" in include:
                max_val = variable.max()
                if pd.notna(max_val) == True:
                    stats["max"] = float(max_val)
                else:
                    stats["max"] = None
            if "median" in include:
                if variable.count() > 0:
                    median_val = variable.median()
                    if pd.notna(median_val) == True:
                        stats["median"] = float(median_val)
                    else:
                        stats["median"] = None
                else:
                    stats["median"] = None
            if "range" in include:
                min_val = variable.min()
                max_val = variable.max()
                if pd.notna(min_val) == True and pd.notna(max_val) == True:
                    stats["range"] = float(max_val - min_val)
                else:
                    stats["range"] = None

        if "frequencies" in include:
            counts = variable.value_counts()
            percentages = variable.value_counts(normalize=True) * 100
            frequency_table_df = pd.DataFrame(
                {"counts": counts, "percentages": percentages}
            )
            frequency_table_df.index.name = "value"
            frequency_table_df.reset_index(inplace=True)

            # Convert to records while preserving original string representation
            frequency_records = []
            for _, row in frequency_table_df.iterrows():
                value = row["value"]

                # Always preserve as string to maintain exact format (e.g., "1.0" stays "1.0")
                value = str(value) if pd.notna(value) == True else value

                frequency_records.append(
                    {
                        "value": value,
                        "counts": int(row["counts"]),
                        "percentages": float(row["percentages"]),
                    }
                )

            stats["frequency_table"] = frequency_records

        return stats

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
                value = value.strip()

                # Try to convert to int first (for whole numbers)
                try:
                    # Check if it's a whole number (no decimal point or .0)
                    if "." not in value or value.endswith(".0"):
                        int_val = int(
                            float(value)
                        )  # Convert via float to handle "123.0"
                        converted_values.append(int_val)
                    else:
                        # Convert to float for decimal numbers
                        float_val = float(value)
                        converted_values.append(float_val)
                    continue
                except ValueError:
                    pass  # Will raise error below

            # If we get here, conversion failed
            raise ValueError(
                f"Cannot convert missing_values[{i}] = '{value}' (type: {type(value).__name__}) "
                f"to a numeric value. All missing_values must be numeric or convertible to numeric."
            )

        return converted_values
