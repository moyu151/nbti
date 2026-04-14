from pathlib import Path
from PIL import Image


def main() -> None:
    root = Path(r"G:\work\code\nbti\assets\types")
    count = 0
    for png in sorted(root.glob("*.png")):
        webp = png.with_suffix(".webp")
        with Image.open(png) as im:
            im.save(webp, format="WEBP", quality=86, method=6)
        count += 1
        print(webp.name)
    print(f"converted {count} files")


if __name__ == "__main__":
    main()
