import sys
with open("prisma/schema.prisma", "r") as f:
    lines = f.readlines()

# Fix TourGallery
in_tg = False
for i, line in enumerate(lines):
    if line.strip().startswith("model TourGallery"):
        in_tg = True
    elif in_tg and line.strip() == "}":
        lines.insert(i, "  hotspots TourHotspot[]\n")
        break

# Fix TourScene
in_ts = False
for i, line in enumerate(lines):
    if line.strip().startswith("model TourScene"):
        in_ts = True
    elif in_ts and line.strip() == "}":
        lines.insert(i, "  galleries TourGallery[]\n")
        break

with open("prisma/schema.prisma", "w") as f:
    f.writelines(lines)
