#!/bin/sh
# 重打包示範並擷取影格＋聯絡表：sh drafts-160/cap.sh <demo> <everyMs> <totalMs> [cols] [cellW] [lang]
cd "$(dirname "$0")/.."
S=${SCRATCH:-/tmp/tz-frames}
demo=$1; every=$2; total=$3; cols=${4:-9}; cw=${5:-170}; lang=${6:-zh-Hant}
node tools/app-demos.mjs --out drafts-160/build --only home,pw-home-pages,plan | tail -1
rm -rf "$S/f-$demo"
node drafts-160/frames.mjs "$demo" "$S/f-$demo" "$every" "$total" "$lang"
node drafts-160/sheet.mjs "$S/f-$demo" "$S/sheet-$demo.png" "$cols" "$cw"
