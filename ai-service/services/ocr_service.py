import io
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

# EasyOCR reader is expensive to init — create once at module level
_reader = None

def _get_reader():
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    return _reader


def _preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Enhance invoice image for better OCR accuracy:
    1. Convert to grayscale
    2. Sharpen edges
    3. Boost contrast
    4. Resize to ~1800px wide (optimal for OCR)
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("L")  # grayscale

    # Resize width to 1200px, keep aspect ratio (optimal balance of speed and accuracy on CPU)
    w, h = img.size
    target_width = 1200
    if w != target_width:
        ratio = target_width / w
        img   = img.resize((target_width, int(h * ratio)), Image.LANCZOS)

    # Contrast boost
    img = ImageEnhance.Contrast(img).enhance(2.0)

    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)

    return np.array(img)


def extract_text_from_image(image_bytes: bytes) -> str:
    """Run EasyOCR on the image and return cleaned plain text."""
    arr    = _preprocess_image(image_bytes)
    reader = _get_reader()

    results = reader.readtext(arr, detail=0, paragraph=False)

    # Join lines, collapse excessive whitespace
    text = "\n".join(results)
    return text


def extract_text_with_boxes(image_bytes: bytes) -> list[dict]:
    """Return list of {text, bbox, confidence} for each detected block."""
    arr    = _preprocess_image(image_bytes)
    reader = _get_reader()

    results = reader.readtext(arr, detail=1, paragraph=False)
    return [
        {"text": r[1], "bbox": r[0], "confidence": round(r[2], 4)}
        for r in results
    ]
