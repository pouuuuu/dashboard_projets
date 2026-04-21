# 📊 Application de Gestion de Projets et Interventions

Application web FastAPI permettant de visualiser et gérer les projets et interventions d'une entreprise avec une structure hiérarchique intuitive.

---

## 📁 Structure du Projet

```
myapp/
│
├── main.py                 # Application principale (connexion MySQL)
├── main_test.py           # Application de test (données JSON)
├── test_data.json         # Données de test simulées
│
├── templates/
│   └── table.html         # Template HTML principal
│
└── README.md              # Documentation (ce fichier)
```

---

## 🎯 Fonctionnalités

### 🏢 Structure Hiérarchique à 3 Niveaux

1. **Niveau 1 - Entreprise**
   - En-tête gris foncé (#2c3e50)
   - Affiche le nom de l'entreprise et son statut global
   - Clic pour dérouler/replier la liste des projets

2. **Niveau 2 - Projets**
   - En-têtes colorés selon le type :
     - 🔵 **INFRA** : #1872A0 (bleu foncé)
     - 🟣 **LOGICIEL** : #8F536F (violet/rose)
     - ⚪ **Autre** : #4b9ce2 (bleu par défaut)
   - Affiche le nom du projet et son statut
   - Clic pour dérouler/replier le calendrier

3. **Niveau 3 - Calendrier des Interventions**
   - Vue calendrier par semaine ISO
   - Chaque intervention affiche :
     - 🎨 **Statut visuel** (couleur + émoji)
     - 📋 Nature de l'intervention
     - 👤 Technicien assigné

### 🎨 Statuts des Interventions

| Statut | Couleur | Émoji | Description |
|--------|---------|-------|-------------|
| À faire | 🔴 Rouge | ⚠️ | Action non démarrée |
| En cours | 🟡 Jaune | ⏳ | Action en cours de réalisation |
| Finalisation | 🔵 Bleu clair | 🛠️ | Action en phase finale |
| Terminé | 🟢 Vert | ✔️ | Action complétée |
| Inconnu | ⚪ Gris | ❔ | Statut non défini |

### 🔍 Filtres et Recherche

#### Page Projets

- **Barre de recherche** : Recherche par nom d'entreprise ou de projet
- **Filtres par statut** :
  - 📂 Tous les Projets
  - 🔄 Projets en Cours
  - ✅ Projets Clos

#### Page Dashboard

- **Recherche par colonne** : Clic sur 🔍 dans les en-têtes
  - NOM PROJET
  - NOM (Entreprise)
  - TECHNICIEN

### 📊 Statistiques en Temps Réel

- 📈 **Nombre total de projets**
- ⏰ **Actions en retard** (date passée + non terminée)
- 👤 **Actions non assignées** (sans technicien)

---

## 🚀 Installation et Démarrage

### Prérequis

```bash
Python 3.8+
pip install fastapi uvicorn jinja2 mysql-connector-python
```

### Lancement avec Base de Données MySQL

```bash
python main.py
```

Ou avec uvicorn :

```bash
uvicorn main:app --reload
```

### Lancement en Mode Test (JSON)

```bash
python main_test.py
```

Ou avec uvicorn :

```bash
uvicorn main_test:app --reload
```

Puis ouvrir : **http://127.0.0.1:8000**

---

## 🗄️ Structure des Données

### Base de Données MySQL (main.py)

**Table : `INTERVENTIONS`**

| Colonne | Type | Description |
|---------|------|-------------|
| NOM | VARCHAR | Nom de l'entreprise |
| NOM PROJET | VARCHAR | Nom du projet |
| NATURE_INTER | VARCHAR | Nature de l'intervention |
| TECHNICIEN | VARCHAR | Nom du technicien assigné |
| DATE | DATE | Date de l'intervention |
| STATUT | VARCHAR | Statut (ex: "1- A faire", "2- En cours") |
| AVANCEMENT | VARCHAR | Code d'avancement (1-4) |
| TERMINE | INT | 0 = non terminé, 1 = terminé |
| INT_TERMINE | BOOLEAN | Projet terminé ? |
| TOPERAT | VARCHAR | Type de projet (INFRA/LOGICIEL) |
| NUMEROR | VARCHAR | Numéro d'intervention |

### Fichier JSON (main_test.py)

Voir `test_data.json` pour un exemple complet de structure.

---

## 🎨 Architecture du Code

### Backend (FastAPI)

#### Flux de Données

```
1. Chargement des données (MySQL ou JSON)
   ↓
2. Normalisation des statuts (clean_statut)
   ↓
3. Calcul des statistiques (retard, non assigné)
   ↓
4. Organisation hiérarchique :
   entreprises_dict[entreprise][projet][semaine] = [interventions]
   ↓
5. Calcul du calendrier (semaines ISO + dates)
   ↓
6. Transformation pour Jinja (listes + dictionnaires)
   ↓
7. Rendu du template HTML
```

#### Fonction `clean_statut()`

Normalise les statuts provenant de la base de données :

- ✂️ Retire les préfixes numériques ("1- ", "2- ")
- 🔤 Convertit en minuscules
- 🌐 Supprime les accents
- 🎯 Mappe vers statuts standards

**Exemples :**
```python
"1- A réaliser" → "a faire"
"2- En cours" → "en cours"
"4- Terminé ✔" → "termine"
```

### Frontend (HTML/CSS/JavaScript)

#### Structure HTML

```html
<div class="entreprise">                      <!-- Niveau 1 -->
  <div class="entreprise-header">...</div>

  <div class="projets-list">                  <!-- Niveau 2 -->
    <div class="projet">
      <div class="projet-header">...</div>

      <div class="interventions">             <!-- Niveau 3 -->
        <div class="calendar-weeks">...</div>
        <div class="calendar-interventions">
          <div class="intervention-block">...</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### Fonctions JavaScript Principales

| Fonction | Description |
|----------|-------------|
| `showPage(pageId)` | Affiche une page (Projets/Dashboard) |
| `toggleProjets(id)` | Déplie/replie les projets d'une entreprise |
| `toggleInterventions(id)` | Déplie/replie le calendrier d'un projet |
| `applyFilters()` | Applique les filtres de recherche et statut |
| `toggleRow(projetId)` | Déplie/replie une ligne du Dashboard |

---

## 🎯 Cas d'Usage

### Scénario 1 : Consulter les projets d'une entreprise

1. 🖱️ Clic sur **OC CONSEIL**
2. 📂 La liste des projets s'affiche
3. 🖱️ Clic sur **"Mise à jour infrastructure"**
4. 📅 Le calendrier des interventions apparaît

### Scénario 2 : Filtrer les projets clos

1. 🔘 Clic sur **"Projets Clos"**
2. ✅ Seules les entreprises avec projets clos s'affichent
3. 🔄 Les projets en cours sont masqués

### Scénario 3 : Rechercher un projet

1. 🔍 Taper **"CRM"** dans la barre de recherche
2. 📋 Seul le projet "Développement CRM" s'affiche
3. 🏢 L'entreprise EUROP ELEC reste visible

### Scénario 4 : Identifier les actions en retard

1. 👁️ Consulter le résumé en haut à droite
2. 📊 **"Actions en retard : 3"**
3. ⚠️ Ces interventions ont une date passée et ne sont pas terminées

---

## 🛠️ Personnalisation

### Modifier les Couleurs

Dans `table.html`, section `<style>` :

```css
/* Couleur entreprise */
.entreprise-header {
    background-color: #2c3e50;  /* Modifier ici */
}

/* Couleur projet INFRA */
{% if projet.toperat == 'INFRA' %}
    {% set header_color = '#1872A0' %}  /* Modifier ici */
{% endif %}

/* Couleur projet LOGICIEL */
{% elif projet.toperat == 'LOGICIEL' %}
    {% set header_color = '#8F536F' %}  /* Modifier ici */
{% endif %}
```

### Ajouter un Nouveau Statut

1. **Backend** (`main.py` ou `main_test.py`) :

```python
def clean_statut(statut):
    # ... code existant ...
    elif "annule" in s:
        return "annule"  # Nouveau statut
```

2. **Template** (`table.html`) :

```html
{% elif prefix == '5' %}
    {% set css_class = 'statut-annule' %}
    {% set emoji = '🚫' %}
{% endif %}
```

3. **CSS** (`table.html`) :

```css
.statut-annule {
    background-color: #dc3545;  /* Rouge foncé */
}
```

---

## 📝 Notes Importantes

### Sécurité

⚠️ **Configuration de la base de données** : Les identifiants MySQL sont actuellement en dur dans `main.py`. Pour la production, utilisez des variables d'environnement :

```python
import os

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME")
}
```

### Performance

- 📊 L'application charge toutes les données en mémoire
- 🚀 Pour de grandes quantités de données, envisager :
  - Pagination
  - Chargement lazy (AJAX)
  - Cache côté serveur (Redis)

### Compatibilité

- ✅ Navigateurs modernes (Chrome, Firefox, Edge, Safari)
- 📱 Design responsive (s'adapte aux mobiles)
- 🌐 Encodage UTF-8 pour les caractères accentués

---

## 🐛 Dépannage

### Erreur : "Internal Server Error"

1. Vérifier la console du serveur FastAPI
2. Vérifier que `test_data.json` existe
3. Vérifier la connexion MySQL (pour `main.py`)

### Les filtres ne fonctionnent pas

1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs JavaScript
3. Vérifier que les statuts dans la BDD correspondent aux filtres

### Les couleurs INFRA/LOGICIEL ne s'affichent pas

1. Vérifier la colonne `TOPERAT` dans la base de données
2. Vérifier les valeurs exactes (majuscules/minuscules)
3. Consulter la console pour voir les valeurs récupérées

---

## 👥 Auteur

Développé pour SAGES par Cylien
## 📄 Licence

Propriétaire - Tous droits réservés
