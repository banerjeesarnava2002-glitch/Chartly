import pandas as pd
import math
from typing import List, Dict, Any, Optional


def _sanitize(data):
    """Recursively replace NaN/Inf with None for JSON compliance."""
    if isinstance(data, dict):
        return {k: _sanitize(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [_sanitize(v) for v in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
    return data


class TransformService:

    @staticmethod
    def filter_data(
        file_path: str,
        filters: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Apply one or more filter conditions to a dataset (AND logic).

        Each filter dict must have:
            column   : str  — column name
            operator : str  — one of: "eq", "neq", "gt", "gte", "lt", "lte", "contains", "not_contains"
            value    : str  — value to compare against (will be cast to column dtype where possible)

        Returns a dict with:
            data       : list of row records (up to 500 rows)
            row_count  : total rows after filtering
            col_count  : number of columns
            columns    : list of column names
        """
        df = pd.read_csv(file_path)
        df = df.where(pd.notnull(df), None)

        for f in filters:
            col = f.get("column")
            op = f.get("operator", "eq")
            raw_value = f.get("value", "")

            if col not in df.columns:
                continue

            # Try to cast value to numeric if column is numeric
            col_series = df[col]
            is_numeric = pd.api.types.is_numeric_dtype(col_series)

            try:
                value = float(raw_value) if is_numeric else raw_value
            except (ValueError, TypeError):
                value = raw_value

            if op == "eq":
                if is_numeric:
                    df = df[df[col] == value]
                else:
                    df = df[df[col].astype(str).str.lower() == str(value).lower()]
            elif op == "neq":
                if is_numeric:
                    df = df[df[col] != value]
                else:
                    df = df[df[col].astype(str).str.lower() != str(value).lower()]
            elif op == "gt":
                df = df[pd.to_numeric(df[col], errors="coerce") > float(value)]
            elif op == "gte":
                df = df[pd.to_numeric(df[col], errors="coerce") >= float(value)]
            elif op == "lt":
                df = df[pd.to_numeric(df[col], errors="coerce") < float(value)]
            elif op == "lte":
                df = df[pd.to_numeric(df[col], errors="coerce") <= float(value)]
            elif op == "contains":
                df = df[df[col].astype(str).str.lower().str.contains(str(value).lower(), na=False)]
            elif op == "not_contains":
                df = df[~df[col].astype(str).str.lower().str.contains(str(value).lower(), na=False)]

        row_count = len(df)
        records = df.head(500).to_dict(orient="records")

        return {
            "data": _sanitize(records),
            "row_count": row_count,
            "col_count": len(df.columns),
            "columns": df.columns.tolist(),
        }

    @staticmethod
    def aggregate_data(
        file_path: str,
        group_by: List[str],
        agg_col: str,
        agg_func: str = "sum",
    ) -> Dict[str, Any]:
        """
        Group by one or more columns and aggregate a target column.

        agg_func: "sum" | "mean" | "count" | "min" | "max" | "std"

        Returns:
            data       : list of row records
            row_count  : number of result rows
            col_count  : number of columns
            columns    : list of column names
        """
        df = pd.read_csv(file_path)
        df = df.where(pd.notnull(df), None)

        valid_group = [c for c in group_by if c in df.columns]
        if not valid_group:
            return {"data": [], "row_count": 0, "col_count": 0, "columns": []}

        # Special "count" aggregation (no agg_col needed)
        if agg_func == "count" or agg_col == "__count__" or agg_col not in df.columns:
            result = df.groupby(valid_group, as_index=False).size()
            result = result.rename(columns={"size": "count"})
        else:
            func_map = {
                "sum": "sum",
                "mean": "mean",
                "min": "min",
                "max": "max",
                "std": "std",
            }
            pandas_func = func_map.get(agg_func, "sum")
            result = df.groupby(valid_group, as_index=False)[agg_col].agg(pandas_func)
            # Round numeric output to 4 decimal places
            if pd.api.types.is_numeric_dtype(result[agg_col]):
                result[agg_col] = result[agg_col].round(4)

        result = result.sort_values(result.columns[-1], ascending=False)
        records = result.head(200).to_dict(orient="records")

        return {
            "data": _sanitize(records),
            "row_count": len(result),
            "col_count": len(result.columns),
            "columns": result.columns.tolist(),
        }

    @staticmethod
    def pivot_data(
        file_path: str,
        index: str,
        columns: str,
        values: str,
        agg_func: str = "sum",
    ) -> Dict[str, Any]:
        """
        Create a pivot table.

        Parameters:
            index    : row grouping column
            columns  : column grouping column
            values   : values column to aggregate
            agg_func : "sum" | "mean" | "count" | "min" | "max"

        Returns:
            data       : list of row records (index as first key)
            row_count  : number of rows
            col_count  : number of columns (including index)
            columns    : list of column headers
        """
        df = pd.read_csv(file_path)
        df = df.where(pd.notnull(df), None)

        for col in [index, columns, values]:
            if col not in df.columns and col != "__count__":
                return {"data": [], "row_count": 0, "col_count": 0, "columns": []}

        func_map = {
            "sum": "sum",
            "mean": "mean",
            "count": "count",
            "min": "min",
            "max": "max",
        }
        agg_fn = func_map.get(agg_func, "sum")

        pivot = pd.pivot_table(
            df,
            values=values,
            index=index,
            columns=columns,
            aggfunc=agg_fn,
            fill_value=0,
        )

        # Flatten multi-level column names
        pivot.columns = [str(c) for c in pivot.columns]
        pivot = pivot.reset_index()

        # Round numeric columns
        for c in pivot.columns:
            if pd.api.types.is_numeric_dtype(pivot[c]):
                pivot[c] = pivot[c].round(2)

        records = pivot.head(200).to_dict(orient="records")
        col_headers = pivot.columns.tolist()

        return {
            "data": _sanitize(records),
            "row_count": len(pivot),
            "col_count": len(col_headers),
            "columns": col_headers,
        }
