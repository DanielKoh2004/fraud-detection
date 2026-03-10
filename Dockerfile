# syntax=docker/dockerfile:1

# Wutong Defense Console - React Frontend + FastAPI Backend
# Multi-stage build for production deployment

# ====================
# Stage 1: Build React Frontend
# ====================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build production bundle
RUN npm run build

# ====================
# Stage 2: Python Runtime
# ====================
FROM python:3.11-slim AS runtime

# Prevents Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Fix matplotlib config directory
ENV MPLCONFIGDIR=/tmp/matplotlib

# Set PYTHONPATH so imports work correctly
ENV PYTHONPATH=/app:/app/frontend

# Groq API Key for LLM integration (pass via docker-compose or docker run -e)
# ENV GROQ_API_KEY=  # Do NOT hardcode secrets here

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Copy built frontend from build stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create necessary directories
RUN mkdir -p /app/Datasets/Student/Results \
    /app/Datasets/Fraud/Results \
    /app/models \
    /tmp/matplotlib \
    /var/log/supervisor && \
    chmod -R 777 /app/Datasets /app/models /tmp/matplotlib

# Nginx config to serve React and proxy API
RUN cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    server_name localhost;

    # Serve React frontend
    root /app/frontend/dist;
    index index.html;

    # All routes go to index.html (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Supervisor config to run both services
RUN cat > /etc/supervisor/conf.d/wutong.conf << 'EOF'
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:fastapi]
command=python /app/frontend/api/main.py
directory=/app
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/fastapi.log
stderr_logfile=/var/log/supervisor/fastapi_err.log

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/nginx.log
stderr_logfile=/var/log/supervisor/nginx_err.log
EOF

# Expose ports: 80 for web, 8000 for API (internal)
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost/ || exit 1

# Start supervisor (manages both nginx and FastAPI)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
