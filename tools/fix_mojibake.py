"""Repair text that was UTF-8 decoded as cp1252 (once or twice) and saved again. Usage: python tools/fix_mojibake.py <files...>"""
import re
import sys
from pathlib import Path

RUN = re.compile(r'[^\x00-\x7f]+')


def fix_run(s: str) -> str:
    for _ in range(3):
        try:
            t = s.encode('cp1252').decode('utf-8')
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        if t == s:
            break
        s = t
    return s


changed = 0
for name in sys.argv[1:]:
    p = Path(name)
    text = p.read_text(encoding='utf-8')
    out = RUN.sub(lambda m: fix_run(m.group(0)), text)
    if out != text:
        p.write_text(out, encoding='utf-8', newline='')
        changed += 1
        print('fixed', name)
print(changed, 'files changed')
