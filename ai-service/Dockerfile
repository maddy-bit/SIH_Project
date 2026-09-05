FROM python:3.11-slim

# OpenCV needs these at runtime even in headless mode.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN useradd --system --create-home appuser && chown -R appuser /app
USER appuser

# YOLO weights + EasyOCR models auto-download on first use (see models/README.md) -
# mount a volume at /app/models and ~/.EasyOCR in production so they persist
# across container restarts instead of re-downloading.
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
