with open(".env", "rb") as f:
    print(f"RAW BINARY: {f.read(100)}")

with open(".env", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        print(f"LINE {i}: '{line.strip()}'")
