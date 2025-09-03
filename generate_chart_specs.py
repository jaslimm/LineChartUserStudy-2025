import os
import json
import random
import csv
import pandas as pd

# === CONFIGURATION ===
CONFIG = {
    "csv_file": "experiment_70_all7patterns.csv",  # your input CSV
    "data_root": "data",                          # top-level data folder
    "chart_folder": "charts",                     # output folder for spec files
    "log_file": "chart_log.csv",                  # output log
    "y_ticks": [0, 50, 100]                       # fixed y-axis ticks
}

def generate_chart_specs():
    # Create output folder if it doesn't exist
    os.makedirs(CONFIG["chart_folder"], exist_ok=True)

    # Load input CSV
    df = pd.read_csv(CONFIG["csv_file"])

    def make_spec(data, title, y_ticks, pattern):
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": f"Pattern: {pattern}",
            "data": {
                "values": data
            },
            "mark": {"type": "line", "interpolate": "cardinal", "tension": 0.4},
            "encoding": {
                "x": {
                    "field": "X", "type": "quantitative", "title": "",
                    "axis": {
                        "grid": False,
                        "format": "d",
                        "values": [2000, 2005, 2010, 2015, 2020],
                        "tickSize": 4
                    },
                    "scale": {"domain": [2000, 2020]}
                },
                "y": {
                    "field": "Y", "type": "quantitative", "title": "",
                    "axis": {
                        "grid": False,
                        "format": "d",
                        "values": y_ticks,
                        "tickSize": 4,
                        "tickOpacity": 1
                    },
                    "scale": {"domain": [0, 100]}
                }
            },
            "title": {
                "text": title,
                "anchor": "middle",
                "font": "Tahoma",
                "fontSize": 12
            },
            "config": {
                "lineBreak": "^",
                "view": {"stroke": None}
            },
            "height": 400,
            "width": 400,
            "autosize": "pad"
        }

    log_rows = []

    for _, row in df.iterrows():
        chart_id = row["Chart_ID"]
        title = row["Title"]
        pattern = row["Chart_Pattern"]

        pattern_folder = os.path.join(CONFIG["data_root"], pattern)
        if not os.path.isdir(pattern_folder):
            print(f"⚠️ Pattern folder not found: {pattern_folder}")
            continue

        # Randomly select one data file from the pattern folder
        data_files = [f for f in os.listdir(pattern_folder) if f.endswith(".json")]
        if not data_files:
            print(f"⚠️ No data files in {pattern_folder}")
            continue

        selected_file = random.choice(data_files)
        with open(os.path.join(pattern_folder, selected_file)) as f:
            data = json.load(f)

        spec = make_spec(data, title, CONFIG["y_ticks"], pattern)

        filename = f"{chart_id}_chart.json"
        path = os.path.join(CONFIG["chart_folder"], filename)
        with open(path, "w") as f:
            json.dump(spec, f, indent=2)

        log_rows.append({
            "chart_id": chart_id,
            "pattern": pattern,
            "title": title,
            "y_ticks": str(CONFIG["y_ticks"]),
            "data_file": selected_file
        })

        print(f"✅ Generated: {filename} (from {selected_file})")

    # Save CSV log
    with open(CONFIG["log_file"], "w", newline="") as csvfile:
        fieldnames = ["chart_id", "pattern", "title", "y_ticks", "data_file"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(log_rows)

    print(f"\n📄 Log saved to {CONFIG['log_file']}")

# === OPTIONAL: Run directly ===
if __name__ == "__main__":
    generate_chart_specs()
