import os
import numpy as np
import pandas as pd
import random
import json

# === Peak Generator ===
def generate_random_walk_peak_data(
    num_points,
    num_peaks,
    peak_height_range,
    noise_prob,
    noise_amplitude,
    y_intercept,
    slope,
    random_seed,
):
    if random_seed is not None:
        np.random.seed(random_seed)
        random.seed(random_seed)

    x = np.linspace(2000, 2020, num_points)
    y = np.zeros(num_points)
    y[0] = y_intercept

    # Random walk + slope
    for i in range(1, num_points):
        y[i] = y[i - 1] + np.random.normal(0, 1) + slope

    # Inject peaks
    peak_indexes = sorted(random.sample(range(10, num_points - 10), num_peaks))
    # One prominent peak > 8
    prominent_peak = random.uniform(12.1, peak_height_range[1])

    # Other peaks < 5
    other_peaks = np.random.uniform(peak_height_range[0], min(5, peak_height_range[1]), num_peaks - 1)

    # Insert prominent peak at random index
    peak_heights = np.insert(other_peaks, random.randint(0, num_peaks - 1), prominent_peak)


    # Ensure at least one peak is above 8
    if all(h <= 10 for h in peak_heights):
        peak_heights[random.randint(0, num_peaks - 1)] = random.uniform(8.1, peak_height_range[1])

    for i, peak_idx in enumerate(peak_indexes):
        y[peak_idx] += peak_heights[i]
        for j in range(1, 6):
            if peak_idx - j >= 0:
                y[peak_idx - j] += peak_heights[i] * (1 - j / 5)
            if peak_idx + j < num_points:
                y[peak_idx + j] += peak_heights[i] * (1 - j / 5)

    # Add noise
    noise_values = np.random.uniform(-noise_amplitude, noise_amplitude, num_points)
    noise_mask = np.random.rand(num_points) < noise_prob
    y += noise_values * noise_mask

    # Clamp
    y = np.clip(y, 0, 100)

    return pd.DataFrame({'X': x, 'Y': y})

# === CONFIG ===
CONFIG = {
    "Peak": {
        "type_1": {
            "count": 5,
            "params": {
                "num_points": 55,
                "num_peaks": 4,
                "peak_height_range": (4, 15),
                "noise_prob": 0.3,
                "noise_amplitude": 4,
                "y_intercept": 20,
                "slope": 0.1
            }
        },
        "type_2": {
            "count": 4,
            "params": {
                "num_points": 60,
                "num_peaks": 3,
                "peak_height_range": (5, 15),
                "noise_prob": 0.25,
                "noise_amplitude": 3,
                "y_intercept": 30,
                "slope": 0.0
            }
        },
        "type_3": {
            "count": 6,
            "params": {
                "num_points": 50,
                "num_peaks": 3,
                "peak_height_range": (2, 15),
                "noise_prob": 0.4,
                "noise_amplitude": 5,
                "y_intercept": 15,
                "slope": 0.05
            }
        }
    }
}

# === Output Folder ===
OUTPUT_FOLDER = "data/Peak"

# === Generator Script ===
def generate_peak_variants():
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    for variant, config in CONFIG["Peak"].items():
        count = config["count"]
        base_params = config["params"]

        for i in range(count):
            seed = random.randint(1000, 9999)
            base_params["random_seed"] = seed

            df = generate_random_walk_peak_data(**base_params)

            filename = f"peak_{variant}_{i + 1}.json"
            filepath = os.path.join(OUTPUT_FOLDER, filename)
            df.to_json(filepath, orient="records", indent=2)

            print(f"✅ Saved: {filepath} (seed={seed}, slope={base_params['slope']}, intercept={base_params['y_intercept']})")

# === Run Script ===
if __name__ == "__main__":
    generate_peak_variants()
