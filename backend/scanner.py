import pandas as pd
import numpy as np

def scan_dataframe(df: pd.DataFrame, filename: str) -> dict:
    summary = {
        "filename": filename,
        "rows": len(df),
        "columns": list(df.columns),
        "null_counts": df.isnull().sum().to_dict(),
        "duplicates": int(df.duplicated().sum()),
        "sample_rows": df.head(5).to_dict(orient="records"),
        "currency_symbols": {},
        "ambiguous_dates": {},
        "mixed_types": {}
    }
    
    for col in df.columns:
        # mixed types
        types = df[col].dropna().apply(type).unique()
        if len(types) > 1:
            summary["mixed_types"][col] = [t.__name__ for t in types]
            
        # currency symbols in string columns
        if df[col].dtype == 'object':
            str_col = df[col].dropna().astype(str)
            if str_col.str.contains(r'[\$€£¥₹]', regex=True).any():
                summary["currency_symbols"][col] = True
                
            # ambiguous dates (DD/MM vs MM/DD)
            date_matches = str_col.str.extract(r'^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$').dropna()
            if not date_matches.empty:
                first_parts = date_matches[0].astype(int)
                second_parts = date_matches[1].astype(int)
                if (first_parts > 12).any() and (second_parts > 12).any():
                    summary["ambiguous_dates"][col] = True
                elif not (first_parts > 12).any() and not (second_parts > 12).any():
                    summary["ambiguous_dates"][col] = True

    return summary

def detect_currency_conflict(scans: list) -> list:
    conflicts = []
    currency_map = {}
    for scan in scans:
        df = scan['df']
        fname = scan['filename']
        curr_cols = [c for c in df.columns if 'currency' in c.lower()]
        for c in curr_cols:
            unique_currs = df[c].dropna().unique()
            if len(unique_currs) > 0:
                currency_map[fname] = unique_currs[0]
                
    if len(set(currency_map.values())) > 1:
        conflicts.append(f"Currency conflict detected across files: {currency_map}")
        
    return conflicts
