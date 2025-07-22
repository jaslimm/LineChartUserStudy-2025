import numpy as np
import pandas as pd
import random

def generate_clustering_line_graph_to_json(
    slope=0.5,
    intercept=30,
    num_points=50,
    noise_prob=0.6,
    clustering_prob=0.3,
    noise_std=5,
    random_seed=None,
    output_file='js_irregularData.json'
):
    """
    Generate a line graph with clustering behavior, save it in a DataFrame, and export to JSON.

    Parameters:
    - slope: The slope of the line (default 0.5).
    - intercept: The starting Y value (default 30).
    - num_points: The number of points in the line graph (default 50).
    - noise_prob: Probability of introducing clustering noise at each point (default 0.6).
    - clustering_prob: Probability of extending the clustering effect to subsequent points (default 0.3).
    - noise_std: Standard deviation of the noise for clustering (default 5).
    - random_seed: Seed for reproducibility (default None).
    - output_file: Name of the output JSON file (default 'js_irregularData.json').

    Returns:
    - A pandas DataFrame containing the generated X and Y values.
    """
    if random_seed is not None:
        np.random.seed(random_seed)

    # Generate X values evenly spaced in the range [2000, 2020]
    x = np.linspace(2000, 2020, num_points)

    # Initialize Y values
    y = np.zeros(num_points)
    y[0] = intercept  # Set the initial Y value to the intercept

    # List to track indexes with clustering behavior
    noise_indexes = []

    # Generate Y values with slope and clustering behavior
    for i in range(1, num_points):
        if np.random.rand() < noise_prob:  # Introduce clustering noise with given probability
            noise = np.random.normal(0, noise_std)
            noise_indexes.append(i)
            y[i] = y[i - 1] + noise  # Add noise to the previous point
        else:
            y[i] = y[i - 1] + slope  # Increment by slope for regular trend

    # Extend clustering effect to subsequent points based on clustering probability

    #############################
    # for idx in noise_indexes:
    #     if idx + 2 < num_points:
    #         y[idx + 1] = y[idx]  # Extend the clustering effect to the next point
    #         if np.random.rand() < clustering_prob:  # Extend further based on clustering probability
    #             y[idx + 2] = y[idx]

    #################################
        # if np.random.rand() < clustering_prob:  # Extend further based on clustering probability
        #         y[idx + 2] = y[idx]

    y = np.clip(y,0,100)
    # Create DataFrame
    data_series = pd.DataFrame({'X': x, 'Y': y})

    # Export to JSON
    data_series.to_json(output_file, orient='records', indent=4)

    return data_series


rd = random.randint(1,200)
np.random.seed(rd)

df = generate_clustering_line_graph_to_json(
    slope=-3.5,
    intercept=65, 
    num_points=60, 
    noise_prob=0.7, 
    clustering_prob=0.8, 
    noise_std=2,
    random_seed=120,
    output_file='3-23_test.json'
)

print(rd)

# 137 65

# slope=0.8,
    # intercept=32, 
    # num_points=60, 
    # noise_prob=0.8, 
    # clustering_prob=0.8, 
    # noise_std=4,
    # random_seed=96,




# slope=2.5,
#     intercept=78, 
#     num_points=70, 
#     noise_prob=0.8, 
#     clustering_prob=0.8, 
#     noise_std=4,
#     random_seed=56,