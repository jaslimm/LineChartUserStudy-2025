import os
import vl_convert as vlc
import json

chart_folder = "charts"
image_folder = "images"
os.makedirs(image_folder, exist_ok=True)

def render_all():
    for filename in os.listdir(chart_folder):
        if not filename.endswith(".json"):
            continue
        chart_path = os.path.join(chart_folder, filename)
        img_path = os.path.join(image_folder, filename.replace(".json", ".png"))

        with open(chart_path) as f:
            spec = json.load(f)

        png_data = vlc.vegalite_to_png(spec)
        with open(img_path, "wb") as out_file:
            out_file.write(png_data)
        print(f"🖼️ Rendered: {img_path}")

if __name__ == "__main__":
    render_all()
