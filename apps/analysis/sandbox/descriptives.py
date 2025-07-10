import sys

import pandas as pd

spss_file = sys.argv[1]

df = pd.read_spss(spss_file)

target = "recv12b_2"

# count occurrence of each value in 'team' column
counts = df[target].value_counts()

# count occurrence of each value in 'team' column as percentage of total
percs = df[target].value_counts(normalize=True)

res = pd.concat([counts, percs], axis=1, keys=["count", "percentage"])

print(res.to_json())
