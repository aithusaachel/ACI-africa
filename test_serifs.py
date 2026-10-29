import subprocess
import re
import io
from fontTools.ttLib import TTFont

glyphs = [0x0190, 0x025B, 0x0186, 0x0254, 0x014A, 0x014B]

def check_google_font(name):
    query = name.replace(" ", "+")
    url = f"https://fonts.googleapis.com/css2?family={query}:wght@700"
    res = subprocess.check_output(["curl.exe", "-s", "--ssl-no-revoke", url], text=True)
    urls = re.findall(r"url\((https://[^\)]+\.(?:ttf|woff2))\)", res)
    cmap = set()
    for u in urls:
        b = subprocess.check_output(["curl.exe", "-s", "--ssl-no-revoke", u])
        f = TTFont(io.BytesIO(b))
        for t in f["cmap"].tables:
            cmap.update(t.cmap.keys())
    passed = [hex(g) for g in glyphs if g in cmap]
    failed = [hex(g) for g in glyphs if g not in cmap]
    status = "PASS (6/6)" if len(passed) == 6 else f"FAIL - Missing: {failed}"
    print(f"{name}: {status}")

for fn in ["Lora", "Fraunces", "Source Serif 4", "Merriweather", "EB Garamond"]:
    try:
        check_google_font(fn)
    except Exception as e:
        print(f"{fn}: error {e}")
