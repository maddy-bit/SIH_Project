import re
import subprocess
import os

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
md_file_path = os.path.join(repo_root, 'full_system_documentation.md')
docs_dir = os.path.join(repo_root, 'docs')
os.makedirs(docs_dir, exist_ok=True)

html_path = os.path.join(docs_dir, 'full_system_documentation.html')
pdf_path = os.path.join(docs_dir, 'full_system_documentation.pdf')

with open(md_file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace headers
html = text
html = re.sub(r'^# (.*)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
html = re.sub(r'^## (.*)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
html = re.sub(r'^### (.*)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
html = re.sub(r'^#### (.*)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)

# Replace code blocks
def code_block_sub(match):
    lang = match.group(1) or 'text'
    code = match.group(2).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return f'<pre><code class="language-{lang}">{code}</code></pre>'

html = re.sub(r'```([a-zA-Z0-9_]*)\n(.*?)```', code_block_sub, html, flags=re.DOTALL)
html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)

# Replace bold and italic
html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)

# Format paragraphs
lines = html.split('\n')
out_lines = []
in_list = False

for line in lines:
    line_str = line.strip()
    if not line_str:
        if in_list:
            out_lines.append('</ul>')
            in_list = False
        continue

    if line_str.startswith('- '):
        if not in_list:
            out_lines.append('<ul>')
            in_list = True
        item = line_str[2:]
        out_lines.append(f'<li>{item}</li>')
    elif line_str.startswith('<h') or line_str.startswith('<pre') or line_str.startswith('<table') or line_str.startswith('|'):
        if in_list:
            out_lines.append('</ul>')
            in_list = False
        out_lines.append(line_str)
    else:
        if in_list:
            out_lines.append('</ul>')
            in_list = False
        out_lines.append(f'<p>{line_str}</p>')

if in_list:
    out_lines.append('</ul>')

html_body = '\n'.join(out_lines)

styled_doc = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>SIH26127 Master System Documentation</title>
<style>
@page {{
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
}}
body {{
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.6;
    color: #1e293b;
    padding: 10px;
}}
h1 {{
    font-size: 20pt;
    color: #0f172a;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 6px;
    margin-top: 20px;
}}
h2 {{
    font-size: 15pt;
    color: #1e3a8a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 5px;
    margin-top: 18px;
    page-break-after: avoid;
}}
h3 {{
    font-size: 12pt;
    color: #1e40af;
    margin-top: 14px;
    page-break-after: avoid;
}}
h4 {{
    font-size: 11pt;
    color: #334155;
    margin-top: 10px;
}}
p {{
    margin-bottom: 10px;
    text-align: justify;
}}
code {{
    font-family: 'Consolas', 'Courier New', monospace;
    background-color: #f1f5f9;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 9.5pt;
    color: #0f172a;
}}
pre {{
    background-color: #0f172a;
    color: #f8fafc;
    padding: 12px;
    border-radius: 6px;
    font-size: 9pt;
    overflow-x: auto;
    page-break-inside: avoid;
}}
pre code {{
    background: none;
    color: #f8fafc;
    padding: 0;
}}
table {{
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
}}
th, td {{
    border: 1px solid #94a3b8;
    padding: 8px 12px;
    text-align: left;
}}
th {{
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: bold;
}}
tr:nth-child(even) {{
    background-color: #f8fafc;
}}
ul, ol {{
    margin-bottom: 10px;
    padding-left: 20px;
}}
li {{
    margin-bottom: 4px;
}}
strong {{
    color: #0f172a;
}}
.header-box {{
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 25px;
}}
.header-box h1 {{
    color: white;
    border: none;
    margin: 0;
    padding: 0;
    font-size: 22pt;
}}
.header-box p {{
    color: #e0f2fe;
    margin: 5px 0 0 0;
}}
</style>
</head>
<body>
<div class="header-box">
  <h1>Bharat Electronics Limited (BEL) — SIH26127</h1>
  <p>City-Wide Multi-Camera ANPR Trajectory Tracking & Urban Traffic Intelligence Platform</p>
  <p><strong>Master Technical Documentation & Presentation Guide</strong></p>
</div>
{html_body}
</body>
</html>
"""

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(styled_doc)

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
cmd = [edge_path, '--headless', '--disable-gpu', f'--print-to-pdf={pdf_path}', html_path]
subprocess.run(cmd, check=True)

print(f"Successfully generated PDF file: {pdf_path}")
print(f"File size: {os.path.getsize(pdf_path)} bytes")
