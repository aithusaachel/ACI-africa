import subprocess
import os

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\User\.gemini\antigravity-ide\brain\0b986fb8-5b7b-410d-b670-c5089b1624e7'

tasks = [
    # Full Desktop 1440
    ('index.html', 1440, 5200, 'index_1440_fullpage.png'),
    # Full Tablet 768
    ('index.html', 768, 7000, 'index_768_fullpage.png'),
    # Full Mobile 390
    ('index.html', 390, 8600, 'index_390_fullpage.png'),
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
    subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(out_path):
        print(f"Captured {out_name}: {os.path.getsize(out_path):,} bytes")
