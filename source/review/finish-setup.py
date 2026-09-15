from pathlib import Path
p=Path(__file__).resolve().parents[1]/'components/data-objects.js'
s=p.read_text()
old='opacity: 0.94, depthWrite: false'
assert old in s
s=s.replace(old,'opacity: 0.94, depthWrite: false, depthTest: false')
p.write_text(s)
print('Caption backing renders as an annotation; scene trees cannot punch holes through it.')
