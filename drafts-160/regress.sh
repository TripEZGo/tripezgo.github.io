#!/bin/sh
# screens/home.html 改動後，截圖模式必須跟 HEAD 版逐像素一致（INTERACTIVE.md 鐵則 1）
# 用法：先把舊版放成 screens/home-old.html，再跑這支
cd "$(dirname "$0")/.."
for q in "" "edit=1" "veil=1&page=1" "edit=1&hide=today,dates"; do
  n=$(echo "$q" | tr '&=,' '___')
  node drafts-160/shot.mjs home "$q" "drafts-160/png/new-$n.png" >/dev/null
  node drafts-160/shot.mjs home-old "$q" "drafts-160/png/old-$n.png" >/dev/null
  if cmp -s "drafts-160/png/new-$n.png" "drafts-160/png/old-$n.png"; then echo "same: $q"; else echo "DIFF: $q"; fi
done
