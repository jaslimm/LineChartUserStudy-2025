import random
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json

def square_wave(x, period, phase_shift):
    """
    Square wave pattern.
    """
    return np.sign(np.sin(2 * np.pi * x / period + phase_shift))
def triangle_wave(x, period, phase_shift):
    """
    Triangle wave pattern.
    """
    return 2 * np.abs(2 * (x / period - np.floor(x / period + 0.5))) - 1


def custom_function(x, period, phase_shift,pulse_width=0.1):
    """
    Custom repeating function. Modify this function to create your desired pattern.
    """
    # Example: A combination of sine and cosine waves
    # return np.sin(2 * np.pi * x / period + phase_shift) + 0.5 * np.cos(4 * np.pi * x / period + phase_shift)
    # return 2 * np.abs(2 * (x / period - np.floor(x / period + 0.5))) - 1
    # return np.where((x % period) / period < pulse_width, 1, 0)
    # return 0.5 * np.sin(2 * np.pi * x / period + phase_shift) + 0.5 * square_wave(x, period, phase_shift)
    # return 0.5 * np.sin(2 * np.pi * x / period + phase_shift) + 0.5 * triangle_wave(x, period, phase_shift)
    # return (1 + 0.5 * np.sin(2 * np.pi * x / period + phase_shift)) * triangle_wave(x, period, phase_shift)

    # modulated_frequency = 2 * np.pi / period * (1 + 0.2 * triangle_wave(x, period, phase_shift))
    # return np.sin(modulated_frequency * x + phase_shift)

    # modulated_phase = phase_shift + 0.5 * np.pi * square_wave(x, period, phase_shift)
    # return np.sin(2 * np.pi * x / period + modulated_phase)

    # return np.exp(0.1 * np.sin(2 * np.pi * x / period + phase_shift))

    # return 0.5 * np.sin(2 * np.pi * x / period + phase_shift) + 0.5 * triangle_wave(x, period, phase_shift) + 0.1 * np.random.normal(0, 1, len(x))

    # base = triangle_wave(x, period, phase_shift)
    # mod = 1 + 0.3 * np.sin(2 * np.pi * x / (period * 2))
    # return base * mod

    return np.clip(np.sin(2 * np.pi * x / period + phase_shift) + 0.5 * np.sin(6 * np.pi * x / period), -0.5, 0.5)


    saw = 2 * (x / period - np.floor(x / period + 0.5))
    return 0.5 * saw + 0.5 * np.sin(2 * np.pi * x / period + phase_shift)



    return np.clip(np.sin(2 * np.pi * x / period + phase_shift) + 0.5 * np.sin(6 * np.pi * x / period), -0.5, 0.5)


    return np.exp(-0.05 * x) * np.sin(2 * np.pi * x / period + phase_shift)


    sine_component = np.sin(2 * np.pi * x / period + phase_shift)
    triangle_component = triangle_wave(x, period, phase_shift)
    square_component = square_wave(x, period, phase_shift)
    
    # Additive combination
    additive = 0.5 * sine_component + 0.3 * triangle_component
    
    # Multiplicative combination
    multiplicative = additive * square_component
    
    # Amplitude modulation
    amplitude_modulated = (1 + 0.2 * sine_component) * multiplicative
    
    return amplitude_modulated

def plot_and_export_custom_wave(period, phase_shift, noise_level=0.1, num_points=1000, start_year=2000, end_year=2020, amplitude=50, vertical_shift=50, output_file="custom_wave_data.json"):
    """
    Plots a custom wave with y-values between 0 and 100, and exports the data to a JSON file.

    Parameters:
    - period: The period of the custom wave.
    - phase_shift: The phase shift of the custom wave (in radians).
    - noise_level: The standard deviation of the noise to add to the custom wave (default: 0.1).
    - num_points: Number of points to plot for a smooth curve (default: 1000).
    - start_year: Start year for the x-axis range (default: 2000).
    - end_year: End year for the x-axis range (default: 2020).
    - amplitude: Amplitude of the custom wave (default: 50).
    - vertical_shift: Vertical shift of the custom wave (default: 50).
    - output_file: Name of the JSON file to export the data (default: "custom_wave_data.json").

    Returns:
    - None
    """
    # Generate x values as years evenly spaced between start_year and end_year
    x_values = np.linspace(start_year, end_year, num_points)
    
    # Compute the custom wave values with scaling
    y_values = amplitude * custom_function(x_values, period, phase_shift) + vertical_shift
    
    # Add random noise to the y values
    noise = np.random.normal(0, noise_level, num_points)
    y_values_with_noise = y_values + noise
    
    # Ensure y-values stay within the [0, 100] range after adding noise
    y_values_with_noise = np.clip(y_values_with_noise, 0, 100)
    
    # Create a DataFrame
    data = {
        "X": x_values,
        "Y": y_values_with_noise
    }
    df = pd.DataFrame(data)
    
    # Export the DataFrame to a JSON file
    df.to_json(output_file, orient="records", lines=False)


rd = random.randint(1, 200)
np.random.seed(89)

# Generate and export the custom wave data
plot_and_export_custom_wave(
    period=4,
    phase_shift=np.pi,
    noise_level=2.0,
    amplitude=8,
    vertical_shift=35,
    num_points=65,
    output_file="3-23_test.json")

print(rd)

# return np.clip(np.sin(2 * np.pi * x / period + phase_shift) + 0.5 * np.sin(6 * np.pi * x / period), -0.5, 0.5)




