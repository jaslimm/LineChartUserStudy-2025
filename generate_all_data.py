import os
from generate_patterns.upward import generate_upward_trend_with_event_fluctuations
from generate_patterns.irregular import generate_clustering_line_graph_to_json
from generate_patterns.downward import generate_downward_trend_with_event_fluctuations
from generate_patterns.peakvalley import generate_random_walk_peak_data
from generate_patterns.peakvalley2 import generate_random_walk_valley_data

# import other 6 pattern functions here

import numpy as np
import pandas as pd
import random

data_folder = "data"
os.makedirs(data_folder, exist_ok=True)

def save_data(df, filename):
    path = os.path.join(data_folder, filename)
    df.to_json(path, orient='records')
    print(f"✅ Saved: {path}")

def main():
    rd = random.randint(1, 999)
    df = generate_upward_trend_with_event_fluctuations(
        num_points=50, 
        y_int=27, 
        variability=(6, 7), 
        trend_strengths=(0.5, 2), 
        split_year=2005,
        event_years=[2012, 2019],
        include_plateaus=True,
        random_seed=rd
    )
    save_data(df, f"{rd}_upward.json")

    # Repeat for all 6 other patterns
    # df = generate_downward(...)
    # save_data(df, f"{rd}_downward.json")

    # df = generate_clustering_line_graph_to_json(
    # slope=-3.5,
    # intercept=65, 
    # num_points=60, 
    # noise_prob=0.7, 
    # clustering_prob=0.8, 
    # noise_std=2,
    # random_seed=120,
    # )
    # save_data(df, f"{rd}_irregular.json")


if __name__ == "__main__":
    main()
