import os

def rename_charts(folder_path):
    # Get all image files (supports .png, .jpg, etc.)
    files = sorted(
        [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    )

    for i, filename in enumerate(files, start=1):
        ext = os.path.splitext(filename)[1]
        new_name = f"{i}_chart{ext}"
        old_path = os.path.join(folder_path, filename)
        new_path = os.path.join(folder_path, new_name)

        os.rename(old_path, new_path)
        print(f"Renamed: {filename} → {new_name}")

if __name__ == "__main__":
    folder = input("Enter path to chart folder (e.g., ./images): ").strip()
    rename_charts(folder)
