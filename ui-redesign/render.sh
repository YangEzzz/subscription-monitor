#!/bin/sh
# 用法: ./render.sh <page> [full]   输出 renders/<page>.png 或 renders/<page>-full.png
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
D="$(cd "$(dirname "$0")" && pwd)"
if [ "$2" = "full" ]; then
  "$C" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=520,1700 --user-data-dir=/tmp/ud_$1 \
    --screenshot="$D/renders/$1-full.png" "file://$D/pages/$1.html?full=1" >/dev/null 2>&1
  /tmp/gifenv/bin/python - "$D/renders/$1-full.png" <<'PY'
import sys
from PIL import Image, ImageChops
p=sys.argv[1]; im=Image.open(p).convert('RGB')
bg=Image.new('RGB',im.size,(221,225,236))
diff=ImageChops.difference(im,bg).point(lambda v:255 if v>6 else 0).convert('L')
l,t,r,b=diff.getbbox()
im.crop((0,0,im.width,min(im.height,b+80))).save(p)
PY
else
  "$C" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=520,940 --user-data-dir=/tmp/ud_$1 \
    --screenshot="$D/renders/$1.png" "file://$D/pages/$1.html" >/dev/null 2>&1
fi
