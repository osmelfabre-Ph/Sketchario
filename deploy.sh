#!/bin/bash
# ============================================
# SKETCHARIO V4 — Deploy Script per VPS Aruba
# ============================================
# Esegui questo script come root sul VPS
# Usage: bash deploy.sh
# ============================================

set -e

echo "========================================="
echo "  SKETCHARIO V4 — Deployment"
echo "========================================="

# 1. Aggiorna il sistema
echo "[1/6] Aggiornamento sistema..."
dnf update -y
dnf install -y git

# 2. Verifica Docker
echo "[2/6] Verifica Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installazione Docker..."
    dnf install -y docker
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Installazione Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

systemctl start docker

# 3. Clona il repository
echo "[3/6] Clona repository..."
cd /root
if [ -d "sketchario-v4" ]; then
    echo "Cartella esistente, aggiornamento..."
    cd sketchario-v4
    git pull
else
    echo "ATTENZIONE: Devi prima salvare il codice su GitHub da Emergent!"
    echo "Inserisci l'URL del tuo repository GitHub:"
    echo "(es: https://github.com/osmelfabre-Ph/Sketchario-V4.git)"
    read -p "URL: " REPO_URL
    git clone "$REPO_URL" sketchario-v4
    cd sketchario-v4
fi

# 4. Crea directory necessarie
echo "[4/6] Preparazione directory..."
mkdir -p nginx/ssl
mkdir -p backend/uploads

# 5. Apri le porte nel firewall
echo "[5/6] Configurazione firewall..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# 6. Build e avvia
echo "[6/6] Build e avvio containers..."
export DOMAIN_URL="http://77.81.226.230"
docker compose build --no-cache
docker compose up -d

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
echo "    cd /root/sketchario-v4"
echo "    git pull"
echo "    docker compose up -d --build"
echo ""
echo "========================================="
