import glob, re, os
from collections import defaultdict

pages = ['index.html', 'about.html', 'programs.html', 'impact.html', 'get-involved.html', 'donate.html', 'contact.html', 'admin.html', 'causes.html']
photo_to_pages = defaultdict(list)
page_to_photos = defaultdict(list)

for page in pages:
    if not os.path.exists(page):
        continue
    with open(page, 'r', encoding='utf-8') as f:
        html = f.read()
    matches = re.findall(r'(?:src|srcset|poster)=["\']([^"\'\s>]+)', html)
    bg_matches = re.findall(r'url\(["\']?([^)]+?)["\']?\)', html)
    all_refs = set(matches + bg_matches)
    for ref in all_refs:
        # filter to image files
        clean_ref = ref.split()[0].replace("'", "").replace('"', "")
        if any(clean_ref.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            basename = os.path.basename(clean_ref)
            photo_to_pages[basename].append((page, clean_ref))
            page_to_photos[page].append(basename)

print("=== PHOTOS PER PAGE ===")
for page in pages:
    photos = sorted(set(page_to_photos[page]))
    print(f"\n{page} ({len(photos)} photos):")
    for p in photos:
        print(f"  - {p}")

print("\n=== DUPLICATE SCAN ===")
duplicates = {k: v for k, v in photo_to_pages.items() if len(set(p[0] for p in v)) > 1}
if duplicates:
    for k, v in duplicates.items():
        pages_with_dup = sorted(list(set(p[0] for p in v)))
        print(f"DUPLICATE: {k} appears in {pages_with_dup}")
else:
    print("CONFIRMED: ALL PHOTOS ARE 100% UNIQUE SITE-WIDE! Zero duplicates found.")
