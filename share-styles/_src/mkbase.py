from PIL import Image, ImageFilter
SITE = '/Users/zhgchgli/Projects/tripezgo.github.io-share-1100/share-styles/_sample'
im = Image.open(SITE + '/day-4.png').convert('RGB')
W, H = im.size
TOP, BOT = 160, 320
FEATHER = 36
out = Image.new('RGB', (W, TOP + H + BOT))
out.paste(im, (0, TOP))


def wash(strip_box, total, up):
    """邊緣那一條乾淨底圖拉伸＋重度模糊，變成「圖外」的色塊；靠邊界的 FEATHER 高度淡入原圖，不留接縫。"""
    strip = im.crop(strip_box)
    big = strip.resize((W, total + FEATHER), Image.BILINEAR).filter(ImageFilter.GaussianBlur(26))
    return big


top = wash((0, 0, W, 40), TOP, True)
bot = wash((0, H - 36, W, H), BOT, False)
# 上：ext 在 [0, TOP)，並多蓋 FEATHER 進原圖 → 漸變遮罩
mask_t = Image.new('L', (W, TOP + FEATHER), 255)
for y in range(FEATHER):
    mask_t.paste(int(255 * (1 - y / FEATHER)), (0, TOP + y, W, TOP + y + 1))
out.paste(top, (0, 0), mask_t)
mask_b = Image.new('L', (W, BOT + FEATHER), 255)
for y in range(FEATHER):
    mask_b.paste(int(255 * (y / FEATHER)), (0, y, W, y + 1))
out.paste(bot, (0, TOP + H - FEATHER), mask_b)
out.save(SITE + '/trip-base.jpg', quality=85)
print(out.size)
