import subprocess
import re
import io
from fontTools.ttLib import TTFont

glyphs = {
    0x0190: "Ɛ (U+0190)",
    0x025B: "ɛ (U+025B)",
    0x0186: "Ɔ (U+0186)",
    0x0254: "ɔ (U+0254)",
    0x014A: "Ŋ (U+014A)",
    0x014B: "ŋ (U+014B)"
}

def test_font(font_name):
    query_name = font_name.replace(" ", "+")
    url = f"https://fonts.googleapis.com/css2?family={query_name}:wght@400;700"
    cmd = ["curl.exe", "-s", "--ssl-no-revoke", "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)", url]
    try:
        css = subprocess.check_output(cmd, text=True, timeout=10)
    except Exception as e:
        print(f"{font_name}: Failed to fetch CSS: {e}")
        return

    urls = re.findall(r"url\((https://[^\)]+)\)", css)
    if not urls:
        print(f"{font_name}: No woff2 URLs found in CSS response.")
        return

    combined_cmap = set()
    for u in urls:
        try:
            dl_cmd = ["curl.exe", "-s", "--ssl-no-revoke", u]
            font_bytes = subprocess.check_output(dl_cmd, timeout=10)
            f = TTFont(io.BytesIO(font_bytes))
            for t in f["cmap"].tables:
                combined_cmap.update(t.cmap.keys())
        except Exception as e:
            pass

    passed = []
    missing = []
    for cp, label in glyphs.items():
        if cp in combined_cmap:
            passed.append(label)
        else:
            missing.append(label)

    print(f"{font_name}: Passed {len(passed)}/6. Missing: {missing}")

for fn in ["Playfair Display", "DM Serif Display", "Fraunces", "Lora", "Merriweather", "Source Serif 4"]:
    test_font(fn)
