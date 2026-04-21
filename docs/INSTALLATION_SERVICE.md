# 🚀 Installation du service FastAPI Dashboard (Démarrage Automatique)

## 📋 Objectif

Configurer l'application FastAPI pour qu'elle démarre automatiquement au démarrage du serveur Linux et reste toujours active.

---

## 🎯 Prérequis

Avant de commencer, assurez-vous que :
- ✅ L'application fonctionne manuellement avec `uvicorn main:app --host 0.0.0.0 --port 8000`
- ✅ Vous avez un accès SSH au serveur
- ✅ Vous avez les droits sudo/root sur le serveur
- ✅ Le serveur utilise systemd (Ubuntu, Debian, CentOS 7+, RHEL 7+)

---

## 📦 Étape 1 : Transférer les fichiers sur le serveur

### Option A : Via SCP (depuis Windows)

```bash
# Depuis votre PC Windows (PowerShell ou cmd)
scp fastapi-dashboard.service stgs@<adresse-serveur>:/planning_projet/myapp/
scp install_service.sh stgs@<adresse-serveur>:/planning_projet/myapp/
```

### Option B : Via copier-coller

1. Se connecter au serveur :
```bash
ssh stgs@<adresse-serveur>
```

2. Créer le fichier de service :
```bash
cd /planning_projet/myapp
nano fastapi-dashboard.service
```

3. Copier le contenu du fichier `fastapi-dashboard.service` depuis votre PC
4. Sauvegarder : `Ctrl+O`, `Entrée`, `Ctrl+X`

5. Créer le script d'installation :
```bash
nano install_service.sh
```

6. Copier le contenu du fichier `install_service.sh`
7. Sauvegarder et quitter

---

## ⚙️ Étape 2 : Vérifier la configuration

### 2.1 Vérifier le chemin d'uvicorn

```bash
# Se connecter au serveur
ssh stgs@<adresse-serveur>

# Trouver le chemin d'uvicorn
which uvicorn
```

**Résultats possibles** :
- `/home/stgs/.local/bin/uvicorn` (installation utilisateur)
- `/usr/local/bin/uvicorn` (installation système)
- `/usr/bin/uvicorn` (installation via apt)

### 2.2 Modifier le fichier de service si nécessaire

Si le chemin d'uvicorn est différent, éditer `fastapi-dashboard.service` :

```bash
nano fastapi-dashboard.service
```

Modifier la ligne `ExecStart` avec le bon chemin :
```ini
ExecStart=/chemin/correct/uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2.3 Vérifier le répertoire de travail

```bash
# Vérifier que le dossier existe
ls -la /planning_projet/myapp/

# Vérifier que main.py est présent
ls -la /planning_projet/myapp/main.py
```

---

## 🚀 Étape 3 : Installation du service

### 3.1 Rendre le script exécutable

```bash
cd /planning_projet/myapp
chmod +x install_service.sh
```

### 3.2 Exécuter le script d'installation

```bash
sudo bash install_service.sh
```

**Résultat attendu** :
```
==========================================
Installation du service FastAPI Dashboard
==========================================

📁 Copie du fichier de service dans /etc/systemd/system/...
🔄 Rechargement de systemd...
✅ Activation du service au démarrage...
🚀 Démarrage du service...

==========================================
Statut du service:
==========================================
● fastapi-dashboard.service - FastAPI Dashboard - Gestion des Interventions
     Loaded: loaded (/etc/systemd/system/fastapi-dashboard.service; enabled)
     Active: active (running) since ...
```

---

## ✅ Étape 4 : Vérification

### 4.1 Vérifier le statut du service

```bash
sudo systemctl status fastapi-dashboard
```

**Indicateurs de succès** :
- ✅ `Active: active (running)` en vert
- ✅ `Loaded: loaded (...; enabled)`
- ✅ Pas de messages d'erreur

### 4.2 Tester l'accès à l'application

Ouvrir un navigateur et aller sur :
```
http://<adresse-serveur>:8000
```

### 4.3 Vérifier les logs

```bash
# Voir les logs en temps réel
sudo journalctl -u fastapi-dashboard -f

# Voir les 50 dernières lignes
sudo journalctl -u fastapi-dashboard -n 50

# Voir les logs depuis aujourd'hui
sudo journalctl -u fastapi-dashboard --since today
```

### 4.4 Tester le redémarrage automatique

```bash
# Redémarrer le serveur
sudo reboot

# Après le redémarrage, se reconnecter et vérifier
ssh stgs@<adresse-serveur>
sudo systemctl status fastapi-dashboard

# L'application doit être active automatiquement
```

---

## 🎛️ Commandes de gestion du service

### Contrôle du service

```bash
# Démarrer le service
sudo systemctl start fastapi-dashboard

# Arrêter le service
sudo systemctl stop fastapi-dashboard

# Redémarrer le service
sudo systemctl restart fastapi-dashboard

# Recharger la configuration (sans interrompre le service)
sudo systemctl reload fastapi-dashboard

# Voir le statut
sudo systemctl status fastapi-dashboard
```

### Gestion du démarrage automatique

```bash
# Activer le démarrage automatique
sudo systemctl enable fastapi-dashboard

# Désactiver le démarrage automatique
sudo systemctl disable fastapi-dashboard

# Vérifier si activé
sudo systemctl is-enabled fastapi-dashboard
```

### Logs et diagnostic

```bash
# Logs en temps réel
sudo journalctl -u fastapi-dashboard -f

# Dernières 100 lignes
sudo journalctl -u fastapi-dashboard -n 100

# Logs d'aujourd'hui
sudo journalctl -u fastapi-dashboard --since today

