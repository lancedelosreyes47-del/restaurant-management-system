import os
import re

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Check script and css paths
css_files = re.findall(r'href=["\'](css/[^"\']+)["\']', html)
js_files = re.findall(r'src=["\'](js/[^"\']+)["\']', html)

print('CSS files referenced in index.html:', css_files)
for c in css_files:
    exists = os.path.exists(c)
    print(f"  [{'OK' if exists else 'FAIL'}] {c}")
    assert exists, f"Missing CSS file: {c}"

print('JS files referenced in index.html:', js_files)
for j in js_files:
    exists = os.path.exists(j)
    print(f"  [{'OK' if exists else 'FAIL'}] {j}")
    assert exists, f"Missing JS file: {j}"

# Collect all element IDs in HTML
html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html))
print(f'Total HTML IDs found: {len(html_ids)}')

# Scan all js files for getElementById calls
missing_ids = []
for j in js_files:
    with open(j, 'r', encoding='utf-8') as f:
        content = f.read()
    referenced_ids = re.findall(r'getElementById\(["\']([^"\']+)["\']\)', content)
    for rid in referenced_ids:
        if rid not in html_ids:
            missing_ids.append((j, rid))

if missing_ids:
    print('WARNING: Missing IDs referenced in JS:', missing_ids)
else:
    print('SUCCESS: All getElementById references match elements in index.html!')

