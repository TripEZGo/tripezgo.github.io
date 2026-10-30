#!/bin/sh
# 地圖類官網截圖（MapKit 偶爾載不齊）：每格最多重試 6 次。sh drafts-160/maps-webp.sh
cd "$(dirname "$0")/.."
for l in zh en ja ko; do
  for n in map-place map-route map-live map-mates; do
    ok=0
    for i in 1 2 3 4 5 6; do
      if node tools/shots-webp.mjs --lang=$l $n >/dev/null 2>&1; then ok=1; break; fi
    done
    echo "$l $n $ok"
  done
done
