import pandas as pd


class StatisticsService:

    def describe_var(
        self,
        data: pd.DataFrame,
        variable_name: str,
        include: list[str] | None = None,
        missing_values: list[str | int | float] | None = None,
        value_labels: dict[str, str] | None = None,
        split_variable: str | None = None,
        split_variable_value_labels: dict[str, str] | None = None,
        split_variable_missing_values: list[str | int | float] | None = None,
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
            missing_values: A list of values to replace with NaN for the main variable.
            value_labels: A dictionary mapping values to labels. All keys from this dict (except those in missing_values)
                         will be included in the frequency table, even if they have 0 counts.
            split_variable: Optional variable name to use for cross-tabulation. When provided, statistics will be 
                           calculated for each category of the split variable.
            split_variable_value_labels: Value labels for the split variable.
            split_variable_missing_values: A list of values to treat as missing for the split variable.

        Returns:
            A dictionary containing the requested descriptive statistics. If split_variable is provided,
            returns statistics broken down by split variable categories.
        """
        if variable_name not in data.columns:
            raise ValueError(f"Variable '{variable_name}' not found in the DataFrame.")
        
        if split_variable is not None:
            if split_variable not in data.columns:
                raise ValueError(f"Split variable '{split_variable}' not found in the DataFrame.")
            return self._describe_var_with_split(
                data, variable_name, split_variable, include, missing_values, value_labels, split_variable_value_labels, split_variable_missing_values
            )

        if missing_values is not None:
            numeric_missing_values = self._convert_to_numeric_missing_values(
                missing_values
            )
            data = data.replace(numeric_missing_values, pd.NA)
            
        return self._calculate_single_var_stats(data, variable_name, include, missing_values, value_labels)

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

    def _describe_var_with_split(
        self,
        data: pd.DataFrame,
        variable_name: str,
        split_variable: str,
        include: list[str] | None = None,
        missing_values: list[str | int | float] | None = None,
        value_labels: dict[str, str] | None = None,
        split_variable_value_labels: dict[str, str] | None = None,
        split_variable_missing_values: list[str | int | float] | None = None,
    ):
        """
        Generate descriptive statistics for a variable split by categories of another variable.
        
        Args:
            data: The input DataFrame.
            variable_name: The name of the main variable to describe.
            split_variable: The name of the variable to split by.
            include: Statistics to calculate.
            missing_values: Values to treat as missing for the main variable.
            value_labels: Value labels for the main variable.
            split_variable_value_labels: Value labels for the split variable.
            split_variable_missing_values: Values to treat as missing for the split variable.
            
        Returns:
            Dictionary with split variable categories as keys, each containing statistics for the main variable.
        """
        if missing_values is not None:
            numeric_missing_values = self._convert_to_numeric_missing_values(missing_values)
            data = data.replace(numeric_missing_values, pd.NA)
        
        # Filter out missing values for the split variable
        if split_variable_missing_values is not None:
            split_numeric_missing_values = self._convert_to_numeric_missing_values(split_variable_missing_values)
            # Create mask for split variable missing values
            split_missing_mask = data[split_variable].isin(split_numeric_missing_values)
            # Keep only rows where split variable is not missing
            data = data.loc[~split_missing_mask].copy()
        
        # Get unique categories from split variable (excluding NA and missing values)
        split_categories = data[split_variable].dropna().unique()
        
        # Sort categories in ascending order
        def sort_key(item):
            try:
                return (0, float(item))  # Numeric values get priority
            except (ValueError, TypeError):
                return (1, str(item))   # String values come after numbers
        
        split_categories = sorted(split_categories, key=sort_key)
        
        # Create result structure with split categories
        result = {
            "split_variable": split_variable,
            "categories": {},
            "split_variable_labels": split_variable_value_labels or {}
        }
        
        # Calculate statistics for each split category
        for category in split_categories:
            mask = data[split_variable] == category
            category_data = data.loc[mask].copy()
            category_stats = self._calculate_single_var_stats(
                category_data, variable_name, include, missing_values, value_labels
            )
            
            # Convert category to string for JSON serialization
            category_key = str(category)
            result["categories"][category_key] = category_stats
            
        return result
    
    def _calculate_single_var_stats(
        self,
        data: pd.DataFrame,
        variable_name: str,
        include: list[str] | None = None,
        missing_values: list[str | int | float] | None = None,
        value_labels: dict[str, str] | None = None,
    ):
        """
        Calculate statistics for a single variable (extracted from main describe_var method).
        """
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
            
            # If value_labels are provided, ensure all valid labels are included
            if value_labels is not None:
                # Get the missing values for filtering
                missing_set = set()
                if missing_values is not None:
                    # Convert missing values to their various string representations for comparison
                    numeric_missing_values = self._convert_to_numeric_missing_values(missing_values)
                    for mv in numeric_missing_values:
                        # Add both integer and float string representations
                        missing_set.add(str(mv))
                        missing_set.add(str(float(mv)))
                        if isinstance(mv, int):
                            missing_set.add(f"{mv}.0")
                        elif isinstance(mv, float) and mv.is_integer():
                            missing_set.add(str(int(mv)))
                
                # Create a set of all valid label keys (excluding missing values)
                valid_label_keys = set()
                for key in value_labels.keys():
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
                        "percentages": float(row["percentages"])
                    }
                
                # Then, add all valid label keys with 0 counts if they don't exist
                for label_key in valid_label_keys:
                    if label_key not in value_to_data:
                        value_to_data[label_key] = {
                            "counts": 0,
                            "percentages": 0.0
                        }
                
                # Convert to frequency records
                for value_str, data in value_to_data.items():
                    frequency_records.append({
                        "value": value_str,
                        "counts": data["counts"],
                        "percentages": data["percentages"],
                    })
            else:
                # Original behavior when no value_labels are provided
                for _, row in frequency_table_df.iterrows():
                    value = row["value"]
                    # Always preserve as string to maintain exact format (e.g., "1.0" stays "1.0")
                    try:
                        value = str(value) if pd.notna(value).item() else value
                    except (AttributeError, ValueError):
                        value = str(value)

                    frequency_records.append(
                        {
                            "value": value,
                            "counts": int(row["counts"]),
                            "percentages": float(row["percentages"]),
                        }
                    )
            
            # Sort frequency records by value (numeric first, then string)
            def sort_key(item):
                try:
                    return (0, float(item["value"]))  # Numeric values get priority
                except (ValueError, TypeError):
                    return (1, str(item["value"]))   # String values come after numbers
            
            frequency_records.sort(key=sort_key)
            stats["frequency_table"] = frequency_records

        return stats
