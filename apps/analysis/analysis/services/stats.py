import pandas as pd


class StatisticsService:

    def describe_var(
        self, data: pd.DataFrame, variable_name: str, include: list[str] | None = None
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

        Returns:
            A dictionary containing the requested descriptive statistics.
        """
        if variable_name not in data.columns:
            raise ValueError(f"Variable '{variable_name}' not found in the DataFrame.")

        data = data.replace(-999.0, pd.NA)
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
