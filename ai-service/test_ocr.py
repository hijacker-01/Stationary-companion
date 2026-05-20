import time
import numpy as np
from PIL import Image
import easyocr

print("Initializing EasyOCR Reader...")
t0 = time.time()
reader = easyocr.Reader(["en"], gpu=False, verbose=False)
t1 = time.time()
print(f"Initialization took: {t1 - t0:.2f} seconds")

# Create a simple 200x200 image with some text
img = Image.new("L", (800, 200), color=255)
# Let's write text to it if possible, or just send a blank white image
arr = np.array(img)

print("Running OCR on blank image...")
t2 = time.time()
results = reader.readtext(arr, detail=0)
t3 = time.time()
print(f"OCR execution took: {t3 - t2:.2f} seconds")
print("Results:", results)
