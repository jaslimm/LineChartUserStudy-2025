import numpy as np
import pandas as pd
import random
import matplotlib.pyplot as plt  # For visualization (optional)

def generate_random_walk_peak_data(
    num_points=100,
    num_peaks=3,
    peak_height_range=(10, 20),
    noise_prob=0.3,
    noise_amplitude=5,
    y_intercept=50,  # Starting Y value
    slope=0.2,  # New parameter for controlling the trend
    random_seed=None,
    output_file='js_randomWalkPeakData.json'
):
    """
    Generates a dataset with peaks and noise using a random walk as the base pattern, with an added slope.
    X values are in the range [2000, 2020], and Y values are clamped to [0, 100].

    Parameters:
        num_points (int): The number of points in the dataset.
        num_peaks (int): The number of peaks to include.
        peak_height_range (tuple): The range for peak heights (positive values for upward peaks).
        noise_prob (float): Probability of adding noise to each point.
        noise_amplitude (float): Amplitude of the noise.
        y_intercept (float): Starting Y value (shifts the entire graph up or down).
        slope (float): The overall trend of the data (positive for upward, negative for downward).
        random_seed (int): Seed for random number generation.
        output_file (str): File name to save the generated dataset in JSON format.

    Returns:
        pd.DataFrame: A DataFrame containing the generated X and Y values.
    """
    if random_seed is not None:
        np.random.seed(random_seed)
        random.seed(random_seed)

    # Generate X values in the range [2000, 2020]
    x = np.linspace(2000, 2020, num_points)

    # Initialize Y values with a random walk and a slope component
    y = np.zeros(num_points)
    y[0] = y_intercept  # Start at the y_intercept

    # Generate random walk with slope
    for i in range(1, num_points):
        y[i] = y[i - 1] + np.random.normal(0, 1) + slope  # Adding slope term

    # Randomly choose peak indexes
    peak_indexes = sorted(random.sample(range(10, num_points - 10), num_peaks))
    peak_heights = np.random.uniform(peak_height_range[0], peak_height_range[1], num_peaks)

    # Add peaks to the random walk
    for i, peak_idx in enumerate(peak_indexes):
        y[peak_idx] += peak_heights[i]  # Add peak height
        # Add a gradual rise and fall around the peak
        for j in range(1, 6):
            if peak_idx - j >= 0:
                y[peak_idx - j] += peak_heights[i] * (1 - j / 5)  # Rise before the peak
            if peak_idx + j < num_points:
                y[peak_idx + j] += peak_heights[i] * (1 - j / 5)  # Fall after the peak

    # Add noise to the data
    noise_values = np.random.uniform(-noise_amplitude, noise_amplitude, num_points)
    noise_mask = np.random.rand(num_points) < noise_prob
    y += noise_values * noise_mask

    # Ensure Y values stay within the range [0, 100]
    y = np.clip(y, 0, 100)

    # Save data to a DataFrame and export as JSON
    data_series = pd.DataFrame({'X': x, 'Y': y})
    data_series.to_json(output_file, orient='records')

    return data_series

rd = random.randint(1, 200)


data = generate_random_walk_peak_data(
    num_points=55,
    num_peaks=7,
    peak_height_range=(2,10), #6,5
    noise_prob=0.3,
    noise_amplitude=5,
    y_intercept=15,  
    slope=.1,  # Adjust slope for an upward trend
    random_seed=106,  # Ensure reproducibility
    output_file='3-23_test.json'
)

print(rd)
# 75 117 85