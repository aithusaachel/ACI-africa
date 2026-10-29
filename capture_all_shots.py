import subprocess
import os

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\User\.gemini\antigravity-ide\brain\0b986fb8-5b7b-410d-b670-c5089b1624e7'

tasks = [
    # 1. Glyphs test harness
    ('test_glyphs.html', 1000, 800, 'screenshot_african_glyphs.png'),
    # 2. about.html verification
    ('about.html', 1440, 900, 'screenshot_about_1440.png'),
    # 3. index.html full 1440px
    ('index.html', 1440, 3600, 'screenshot_index_1440_full.png'),
    # 4. index.html 1440px hero
    ('index.html', 1440, 900, 'screenshot_index_1440_hero.png'),
    # 5. index.html 768px tablet
    ('index.html', 768, 4200, 'screenshot_index_768_full.png'),
    # 6. index.html 390px mobile
    ('index.html', 390, 5200, 'screenshot_index_390_full.png'),
]

for page, w, h, out_name in tasks:
    url = f'http://localhost:8080/{page}'
    out_path = os.path.join(brain_dir, out_name)
    cmd = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        f'--window-size={w},{h}',
        '--virtual-time-budget=3000',
        f'--screenshot={out_path}',
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(out_path):
        print(f"SUCCESS: {out_name} ({os.path.getsize(out_path):,} bytes)")
    else:
        print(f"FAILED: {out_name}", res.stderr)
