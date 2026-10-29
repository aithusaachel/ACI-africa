import shutil
import os

# 1. Copy Phase 2 homepage CSS to css/aci-home.css
shutil.copyfile('saved_css_step_2848.css', 'css/aci-home.css')
print("Created css/aci-home.css with Phase 2 styles:", os.path.getsize('css/aci-home.css'))

# 2. Restore previous css/aci-design-system.css from saved_css_step_2362.css
shutil.copyfile('saved_css_step_2362.css', 'css/aci-design-system.css')
print("Restored css/aci-design-system.css for other pages:", os.path.getsize('css/aci-design-system.css'))

# Clean up temporary saved files
os.remove('saved_css_step_2848.css')
os.remove('saved_css_step_2362.css')
os.remove('extract_css.py')
os.remove('extract_js.py')
