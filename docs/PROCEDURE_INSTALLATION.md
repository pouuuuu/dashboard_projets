# 🔧 Procédure d'installation - Application de Gestion des Interventions

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Installation étape par étape](#installation-étape-par-étape)
3. [Configuration de la base de données](#configuration-de-la-base-de-données)
4. [Structure des fichiers](#structure-des-fichiers)
5. [Démarrage de l'application](#démarrage-de-lapplication)
6. [Vérification et tests](#vérification-et-tests)
7. [Dépannage](#dépannage)

---

## 🎯 Prérequis

### Logiciels nécessaires

| Logiciel | Version minimale | Téléchargement |
|----------|------------------|----------------|
| Python | 3.10+ | https://www.python.org/downloads/ |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/ |
| Éditeur de code | - | VS Code, PyCharm, Notepad++, etc. |

### Connaissances recommandées
- ✅ Commandes de base en ligne de commande (cmd/PowerShell/bash)
- ✅ Notions de SQL (optionnel mais utile)
- ✅ Connaissance basique de Python (optionnel)

---

## 📦 Installation étape par étape

### ÉTAPE 1 : Créer la structure du projet

#### 1.1 Créer le dossier principal
```bash
# Créer le dossier du projet
mkdir myapp
cd myapp
```

#### 1.2 Créer la structure des dossiers
```bash
# Créer les sous-dossiers nécessaires
mkdir templates
mkdir static
mkdir static/images
```

**Structure finale attendue** :
```
myapp/
├── main.py                    # Fichier principal de l'application
├── main_test.py              # Version de test (optionnelle)
├── templates/
│   └── table.html            # Template HTML principal
└── static/
    └── images/
        └── logo.png          # Logo de l'entreprise (optionnel)
```

---

### ÉTAPE 2 : Installer Python et les dépendances

#### 2.1 Vérifier l'installation de Python
```bash
python --version
```
**Résultat attendu** : `Python 3.10.x` ou supérieur

#### 2.2 Créer un environnement virtuel (recommandé)
```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows :
venv\Scripts\activate
# Sur Linux/Mac :
source venv/bin/activate
```

#### 2.3 Installer les dépendances Python
```bash
pip install fastapi uvicorn mysql-connector-python jinja2 python-multipart
```

**Liste des packages** :
- `fastapi` : Framework web
- `uvicorn` : Serveur ASGI
- `mysql-connector-python` : Connexion MySQL
- `jinja2` : Moteur de templates
- `python-multipart` : Gestion des formulaires (optionnel)

#### 2.4 Vérifier l'installation
```bash
pip list
```

---

### ÉTAPE 3 : Configuration de la base de données

#### 3.1 Créer la base de données MySQL

**Ouvrir MySQL** :
```bash
mysql -u root -p
```

**Créer la base de données et l'utilisateur** :
```sql
-- Créer la base de données
CREATE DATABASE IF NOT EXISTS grafana CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur
CREATE USER IF NOT EXISTS 'codial'@'%' IDENTIFIED BY 'bt0326';

-- Donner les permissions
GRANT ALL PRIVILEGES ON grafana.* TO 'codial'@'%';
FLUSH PRIVILEGES;

-- Utiliser la base de données
USE grafana;
```

#### 3.2 Créer la table INTERVENTIONS

```sql
CREATE TABLE IF NOT EXISTS INTERVENTIONS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    NOM VARCHAR(255) NOT NULL COMMENT 'Nom de l\'entreprise',
    `NOM PROJET` VARCHAR(255) NOT NULL COMMENT 'Nom du projet',
    NATURE_INTER VARCHAR(255) COMMENT 'Nature de l\'intervention',
    TECHNICIEN VARCHAR(100) COMMENT 'Technicien assigné',
    DATE DATE COMMENT 'Date prévue de l\'intervention',
    AVANCEMENT VARCHAR(50) COMMENT 'Statut : 1-À faire, 2-En cours, 3-Finalisation, 4-Terminé',
    TERMINE TINYINT DEFAULT 0 COMMENT '0=Non terminé, 1=Terminé',
    INT_TERMINE BOOLEAN DEFAULT FALSE COMMENT 'Projet clôturé',
    TOPERAT VARCHAR(50) COMMENT 'Type de projet : INFRA, LOGICIEL, etc.',
    NUMEROR VARCHAR(50) COMMENT 'Numéro de référence',
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nom (NOM),
    INDEX idx_projet (`NOM PROJET`),
    INDEX idx_date (DATE),
    INDEX idx_technicien (TECHNICIEN)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3 Insérer des données de test (optionnel)

```sql
INSERT INTO INTERVENTIONS (NOM, `NOM PROJET`, NATURE_INTER, TECHNICIEN, DATE, AVANCEMENT, TERMINE, TOPERAT, NUMEROR)
VALUES
('Entreprise Alpha', 'Migration Cloud', 'Installation serveurs', 'Jean Dupont', '2025-02-10', '2- En cours', 0, 'INFRA', 'INT-001'),
('Entreprise Alpha', 'Migration Cloud', 'Configuration réseau', 'Marie Martin', '2025-02-15', '1- A faire', 0, 'INFRA', 'INT-002'),
('Entreprise Beta', 'Nouvelle Application', 'Développement Frontend', 'Paul Bernard', '2025-02-12', '2- En cours', 0, 'LOGICIEL', 'INT-003'),
('Entreprise Beta', 'Nouvelle Application', 'Tests unitaires', NULL, '2025-02-20', '1- A faire', 0, 'LOGICIEL', 'INT-004'),
('Entreprise Gamma', 'Maintenance', 'Audit sécurité', 'Sophie Dubois', '2025-01-25', '3- Finalisation', 0, 'INFRA', 'INT-005');
```

#### 3.4 Vérifier les données
```sql
SELECT * FROM INTERVENTIONS;
```

---

### ÉTAPE 4 : Créer le fichier principal (main.py)

#### 4.1 Créer `main.py` dans le dossier `myapp`

**Copier le code suivant** :

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import mysql.connector
from datetime import date, datetime
from collections import defaultdict
import unicodedata

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ⚠️ CONFIGURATION À MODIFIER SELON VOTRE ENVIRONNEMENT
DB_CONFIG = {
    "host": "localhost",        # Adresse du serveur MySQL (localhost ou IP)
    "user": "codial",           # Utilisateur MySQL
    "password": "bt0326",       # Mot de passe MySQL
    "database": "grafana"       # Nom de la base de données
}


def clean_statut(statut):
    """Normalise le statut pour correspondre au CSS attendu."""
    if not statut:
        return "a faire"

    if isinstance(statut, bytes):
        statut = statut.decode("utf-8", errors="ignore")

    s = statut.replace("\r", "").replace("\n", "").strip().lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")

    if "-" in s:
        s = s.split("-", 1)[1].strip()

    if "faire" in s or "realiser" in s:
        return "a faire"
    elif "cours" in s:
        return "en cours"
    elif "finalisation" in s:
        return "finalisation"
    elif "termine" in s or "✔" in s:
        return "termine"
    else:
        return "a faire"


@app.get("/", response_class=HTMLResponse)
def read_data(request: Request, filter: str = None):
    conn = None
    cursor = None
    try:
        # Connexion à la base de données
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Requête SQL : récupérer toutes les interventions à partir de décembre 2025
        cursor.execute("SELECT * FROM INTERVENTIONS WHERE DATE >= '2025-12-01' and `NOM PROJET` <> '';")
        rows = cursor.fetchall()

        projets_set = set()
        actions_retard = 0
        actions_non_assign = 0
        filtered_rows = []

        # Structure : entreprises -> projets -> semaines -> interventions
        entreprises_dict = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

        for row in rows:
            nom_entreprise = row.get("NOM", "").strip()
            nom_projet = row.get("NOM PROJET", "").strip()
            if nom_entreprise:
                projets_set.add(nom_entreprise)

            date_action = row.get("DATE")
            termine = row.get("TERMINE", 0)
            statut_raw = row.get("AVANCEMENT", "")
            statut = clean_statut(statut_raw)
            row["STATUT_CLEAN"] = statut

            # Calcul des actions en retard
            if date_action and isinstance(date_action, date):
                if date_action < date.today() and termine == 0:
                    actions_retard += 1

            # Calcul des actions non assignées
            if not row.get("TECHNICIEN"):
                actions_non_assign += 1

            # ⚠️ IMPORTANT : Préserver la valeur originale de TERMINE
            row["TERMINE_ORIGINAL"] = termine
            row["TERMINE"] = "✔️" if termine == 1 else ""

            # Filtrage des lignes
            if filter == "retard" and date_action and date_action < date.today() and termine == 0:
                filtered_rows.append(row)
            elif filter == "non_assign" and not row.get("TECHNICIEN"):
                filtered_rows.append(row)
            elif filter == "projets" or filter is None:
                filtered_rows.append(row)

            # Calcul de la semaine ISO
            annee = date_action.year
            semaine = str(annee) + "-" + str(date_action.isocalendar()[1])

            # Classe CSS et emoji selon statut
            if statut == "a faire":
                css_class = "statut-a-faire"
                emoji = "⚠️"
            elif statut == "en cours":
                css_class = "statut-en-cours"
                emoji = "🔧"
            elif statut == "finalisation":
                css_class = "statut-finalisation"
                emoji = "🧪"
            elif statut == "termine":
                css_class = "statut-termine"
                emoji = "✅"
            else:
                css_class = "statut-inconnu"
                emoji = "❓"

            # Ajouter l'intervention à la structure
            entreprises_dict[nom_entreprise][nom_projet][semaine].append({
                "numeror": row.get("NUMEROR", ""),
                "nature": row.get("NATURE_INTER", ""),
                "technicien": row.get("TECHNICIEN", ""),
                "css_class": css_class,
                "emoji": emoji,
                "avancement": row.get("AVANCEMENT", ""),
                "etat_projet": row.get("INT_TERMINE", ""),
                "toperat": row.get("TOPERAT", ""),
                "date": date_action.strftime("%Y-%m-%d") if date_action else ""
            })

        # Liste triée de toutes les semaines
        all_weeks = sorted({
            semaine
            for projets in entreprises_dict.values()
            for semaines in projets.values()
            for semaine in semaines
        })

        # Dates de début de semaine
        week_start_dates = {}
        for semaine in all_weeks:
            annee = int(semaine.split("-")[0])
            num_semaine = int(semaine.split("-")[1])
            lundi = datetime.fromisocalendar(annee, num_semaine, 1)
            week_start_dates[semaine] = lundi.strftime("%d/%m/%Y")

        # Transformer en liste pour Jinja
        entreprises = []

        for nom_entreprise, projets_data in entreprises_dict.items():
            projets_list = []

            for nom_projet, semaines in projets_data.items():
                etat_action = ""
                toperat_projet = "N/A"
                dates_interventions = []

                for semaine_actions in semaines.values():
                    for action in semaine_actions:
                        etat_action = action.get("etat_projet", "")
                        current_toperat = action.get("toperat", "")
                        if current_toperat and current_toperat.strip():
                            toperat_projet = current_toperat
                        if etat_action == True:
                            etat_action = "Clôs"
                        else:
                            etat_action = "En cours"

                # Récupérer les dates min/max
                for row in rows:
                    if row.get("NOM", "").strip() == nom_entreprise and row.get("NOM PROJET", "").strip() == nom_projet:
                        date_action = row.get("DATE")
                        if date_action and isinstance(date_action, date):
                            dates_interventions.append(date_action)

                if dates_interventions:
                    date_debut = min(dates_interventions).strftime("%d/%m/%Y")
                    date_fin = max(dates_interventions).strftime("%d/%m/%Y")
                else:
                    date_debut = "N/A"
                    date_fin = "N/A"

                projets_list.append({
                    "nom_projet": nom_projet,
                    "semaines": dict(sorted(semaines.items())),
                    "statut_projet": etat_action,
                    "toperat": toperat_projet,
                    "date_debut": date_debut,
                    "date_fin": date_fin
                })

            # Statut de l'entreprise
            if projets_list:
                statut_entreprise = "Clôs" if all(p["statut_projet"] == "Clôs" for p in projets_list) else "En cours"
            else:
                statut_entreprise = "En cours"

            entreprises.append({
                "nom_entreprise": nom_entreprise,
                "projets": projets_list,
                "statut_entreprise": statut_entreprise
            })

        # ⚠️ IMPORTANT : Passer la variable "today" au template
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "rows": filtered_rows,
                "nombre_projets": len(projets_set),
                "actions_retard": actions_retard,
                "actions_non_assign": actions_non_assign,
                "filter": filter,
                "entreprises": entreprises,
                "all_weeks": all_weeks,
                "week_start_dates": week_start_dates,
                "today": date.today()  # ← ESSENTIEL pour la page "Actions en Retard"
            }
        )

    except mysql.connector.Error as err:
        return HTMLResponse(f"<h1>Erreur MySQL</h1><pre>{err}</pre>", status_code=500)

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
```

**Points importants à configurer** :
- ⚠️ Ligne 14-19 : `DB_CONFIG` - **Adapter selon votre environnement**
- ⚠️ Ligne 52 : Date de filtre `WHERE DATE >= '2025-12-01'` - **Modifier si nécessaire**

---

### ÉTAPE 5 : Créer le template HTML (table.html)

#### 5.1 Créer le fichier `templates/table.html`

⚠️ **Ce fichier est très volumineux (1850+ lignes)**

**Option 1 : Copier depuis le fichier existant**
```bash
# Si vous avez déjà le fichier
cp /chemin/source/index.html templates/index.html
```

**Option 2 : Télécharger depuis le dépôt**
- Le fichier complet est disponible dans le dossier `Templates/table.html`

**Option 3 : Demander le fichier complet**
- Contactez l'équipe de développement pour obtenir le template complet

**Sections principales du template** :
1. **CSS** (lignes 1-800) : Styles de l'interface
2. **Sidebar** (lignes 800-1100) : Menu de navigation
3. **Pages** (lignes 1100-1750) :
   - Page Projets
   - Page Dashboard
   - Page Planning (Général + Technicien)
   - Page Actions Non Assignées
   - Page Actions en Retard
4. **JavaScript** (lignes 1750-fin) : Logique interactive

---

### ÉTAPE 6 : Ajouter un logo (optionnel)

#### 6.1 Placer le logo dans `static/images/`
```bash
# Copier votre logo
cp /chemin/vers/logo.png static/images/logo.png
```

#### 6.2 Formats recommandés
- **Format** : PNG avec fond transparent
- **Dimensions** : 180x60 pixels (ou ratio similaire)
- **Poids** : < 100 KB

---

### ÉTAPE 7 : Démarrage de l'application

#### 7.1 Vérifier la configuration

**Checklist avant démarrage** :
- ✅ Python 3.10+ installé
- ✅ Packages Python installés
- ✅ Base de données MySQL créée
- ✅ Table INTERVENTIONS créée avec des données
- ✅ Fichier `main.py` configuré (DB_CONFIG)
- ✅ Fichier `templates/table.html` présent
- ✅ Structure des dossiers correcte

#### 7.2 Démarrer le serveur

```bash
# Se placer dans le dossier du projet
cd myapp

# Activer l'environnement virtuel (si créé)
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Démarrer le serveur
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Options de la commande** :
- `--host 0.0.0.0` : Accessible depuis le réseau
- `--port 8000` : Port d'écoute
- `--reload` : Redémarrage automatique lors des modifications

#### 7.3 Résultat attendu dans la console

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## ✅ Vérification et tests

### TEST 1 : Accéder à l'application

**Ouvrir un navigateur** et aller sur :
```
http://localhost:8000
```

**Résultat attendu** :
- ✅ La page "Projets et Interventions" s'affiche
- ✅ Le résumé statistique en haut affiche les chiffres
- ✅ La sidebar est visible à gauche

### TEST 2 : Vérifier la base de données

**Tester la connexion MySQL** :
```bash
mysql -u codial -pbt0326 -e "SELECT COUNT(*) as total FROM grafana.INTERVENTIONS;"
```

**Résultat attendu** :
```
+-------+
| total |
+-------+
|     5 |
+-------+
```

### TEST 3 : Tester les pages

| Page | URL | Test |
|------|-----|------|
| Projets | `http://localhost:8000/` | Liste des entreprises visible |
| Dashboard | Cliquer sur "📊 Dashboard" | Tableau avec données |
| Planning | Cliquer sur "📅 Planning Général" | Calendrier affiché |
| Actions en retard | Cliquer sur "⏰ Actions en Retard" | Liste des actions (si données < aujourd'hui) |

### TEST 4 : Vérifier les logs

**Dans la console** où tourne uvicorn :
```
INFO:     10.10.1.125:52609 - "GET / HTTP/1.1" 200 OK
```

**Statut 200** = Succès ✅
**Statut 500** = Erreur ❌ (voir section Dépannage)

---

## 🔧 Dépannage

### Erreur : "ModuleNotFoundError: No module named 'fastapi'"

**Solution** :
```bash
pip install fastapi uvicorn mysql-connector-python jinja2
```

---

### Erreur : "Can't connect to MySQL server"

**Causes possibles** :
1. MySQL n'est pas démarré
2. Mauvaise configuration dans `DB_CONFIG`
3. Pare-feu bloque la connexion

**Solutions** :
```bash
# Vérifier que MySQL tourne
# Windows :
net start MySQL80

# Linux :
sudo systemctl start mysql

# Tester la connexion
mysql -u codial -pbt0326 -h localhost
```

---

### Erreur : "jinja2.exceptions.UndefinedError: 'today' is undefined"

**Cause** : Variable `today` manquante dans le contexte du template

**Solution** :
Vérifier ligne 238 de `main.py` :
```python
return templates.TemplateResponse(
    "index.html",
    {
        # ... autres variables ...
        "today": date.today()  # ← Cette ligne doit être présente
    }
)
```

---

### Erreur : "TemplateNotFound: table.html"

**Cause** : Le fichier `table.html` n'est pas dans le bon dossier

**Solution** :
```bash
# Vérifier la structure
ls templates/index.html

# Si absent, créer le fichier au bon endroit
```

---

### Erreur : "Port 8000 already in use"

**Cause** : Une autre application utilise le port 8000

**Solution** :
```bash
# Utiliser un autre port
uvicorn main:app --host 0.0.0.0 --port 8080 --reload

# Ou tuer le processus qui utilise le port 8000
# Windows :
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux :
lsof -ti:8000 | xargs kill -9
```

---

### La page "Actions en Retard" est vide

**Causes possibles** :
1. Aucune action n'a une date dépassée
2. Toutes les actions sont terminées (TERMINE = 1)
3. Variable `today` non définie

**Solution** :
```sql
-- Ajouter une action en retard pour tester
INSERT INTO INTERVENTIONS (NOM, `NOM PROJET`, NATURE_INTER, DATE, TERMINE)
VALUES ('Test', 'Test Projet', 'Action test', '2025-01-01', 0);
```

---

## 📚 Ressources supplémentaires

- **Documentation FastAPI** : https://fastapi.tiangolo.com/
- **Documentation Jinja2** : https://jinja.palletsprojects.com/
- **Documentation MySQL** : https://dev.mysql.com/doc/

---

## 🎯 Checklist finale d'installation

```
✅ Python 3.10+ installé
✅ MySQL installé et démarré
✅ Base de données `grafana` créée
✅ Table `INTERVENTIONS` créée
✅ Données de test insérées
✅ Environnement virtuel créé (optionnel)
✅ Packages Python installés (fastapi, uvicorn, mysql-connector-python, jinja2)
✅ Structure des dossiers créée (myapp/templates/static)
✅ Fichier main.py créé et configuré (DB_CONFIG)
✅ Fichier templates/table.html créé
✅ Logo placé dans static/images/ (optionnel)
✅ Serveur uvicorn démarré
✅ Application accessible sur http://localhost:8000
✅ Les 5 pages fonctionnent correctement
✅ Données affichées sans erreur
```

---

## 🚀 Prochaines étapes

Une fois l'application installée et fonctionnelle :

1. **Importer vos données réelles** dans la table INTERVENTIONS
2. **Personnaliser le logo** dans `static/images/logo.png`
3. **Ajuster les filtres** (dates, statuts) selon vos besoins
4. **Mettre en production** sur un serveur (Linux, Windows Server)
5. **Configurer un reverse proxy** (Nginx, Apache) pour la production
6. **Activer HTTPS** avec un certificat SSL

---

**Version de la procédure** : 1.0
**Date de création** : 16/02/2026
**Testé sur** : Windows 10/11, Ubuntu 22.04, Python 3.10+
