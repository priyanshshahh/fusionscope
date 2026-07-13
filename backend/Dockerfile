FROM python:3.13-slim

WORKDIR /app

# Install dependencies first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY seed_data ./seed_data
COPY scripts ./scripts

# Seed the curated demo baseline so the container serves data immediately;
# hit POST /api/refresh (with REFRESH_TOKEN) or run `python -m app.etl.refresh`
# to replace it with live-scored data.
RUN python -m app.etl.refresh --demo

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
