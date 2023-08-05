import json
import os

# Define the list of technologies with their names and paths
technologies = [
    {"name": "linkedin", "path": "public/assets/svgs/social/linkedin.svg"},
    {"name": "github", "path": "public/assets/svgs/social/github.svg"},
    {"name": "leetcode", "path": "public/assets/svgs/social/leetcode.svg"},
    {"name": "gmail", "path": "public/assets/svgs/social/gmail.svg"},
    {"name": "whatsapp", "path": "public/assets/svgs/social/whatsapp.svg"},
]

def read_svg_files():
    svg_objects = []

    for tech in technologies:
        svg_path = os.path.join(os.path.dirname(__file__), tech["path"])

        try:
            with open(svg_path, "r", encoding="utf-8") as svg_file:
                svg_content = svg_file.read()
                svg_objects.append({"name": tech["name"], "svgCode": svg_content})
        except FileNotFoundError as e:
            print(f"Error reading SVG file at path: {svg_path}\n{e}")

    return svg_objects

# Read SVG files and get the list of objects
svg_objects_array = read_svg_files()
print(svg_objects_array)

# Convert the array to JSON format
json_data = json.dumps(svg_objects_array, indent=2)

# Write the JSON data to a file named 'output.json'
with open("output.json", "w", encoding="utf-8") as json_file:
    json_file.write(json_data)

print("Data written to output.json")
