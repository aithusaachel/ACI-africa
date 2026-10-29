import subprocess
import re

ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
fonts = [
    ("playfair-display", "Playfair+Display:wght@700"),
    ("inter", "Inter:wght@400;600;700"),
    ("eb-garamond", "EB+Garamond:wght@700")
]

for prefix, fam in fonts:
    url = f"https://fonts.googleapis.com/css2?family={fam}&display=swap"
    css = subprocess.check_output(["curl.exe", "-s", "--ssl-no-revoke", "-H", f"User-Agent: {ua}", url], text=True)
    parts = css.split("/* ")
    for p in parts[1:]:
        sub = p.split(" */")[0].strip()
        if sub in ["latin", "latin-ext"]:
            w_m = re.search(r"font-weight:\s*(\d+)", p)
            w = w_m.group(1) if w_m else "400"
            u = re.search(r"url\((https://[^\)]+)\)", p).group(1)
            fname = f"{prefix}-{sub}-{w}.woff2"
            print(f"Downloading {fname} from {u}...")
            subprocess.check_call(["curl.exe", "-s", "--ssl-no-revoke", u, "-o", f"fonts/{fname}"])

print("All latin & latin-ext subsets downloaded successfully!")
