FROM python:3.12-slim

WORKDIR /app

# Dependencies installieren
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App-Dateien kopieren
COPY backend/app.py .
COPY app/ ./static/

# Volume-Mountpoint erstellen
RUN mkdir -p /data

ENV DB_PATH=/data/rezepte.db
ENV FLASK_ENV=production

EXPOSE 5000

CMD ["python", "app.py"]