# Logs entre deux dates
sudo journalctl -u fastapi-dashboard --since "2026-02-01" --until "2026-02-16"

# Exporter les logs
sudo journalctl -u fastapi-dashboard > dashboard_logs.txt
```

---

## 🔧 Dépannage

### Problème : Le service ne démarre pas

**Vérifier les logs** :
```bash
sudo journalctl -u fastapi-dashboard -n 50
```

**Erreurs courantes** :

#### 1. "Permission denied"
```bash
# Vérifier les permissions du dossier
ls -la /planning_projet/myapp/
sudo chown -R stgs:stgs /planning_projet/myapp/
```

#### 2. "ModuleNotFoundError: No module named 'fastapi'"
```bash
# Installer les dépendances pour l'utilisateur stgs
su - stgs
cd /planning_projet/myapp
pip install --user fastapi uvicorn mysql-connector-python jinja2
```

#### 3. "Can't connect to MySQL"
```bash
# Vérifier que MySQL est démarré
sudo systemctl status mysql

# Démarrer MySQL si nécessaire
sudo systemctl start mysql

# Modifier le fichier de service pour attendre MySQL
# La ligne "After=mysql.service" devrait déjà être présente
```

#### 4. "Address already in use"
```bash
# Vérifier quel processus utilise le port 8000
sudo lsof -i :8000

# Tuer le processus si nécessaire
sudo kill -9 <PID>

# Ou changer le port dans fastapi-dashboard.service
# Modifier : ExecStart=... --port 8001
```

---

### Problème : Le service s'arrête après quelques secondes

**Vérifier les logs** :
```bash
sudo journalctl -u fastapi-dashboard -n 100
```

**Causes possibles** :
1. Erreur dans main.py (syntaxe, import, etc.)
2. Base de données inaccessible
3. Mauvais chemin dans WorkingDirectory

**Test manuel** :
```bash
# Tester le démarrage manuel
cd /planning_projet/myapp
/home/stgs/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000

# Si ça fonctionne en manuel mais pas en service, vérifier :
# - L'utilisateur dans le fichier .service (User=stgs)
# - Les variables d'environnement (Environment=...)
```

---

### Problème : Modifications de main.py non prises en compte

**Solution** : Redémarrer le service après chaque modification
```bash
sudo systemctl restart fastapi-dashboard
```

**Note** : Le flag `--reload` n'est pas utilisé en production pour des raisons de stabilité. Pour le développement, utilisez le mode manuel.

---

## 🔄 Mise à jour du code

### Procédure pour mettre à jour l'application

```bash
# 1. Se connecter au serveur
ssh stgs@<adresse-serveur>

# 2. Aller dans le dossier de l'application
cd /planning_projet/myapp

# 3. Sauvegarder l'ancienne version (optionnel)
cp main.py main.py.backup

# 4. Modifier le fichier (via nano, vim, ou scp depuis votre PC)
nano main.py

# 5. Redémarrer le service pour appliquer les changements
sudo systemctl restart fastapi-dashboard

# 6. Vérifier que tout fonctionne
sudo systemctl status fastapi-dashboard
sudo journalctl -u fastapi-dashboard -n 20
```

---

## 🔒 Sécurité et bonnes pratiques

### 1. Utiliser un reverse proxy (Nginx)

**Avantages** :
- HTTPS / SSL
- Gestion des logs
- Cache
- Protection DDoS

**Configuration Nginx** :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Limiter l'accès au port 8000

```bash
# Bloquer l'accès externe au port 8000 (uniquement localhost)
sudo ufw deny 8000
sudo ufw allow from 127.0.0.1 to any port 8000
```

### 3. Activer les logs de rotation

Créer `/etc/logrotate.d/fastapi-dashboard` :
```
/var/log/fastapi-dashboard/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

---

## 📊 Monitoring

### Vérifier l'utilisation des ressources

```bash
# CPU et mémoire utilisés par le service
sudo systemctl status fastapi-dashboard | grep -E "Memory|CPU"

# Processus détaillés
ps aux | grep uvicorn
```

### Alertes en cas d'arrêt

Créer un script de surveillance :
```bash
#!/bin/bash
# /usr/local/bin/check_fastapi.sh

if ! systemctl is-active --quiet fastapi-dashboard; then
    echo "FastAPI Dashboard est arrêté !" | mail -s "ALERTE FastAPI" admin@example.com
    sudo systemctl start fastapi-dashboard
fi
```

Ajouter au crontab (vérification toutes les 5 minutes) :
```bash
sudo crontab -e
# Ajouter :
*/5 * * * * /usr/local/bin/check_fastapi.sh
```

---

## 📚 Checklist complète

```
✅ Fichiers transférés sur le serveur
✅ Chemin d'uvicorn vérifié et corrigé si nécessaire
✅ Répertoire /planning_projet/myapp accessible
✅ Script install_service.sh exécuté
✅ Service démarré : systemctl status fastapi-dashboard = active
✅ Application accessible sur http://<serveur>:8000
✅ Démarrage automatique activé : systemctl is-enabled = enabled
✅ Logs sans erreur : journalctl -u fastapi-dashboard
✅ Redémarrage du serveur testé
✅ Application redémarre automatiquement après reboot
```

---

## 🎉 Résultat final

Après l'installation :
- ✅ L'application démarre automatiquement au démarrage du serveur
- ✅ Le service redémarre automatiquement en cas d'erreur
- ✅ Accessible 24/7 sur http://<serveur>:8000
- ✅ Logs centralisés avec journalctl
- ✅ Gestion simple avec systemctl

---

**Version du document** : 1.0
**Date** : 16/02/2026
**Testé sur** : Ubuntu 20.04, Ubuntu 22.04, Debian 11, CentOS 8
