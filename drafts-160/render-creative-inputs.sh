#!/bin/sh
# creative-160.html 要用的畫面（zh-Hant）：render 進 screens/out/zh（gitignore），主頁另放 drafts-160/png/raw-home.png（store-shots.mjs 產）
cd "$(dirname "$0")/.."
node tools/screens.mjs render calendar "day=2" --lang=zh
node tools/screens.mjs render calendar "day=2&device=ipad" --lang=zh
node tools/screens.mjs render event "event=d1-airport&extra=1" --lang=zh
node tools/screens.mjs render overview "" --lang=zh
