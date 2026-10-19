from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "client" / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (6, 26, 55)
BLUE = (18, 105, 192)
GOLD = (230, 192, 92)
WHITE = (255, 255, 255)

def gradient(size: int) -> Image.Image:
    image = Image.new("RGB", (size, size), NAVY)
    px = image.load()
    for y in range(size):
        for x in range(size):
            ratio = (x + y) / (2 * size)
            px[x, y] = tuple(int(NAVY[i] * (1 - ratio) + BLUE[i] * ratio) for i in range(3))
    return image

def draw_network(image: Image.Image) -> None:
    size = image.width
    draw = ImageDraw.Draw(image)
    scale = size / 512
    nodes = [(164, 295, 20), (292, 208, 20), (420, 295, 20), (190, 336, 16), (394, 336, 16)]
    lines = [((164, 295), (292, 208)), ((292, 208), (420, 295)), ((164, 295), (190, 336)), ((420, 295), (394, 336)), ((190, 336), (394, 336))]
    for start, end in lines:
        draw.line(tuple(v * scale for v in (*start, *end)), fill=GOLD, width=max(4, int(10 * scale)))
    draw.arc((102 * scale, 102 * scale, 410 * scale, 410 * scale), 0, 360, fill=(220, 238, 255), width=max(3, int(7 * scale)))
    for x, y, radius in nodes:
        fill = WHITE if radius == 20 else GOLD
        draw.ellipse(((x - radius) * scale, (y - radius) * scale, (x + radius) * scale, (y + radius) * scale), fill=fill)

for size in (180, 192, 512):
    icon = gradient(size)
    draw_network(icon)
    icon.save(OUT / f"icon-{size}.png", "PNG", optimize=True)

splash = Image.new("RGB", (1242, 2436), NAVY)
draw = ImageDraw.Draw(splash)
for y in range(splash.height):
    ratio = y / splash.height
    color = tuple(int(NAVY[i] * (1 - ratio) + BLUE[i] * ratio) for i in range(3))
    draw.line((0, y, splash.width, y), fill=color)
icon = gradient(520)
draw_network(icon)
splash.paste(icon, ((1242 - 520) // 2, 640))
draw.ellipse((60, 130, 1182, 1252), outline=(255, 255, 255), width=2)
splash.save(OUT / "splash-1242x2436.png", "PNG", optimize=True)
