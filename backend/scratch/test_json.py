import pandas as pd
import json

data = {
    'ID': [1, 2, 3],
    'NAME': ['Item 1', 'Item 2', 'Item 3'],
    'VALUE': [100, 200, 300]
}
df = pd.DataFrame(data)
desc = df.describe(include='all').reset_index()
desc = desc.where(pd.notnull(desc), None)
records = desc.to_dict(orient="records")

try:
    json_str = json.dumps(records)
    print("JSON Success")
except ValueError as e:
    print(f"JSON Error: {e}")
    # Print the offending records
    for i, record in enumerate(records):
        print(f"Record {i}: {record}")
