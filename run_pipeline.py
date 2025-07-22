import subprocess

print("🔄 Generating data files...")
subprocess.run(["python", "generate_all_data.py"])

print("\n📊 Generating chart specs...")
subprocess.run(["python", "generate_chart_specs.py"])

print("\n🖼️ Rendering chart images...")
subprocess.run(["python", "render_specs_to_images.py"])

print("\n✅ Pipeline complete.")
