import json
import sys

import pandas as pd

from analysis.services.stats import StatisticsService

spss_file = sys.argv[1]

df = pd.read_spss(spss_file, convert_categoricals=False)

target = "Bundesland"

# print(df.head())

stats = StatisticsService()

res = stats.describe_var(df, target)

print(json.dumps(res))
