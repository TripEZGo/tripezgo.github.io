#!/bin/sh
# plan 示範新舊各擷取一輪影格（舊＝1181d17 的打包，放在 drafts-160/build-old）
cd "$(dirname "$0")/.."
S=${SCRATCH:-/tmp/tz-frames}
rm -rf "$S/f-plan-new" "$S/f-plan-old"
node drafts-160/frames.mjs plan "$S/f-plan-new" 500 24000
BUILD="$PWD/drafts-160/build-old" node drafts-160/frames.mjs plan "$S/f-plan-old" 500 24000
node drafts-160/sheet.mjs "$S/f-plan-new" "$S/sheet-plan-new.png" 12 130
