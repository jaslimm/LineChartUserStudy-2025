import os
import numpy as np
import pandas as pd
import random
import json

# === Generator Function for Upward Only ===
def generate_upward_trend_with_event_fluctuations(
    num_points,
    y_int,
    variability,
    trend_strengths,
    split_year,
    random_seed,
    event_years,
    include_plateaus,
):
    if random_seed is not None:
        np.random.seed(random_seed)

    x = np.linspace(2000, 2020, num_points)
    split_index = np.searchsorted(x, split_year)

    trend_1 = y_int + trend_strengths[0] * np.arange(split_index)
    trend_2 = trend_1[-1] + trend_strengths[1] * np.arange(num_points - split_index)
    upward_trend = np.concatenate([trend_1, trend_2])

    sine_var_1 = variability[0] * np.sin(np.linspace(0, np.pi, split_index))
    sine_var_2 = variability[1] * np.sin(np.linspace(0, np.pi, num_points - split_index))
    random_var_1 = np.random.normal(0, variability[0] / 2, split_index)
    random_var_2 = np.random.normal(0, variability[1] / 2, num_points - split_index)

    y = (
        upward_trend
        + np.concatenate([sine_var_1, sine_var_2])
        + np.concatenate([random_var_1, random_var_2])
    )
    y += 1.5 * np.sin(np.linspace(0, 5 * np.pi, num_points))
    y += np.cumsum(np.random.normal(0, 0.3, num_points))

    if event_years:
        for year in event_years:
            i = np.searchsorted(x, year)
            for offset, factor in zip([0, 1, 2, 3, 4], [1.0, 0.85, 0.6, 0.4, 0.2]):
                if i + offset < len(y):
                    y[i + offset] -= np.random.uniform(3, 10) * factor
            for offset, factor in zip([5, 6, 7, 8, 9], [0.8, 0.6, 0.5, 0.3, 0.1]):
                if i + offset < len(y):
                    y[i + offset] += np.random.uniform(5, 20) * factor
                if include_plateaus and i + 10 < len(y):
                    y[i + 10] = y[i + 9]

    y = np.clip(y, 0, 100)
    return pd.DataFrame({"X": x, "Y": y})


# === CONFIG ===
CONFIG = {
    "Upward": {
        "type_1": {
            "count": 10,
            "params": {
                "num_points": 50,
                "variability": (4, 6),
                "trend_strengths": (0.5, 1),
                "split_year": 2008,
                "event_years": [2012, 2019],
                "include_plateaus": True,
            },
        },
        "type_2": {
            "count": 4,
            "params": {
                "num_points": 50,
                "variability": (6, 8),
                "trend_strengths": (0.5, 2),
                "split_year": 2010,
                "event_years": [2011, 2016],
                "include_plateaus": False,
            },
        },
        "type_3": {
            "count": 4,
            "params": {
                "num_points": 40,
                "variability": (3, 5),
                "trend_strengths": (0.5, 1.0),
                "split_year": 2006,
                "event_years": [2013, 2017],
                "include_plateaus": True,
            },
        },
        "type_4": {
            "count": 4,
            "params": {
                "num_points": 45,
                "variability": (2, 3),
                "trend_strengths": (1, 2),
                "split_year": 2007,
                "event_years": [2014, 2016],
                "include_plateaus": True,
            },
        },
        "type_5": {
            "count": 5,
            "params": {
                "num_points": 50,
                "variability": (1.5, 1.5),
                "trend_strengths": (0.5, 1),
                "split_year": 2005,
                "event_years": [2009, 2013],
                "include_plateaus": True,
            },
        },
        "type_6": {
            "count": 4,
            "params": {
                "num_points": 35,
                "variability": (2, 2.5),
                "trend_strengths": (1.0, 2.0),
                "split_year": 2006,
                "event_years": [2011, 2015],
                "include_plateaus": False,
            },
        },
    }
}

# === Output Folder ===
OUTPUT_FOLDER = "data/Upward"

# === Generation Function ===
def generate_upward_variants():
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    generator = generate_upward_trend_with_event_fluctuations

    for variant, config in CONFIG["Upward"].items():
        count = config["count"]
        base_params = config["params"].copy()

        for i in range(count):
            seed = random.randint(1000, 9999)
            base_params["random_seed"] = seed

            # Dynamically determine y_int based on trend strength
            strength_1 = abs(base_params["trend_strengths"][0])
            strength_2 = abs(base_params["trend_strengths"][1])
            avg_strength = (strength_1 + strength_2) / 2

            # More nuanced y_int with variation (lower y_int for more room to grow)
            if avg_strength >= 1.5:
                base = random.randint(0, 20)
                y_int = base + random.randint(-3, 5)
            elif avg_strength >= 1.2:
                base = random.randint(10, 30)
                y_int = base + random.randint(-5, 10)
            elif avg_strength >= 0.7:
                base = random.randint(20, 45)
                y_int = base + random.randint(-10, 10)
            else:
                base = random.randint(30, 55)
                y_int = base + random.randint(-10, 10)

            y_int = max(0, min(y_int, 100))
            base_params["y_int"] = y_int

            df = generator(**base_params)
            df["Y"] = np.clip(df["Y"], 0, 100)

            filename = f"upward_{variant}_{i + 1}.json"
            filepath = os.path.join(OUTPUT_FOLDER, filename)
            df.to_json(filepath, orient="records")
            print(f"✅ Saved: {filepath} (y_int={y_int}, strength={avg_strength:.2f})")


# === Run Script ===
if __name__ == "__main__":
    generate_upward_variants()
