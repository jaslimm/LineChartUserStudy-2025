import numpy as np
import pandas as pd
import random
import matplotlib.pyplot as plt  # For visualization (optional)

def generate_random_walk_valley_data(
    num_points=100,
    num_valleys=3,
    valley_depth_range=(10, 20),  # Depth of the valleys
    noise_prob=0.3,
    noise_amplitude=5,
    y_intercept=50,  # Starting Y value
    slope=0.2,  # New parameter for controlling the trend
    random_seed=None,
    output_file='js_randomWalkValleyData.json'
):
    """
    Generates a dataset with valleys and noise using a random walk as the base pattern.
    X values are in the range [2000, 2020], and Y values are clamped to [0, 100].
    Includes a y_intercept parameter to set the starting Y value.

    Parameters:
        num_points (int): The number of points in the dataset.
        num_valleys (int): The number of valleys to include.
        valley_depth_range (tuple): The range for valley depths (positive values for downward valleys).
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

    # Randomly choose valley indexes
    valley_indexes = sorted(random.sample(range(10, num_points - 10), num_valleys))
    valley_depths = np.random.uniform(valley_depth_range[0], valley_depth_range[1], num_valleys)

    # Add valleys to the random walk
    for i, valley_idx in enumerate(valley_indexes):
        y[valley_idx] -= valley_depths[i]  # Subtract valley depth
        # Add a gradual decline and recovery around the valley
        for j in range(1, 6):
            if valley_idx - j >= 0:
                y[valley_idx - j] -= valley_depths[i] * (1 - j / 5)  # Decline before the valley
            if valley_idx + j < num_points:
                y[valley_idx + j] -= valley_depths[i] * (1 - j / 5)  # Recovery after the valley

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
np.random.seed(124)

data = generate_random_walk_valley_data(
    num_points=70,
    num_valleys=5,
    valley_depth_range=(2,35),
    noise_prob=0.2,
    noise_amplitude=4,
    y_intercept=45,  # Set the starting Y value
    slope=0.1,  # Adjust slope for an upward trend
    random_seed=142,  # Ensure reproducibility
    output_file='3-23_test.json'
)

print(rd)

# 50 8