import subprocess
import re
import os

fonts_to_download = [
    ("playfair-display", "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap"),
    ("inter", "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"),
    ("eb-garamond", "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@700&display=swap")
]

os.makedirs("fonts", exist_ok=True)
ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

font_declarations = []

for family_key, css_url in fonts_to_download:
    cmd = ["curl.exe", "-s", "--ssl-no-revoke", "-H", f"User-Agent: {ua}", css_url]
    css = subprocess.check_output(cmd, text=True)
    
    # Parse blocks
    blocks = re.findall(r"@font-face\s*\{([^}]+)\}", css)
    for b in blocks:
        # Extract subset comment before block if any, or unicode-range
        subset_m = re.search(r"/\*\s*([a-z0-9-]+)\s*\*/", b)
        subset = subset_m.group(1) if subset_m else "latin"
        
        # Only grab latin and latin-ext
        if subset not in ["latin", "latin-ext"]:
            continue
            
        weight_m = re.search(r"font-weight:\s*(\d+)", b)
        weight = weight_m.group(1) if weight_m else "400"
        
        url_m = re.search(r"url\((https://fonts.gstatic.com/[^)]+)\)", b)
        if not url_m:
            continue
        w_url = url_m.group(1)
        
        filename = f"{family_key}-{subset}-{weight}.woff2"
        filepath = os.path.join("fonts", filename)
        
        print(f"Downloading {filename} from {w_url}...")
        dl_cmd = ["curl.exe", "-s", "--ssl-no-revoke", w_url, "-o", filepath]
        subprocess.check_call(dl_cmd)
        
        # Build local @font-face rule
        font_family = "Playfair Display" if family_key == "playfair-display" else ("Inter" if family_key == "inter" else "EB Garamond")
        font_declarations.append(f"""@font-face {{
  font-family: '{font_family}';
  font-style: normal;
  font-weight: {weight};
  font-display: swap;
  src: url('../fonts/{filename}') format('woff2');
  unicode-range: {'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' if subset == 'latin-ext' else 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'};
}}""")

with open("fonts/local_fonts.css", "w", encoding="utf-8") as f:
    f.write("\n\n".join(font_declarations))

print("All self-hosted fonts downloaded and local_fonts.css generated!")
