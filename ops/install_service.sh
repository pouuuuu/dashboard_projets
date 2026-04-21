#!/bin/bash

# Script d'installation du service FastAPI Dashboard
# À exécuter sur le serveur Linux en tant que root ou avec sudo

echo "=========================================="
echo "Installation du service FastAPI Dashboard"
echo "=========================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ce script doit être exécuté en tant que root ou avec sudo"
    echo "Utilisez: sudo bash install_service.sh"
    exit 1
fi

# Vérifier que le fichier de service existe
if [ ! -f "fastapi-dashboard.service" ]; then
    echo "❌ Fichier fastapi-dashboard.service introuvable"
    echo "Assurez-vous d'être dans le bon répertoire"
    exit 1
fi

# Copier le fichier de service
echo "📁 Copie du fichier de service dans /etc/systemd/system/..."
cp fastapi-dashboard.service /etc/systemd/system/
chmod 644 /etc/systemd/system/fastapi-dashboard.service

# Recharger systemd
echo "🔄 Rechargement de systemd..."
systemctl daemon-reload

# Activer le service au démarrage
echo "✅ Activation du service au démarrage..."
systemctl enable fastapi-dashboard.service

# Démarrer le service
echo "🚀 Démarrage du service..."
systemctl start fastapi-dashboard.service

# Attendre 2 secondes
sleep 2

# Vérifier le statut
echo ""
echo "=========================================="
echo "Statut du service:"
echo "=========================================="
systemctl status fastapi-dashboard.service --no-pager

echo ""
echo "=========================================="
echo "Installation terminée !"
echo "=========================================="
echo ""
echo "📋 Commandes utiles:"
echo "  - Voir le statut      : sudo systemctl status fastapi-dashboard"
echo "  - Redémarrer          : sudo systemctl restart fastapi-dashboard"
echo "  - Arrêter             : sudo systemctl stop fastapi-dashboard"
echo "  - Voir les logs       : sudo journalctl -u fastapi-dashboard -f"
echo "  - Désactiver au boot  : sudo systemctl disable fastapi-dashboard"
echo ""
