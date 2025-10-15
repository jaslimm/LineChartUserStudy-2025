import os
import numpy as np
import pandas as pd
import random
import json

# === Irregular Generator with Enforced Flatness ===
def generate_flat_irregular_graph(
    intercept,
    num_points,
    noise_prob,
    clustering_prob,
    noise_std,
    seed,
    tolerance=20,
    max_attempts=20
):
    for attempt in range(max_attempts):
        np.random.seed(seed + attempt)  # slight variation per attempt

        x = np.linspace(2000, 2020, num_points)
        y = np.zeros(num_points)
        y[0] = intercept

        for i in range(1, num_points):
            if np.random.rand() < noise_prob:
                noise = np.random.normal(0, noise_std)
            else:
                noise = np.random.normal(0, noise_std / 2)

            if np.random.rand() < clustering_prob:
                y[i] = y[i - 1]
            else:
                y[i] = y[i - 1] + noise

        drift = y[-1] - y[0]
        if abs(drift) <= tolerance:
            y = np.clip(y, 0, 100)
            return pd.DataFrame({'X': x, 'Y': y})

    # Final fallback: normalize the drift anyway
    drift = y[-1] - y[0]
    y -= np.linspace(0, drift, num_points)
    y = np.clip(y, 0, 100)
    return pd.DataFrame({'X': x, 'Y': y})


# === CONFIG ===
CONFIG = {
    "Irregular": {
        "type_1": {
            "count": 5,
            "params": {
                "num_points": 60,
                "noise_prob": 0.7,
                "clustering_prob": 0.8,
                "noise_std": 7
            }
        },
        "type_2": {
            "count": 6,
            "params": {
                "num_points": 50,
                "noise_prob": 0.8,
                "clustering_prob": 0.7,
                "noise_std": 5
            }
        },
        "type_3": {
            "count": 6,
            "params": {
                "num_points": 50,
                "noise_prob": 0.8,
                "clustering_prob": 0.7,
                "noise_std": 5
            }
        }
    }
}

# === Output Folder ===
OUTPUT_FOLDER = "data/Irregular"

# === Generator Script ===
def generate_irregular_variants():
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    for variant, config in CONFIG["Irregular"].items():
        count = config["count"]
        base_params = config["params"].copy()

        for i in range(count):
            seed = random.randint(1000, 9999)

            # Wider Y-int range for more expressive range
            intercept = random.randint(15, 85)

            # Add per-chart variability to noise_std
            noise_std_variation = random.uniform(-1.0, 1.5)
            base_params["noise_std"] = max(0.5, base_params["noise_std"] + noise_std_variation)

            df = generate_flat_irregular_graph(
                intercept=intercept,
                seed=seed,
                tolerance=20,  # Allow more drift than before
                **base_params
            )

            filename = f"irregular_{variant}_{i + 1}.json"
            filepath = os.path.join(OUTPUT_FOLDER, filename)
            df.to_json(filepath, orient="records", indent=2)

            print(f"✅ Saved: {filepath} (seed={seed}, intercept={intercept}, noise_std={base_params['noise_std']:.2f})")

# === Run Script ===
if __name__ == "__main__":
    generate_irregular_variants()
