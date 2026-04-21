#!/bin/bash

# Script de mise à jour DuckDNS
# À installer sur le serveur Linux

# ⚠️ CONFIGURATION - MODIFIER CES VALEURS
DUCKDNS_DOMAIN="votre-nom-ici"  # Ex: sages-dashboard
DUCKDNS_TOKEN="votre-token-ici" # Token depuis duckdns.org

# Mise à jour de l'IP
echo url="https://www.duckdns.org/update?domains=$DUCKDNS_DOMAIN&token=$DUCKDNS_TOKEN&ip=" | curl -k -o /tmp/duckdns.log -K -

# Log
cat /tmp/duckdns.log
echo ""
echo "$(date): Mise à jour DuckDNS effectuée" >> /var/log/duckdns.log
