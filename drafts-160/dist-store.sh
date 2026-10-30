#!/bin/sh
# make.mjs 的輸出（out-160/_store/<語系>/：NN-*.png、ipad-NN-*.png、duo-NN-*.png）→ App 要的資料夾：
#   out-160/screenshots/<語系>/（iPhone＋iPad）、out-160/screenshots-duo/<語系>/（Duo，檔名 duo-NN-*.png）；zh-Hans 照舊＝zh-Hant 那份的複本
cd "$(dirname "$0")/.."
rm -rf out-160/screenshots out-160/screenshots-duo
for l in zh-Hant en-US ja ko; do
  mkdir -p out-160/screenshots/$l out-160/screenshots-duo/$l
  cp out-160/_store/$l/[0-9]*.png out-160/screenshots/$l/
  cp out-160/_store/$l/ipad-*.png out-160/screenshots/$l/
  cp out-160/_store/$l/duo-*.png out-160/screenshots-duo/$l/
done
cp -R out-160/screenshots/zh-Hant out-160/screenshots/zh-Hans
cp -R out-160/screenshots-duo/zh-Hant out-160/screenshots-duo/zh-Hans
for d in screenshots screenshots-duo; do echo $d $(find out-160/$d -name '*.png' | wc -l) files $(du -sh out-160/$d | cut -f1); done
