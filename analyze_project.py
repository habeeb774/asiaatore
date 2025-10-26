import os
import re

# المجلد الرئيسي للمشروع
PROJECT_DIR = '.'  # يمكنك تغييره إلى مسار مشروعك

# الامتدادات المستهدفة
TARGET_EXTENSIONS = ('.js', '.jsx', '.css', '.sass')

report = []

for root, dirs, files in os.walk(PROJECT_DIR):
    for file in files:
        if file.endswith(TARGET_EXTENSIONS):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                lines_count = len(content.splitlines())
                functions = len(re.findall(r'\bfunction\b', content))
                imports = len(re.findall(r'\bimport\b', content))
                report.append({
                    'file': filepath,
                    'lines': lines_count,
                    'functions': functions,
                    'imports': imports
                })
            except Exception as e:
                report.append({
                    'file': filepath,
                    'error': str(e)
                })

# طباعة التقرير
print(f"\nتحليل كامل لمشروعك ({len(report)} ملف)\n")
for r in report:
    if 'error' in r:
        print(f"[ERROR] {r['file']}: {r['error']}")
    else:
        print(f"{r['file']} - Lines: {r['lines']}, Functions: {r['functions']}, Imports: {r['imports']}")

# حفظ التقرير في ملف
with open('project_report.txt', 'w', encoding='utf-8') as f:
    for r in report:
        if 'error' in r:
            f.write(f"[ERROR] {r['file']}: {r['error']}\n")
        else:
            f.write(f"{r['file']} - Lines: {r['lines']}, Functions: {r['functions']}, Imports: {r['imports']}\n")

print("\nتم حفظ التقرير في project_report.txt")
