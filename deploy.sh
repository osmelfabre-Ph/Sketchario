#!/bin/bash
# ============================================
# SKETCHARIO V4 — Deploy Script per VPS Aruba
# ============================================
# Esegui questo script come root sul VPS
# Usage: bash deploy.sh
# ============================================

set -e

REPO_URL="https://github.com/osmelfabre-Ph/Sketchario.git"
REPO_BRANCH="main"
APP_DIR="/root/sketchario-v4"

echo "========================================="
echo "  SKETCHARIO V4 — Deployment"
echo "========================================="

# 1. Aggiorna il sistema
echo "[1/7] Aggiornamento sistema..."
if command -v dnf &> /dev/null; then
    dnf update -y
    dnf install -y git curl
elif command -v apt-get &> /dev/null; then
    apt-get update -y
    apt-get install -y git curl
fi

# 2. Verifica Docker
echo "[2/7] Verifica Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installazione Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! docker compose version &> /dev/null 2>&1 && ! command -v docker-compose &> /dev/null; then
    echo "Installazione Docker Compose plugin..."
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

systemctl start docker

# 3. Clona o aggiorna il repository
echo "[3/7] Clona/aggiorna repository..."
if [ -d "$APP_DIR/.git" ]; then
    echo "Cartella esistente, aggiornamento..."
    cd "$APP_DIR"
    git fetch origin
    git checkout "$REPO_BRANCH"
    git pull origin "$REPO_BRANCH"
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
    git checkout "$REPO_BRANCH"
fi

cd "$APP_DIR"

# 4. Crea .env.production per il backend
echo "[4/7] Creazione file di configurazione..."
mkdir -p backend/uploads

if [ ! -f backend/.env.production ]; then
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || \
                 openssl rand -hex 32)
    cat > backend/.env.production <<EOF
MONGO_URL=mongodb://sketchario-mongo:27017/sketchario
DB_NAME=sketchario
JWT_SECRET=${JWT_SECRET}
EMERGENT_LLM_KEY=
SMTP_HOST=smtps.aruba.it
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
EOF
    echo "  File .env.production creato."
else
    echo "  File .env.production già esistente, mantenuto."
fi

# 5. Crea directory nginx ssl
echo "[5/7] Preparazione directory..."
mkdir -p nginx/ssl

# 6. Apri le porte nel firewall
echo "[6/7] Configurazione firewall..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
elif command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
fi

# 7. Build e avvia
echo "[7/7] Build e avvio containers..."
export DOMAIN_URL="http://77.81.226.230"

if docker compose version &> /dev/null 2>&1; then
    docker compose build --no-cache
    docker compose up -d
else
    docker-compose build --no-cache
    docker-compose up -d
fi

echo ""
echo "========================================="
echo "  DEPLOY COMPLETATO!"
echo "========================================="
echo ""
echo "  App disponibile su: http://77.81.226.230"
echo ""
echo "  Comandi utili:"
echo "    docker compose logs -f          # Vedi i log"
echo "    docker compose restart           # Riavvia tutto"
echo "    docker compose down              # Ferma tutto"
echo "    docker compose up -d --build     # Rebuild e riavvia"
echo ""
echo "  Per aggiornare:"
echo "    cd $APP_DIR && git pull && docker compose up -d --build"
echo ""
echo "========================================="
