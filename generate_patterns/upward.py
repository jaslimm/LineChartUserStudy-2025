import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import random

def generate_upward_trend_with_split_variability(num_points=12, y_int=0, variability=(0.5, 1.0), trend_strengths=(0.5, 1.5), split_year=2010, random_seed=None):
    
    if random_seed is not None:
        np.random.seed(random_seed)
    
    x = np.linspace(2000, 2020, num_points)  # Use values from 2000 to 2020
    split_index = np.searchsorted(x, split_year)
    
    # Base upward trend
    trend_1 = y_int + trend_strengths[0] * np.arange(split_index)
    trend_2 = trend_1[-1] + trend_strengths[1] * np.arange(num_points - split_index)
    upward_trend = np.concatenate([trend_1, trend_2])
    
    # Variability for segment 1
    sine_var_1 = variability[0] * np.sin(np.linspace(0, np.pi, split_index))
    random_var_1 = np.random.normal(0, variability[0] / 2, split_index)
    
    # Variability for segment 2
    sine_var_2 = variability[1] * np.sin(np.linspace(0, np.pi, num_points - split_index))
    random_var_2 = np.random.normal(0, variability[1] / 2, num_points - split_index)
    
    # Combine variability
    sine_variability = np.concatenate([sine_var_1, sine_var_2])
    random_variability = np.concatenate([random_var_1, random_var_2])
    
    # Final Y values
    y = upward_trend + sine_variability + random_variability
    y = np.minimum(y, 100)  # Clamp to a maximum value of 100 if needed
    
    # Create DataFrame
    df = pd.DataFrame({
        'X': x,
        'Y': y
    })
    return df


def generate_upward_trend_with_event_fluctuations(
    num_points=12,
    y_int=0,
    variability=(0.5, 1.0),
    trend_strengths=(0.5, 1.5),
    split_year=2010,
    random_seed=None,
    event_years=None,
    include_plateaus=True
):
    if random_seed is not None:
        np.random.seed(random_seed)

    x = np.linspace(2000, 2020, num_points)
    split_index = np.searchsorted(x, split_year)

    # Trend segments
    trend_1 = y_int + trend_strengths[0] * np.arange(split_index)
    trend_2 = trend_1[-1] + trend_strengths[1] * np.arange(num_points - split_index)
    upward_trend = np.concatenate([trend_1, trend_2])

    # Variability
    sine_var_1 = variability[0] * np.sin(np.linspace(0, np.pi, split_index))
    sine_var_2 = variability[1] * np.sin(np.linspace(0, np.pi, num_points - split_index))
    random_var_1 = np.random.normal(0, variability[0] / 2, split_index)
    random_var_2 = np.random.normal(0, variability[1] / 2, num_points - split_index)

    sine_variability = np.concatenate([sine_var_1, sine_var_2])
    random_variability = np.concatenate([random_var_1, random_var_2])
    y = upward_trend + sine_variability + random_variability

    # Optional: Add cycles & drift
    cycle = 1.5 * np.sin(np.linspace(0, 5 * np.pi, num_points))
    walk = np.cumsum(np.random.normal(0, 0.3, num_points))
    y += cycle + walk

    # Apply event years
    if event_years:
        for year in event_years:
            i = np.searchsorted(x, year)

            # Wider dip: 5 points with fading effect
            for offset, factor in zip([0, 1, 2, 3, 4], [1.0, 0.85, 0.6, 0.4, 0.2]):
                if i + offset < len(y):
                    y[i + offset] -= np.random.uniform(3, 10) * factor

            # Wider recovery: next 5 points
            for offset, factor in zip([5, 6, 7, 8, 9], [0.8, 0.6, 0.5, 0.3, 0.1]):
                if i + offset < len(y):
                    y[i + offset] += np.random.uniform(5, 20) * factor

                # Optional: plateau after recovery
                if include_plateaus and i + 10 < len(y): 
                    y[i + 10] = y[i + 9]



    y = np.minimum(y, 100)  # Clamp max

    df = pd.DataFrame({'X': x, 'Y': y})
    return df


# generate_upward_trend_with_event_fluctuations
# generate_upward_trend_with_split_variability

# Generate data
rd = random.randint(1,200)
np.random.seed()
df = generate_upward_trend_with_event_fluctuations(
    num_points=50, 
    y_int=27, 
    variability=(6,7), 
    trend_strengths=(.5,2), 
    split_year=2005,
    event_years=[ 2012,2019], #2,10 & 2,20
    include_plateaus=True, 
    random_seed=rd)

df.to_json('3-23_test.json', orient='records')
print(rd)

# seed 51
# seed 94

# num_points=50, 
#     y_int=95, 
#     variability=(4,6), 
#     trend_strengths=(-.25,-1), 
#     split_year=2008, 
#     random_seed=51)