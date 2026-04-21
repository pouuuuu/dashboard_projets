# 📖 Documentation - Application de Gestion des Interventions Projets

## 🎯 Vue d'ensemble

Cette application web FastAPI permet de **visualiser et suivre les interventions et projets** d'une entreprise. Elle offre plusieurs vues pour analyser l'avancement des projets, gérer les calendriers d'interventions et identifier les actions critiques.

---

## 🏗️ Architecture

- **Backend**: FastAPI (Python)
- **Frontend**: HTML/CSS/JavaScript avec templates Jinja2
- **Base de données**: MySQL (base `grafana`, table `INTERVENTIONS`)
- **Serveur**: Uvicorn

---

## 📊 Fonctionnalités principales

L'application propose **5 pages principales** accessibles via une barre de navigation latérale :

---

### 1️⃣ **📁 Projets et Interventions** (Page d'accueil)

**Description**: Vue hiérarchique des entreprises, projets et interventions organisés par semaine.

**Fonctionnalités**:
- **Résumé statistique interactif** en haut de page :
  - Nombre total de projets
  - **Nombre d'actions en retard** (cliquable - redirige vers la page "Actions en Retard")
  - **Nombre d'actions non assignées** (cliquable - redirige vers la page "Actions Non Assignées")
  - Effet visuel au survol pour indiquer l'interactivité

- **Barre de recherche** : Permet de rechercher un projet spécifique par nom

- **Filtres disponibles** :
  - `Tous Les Projets` : Affiche tous les projets
  - `Projets En Cours` : Affiche uniquement les projets actifs
  - `Projets Clôs` : Affiche uniquement les projets terminés
  - `Projets Non Planifiés` : Affiche les projets sans interventions planifiées

- **Structure hiérarchique à 3 niveaux** :
  1. **Entreprise** : Nom + statut (En cours / Clôs)
  2. **Projet** : Nom + dates début/fin + statut + code couleur selon type (INFRA, LOGICIEL, Autre)
  3. **Interventions** : Calendrier hebdomadaire avec interventions détaillées

- **Calendrier des interventions** :
  - Organisé par semaines ISO
  - Chaque semaine affiche : numéro de semaine + date du lundi
  - Interventions affichées avec :
    - Nature de l'intervention
    - Technicien assigné
    - Statut visuel (emoji + couleur)

**Statuts des interventions** :
| Statut | Emoji | Couleur | Signification |
|--------|-------|---------|---------------|
| À faire | ⚠️ | Jaune | Intervention planifiée mais non démarrée |
| En cours | ⏳ | Bleu | Intervention en cours de réalisation |
| Finalisation | 🛠️ | Orange | Intervention en phase de finalisation |
| Terminé | ✔️ | Vert | Intervention complétée |

**Codes couleur des projets** :
- 🔵 **Bleu** (#1872A0) : Projets INFRA
- 🟣 **Violet** (#8F536F) : Projets LOGICIEL
- 🔷 **Bleu clair** (#4b9ce2) : Autres projets

---

### 2️⃣ **📊 Dashboard des Interventions**

**Description**: Tableau de données détaillé avec toutes les interventions et leurs informations complètes.

**Fonctionnalités**:
- **Résumé statistique** identique à la page Projets
- **Tableau complet** avec toutes les colonnes de la base de données :
  - Nom de l'entreprise
  - Nom du projet
  - Nature de l'intervention
  - Technicien assigné
  - Date
  - Statut / Avancement
  - TERMINE (✔️ si terminé)
  - Et toutes les autres colonnes disponibles

- **Fonctionnalités du tableau** :
  - **Tri par colonnes** : Cliquer sur un en-tête pour trier
  - **Recherche par colonnes** :
    - Icône 🔍 sur les colonnes `NOM PROJET`, `NOM`, `TECHNICIEN`
    - Permet de filtrer les lignes en temps réel

  - **Détails dépliables** :
    - Flèche ▶ sur chaque ligne
    - Affiche le calendrier complet du projet avec toutes les semaines

---

### 3️⃣ **📅 Planning**

**Description**: Calendrier interactif pour visualiser les interventions dans le temps.

Le menu Planning contient **2 sous-vues** :

#### 📅 **Planning Général**

**Fonctionnalités**:
- **Résumé statistique** :
  - Nombre d'entreprises
  - Actions en retard
  - Actions non assignées

- **Calendrier mensuel interactif** :
  - Navigation par mois (< et >)
  - Affichage du mois en cours
  - Jours du calendrier avec interventions

- **Légende des types de projets** :
  - 🔵 INFRA (bleu)
  - 🟣 LOGICIEL (violet)
  - 🔷 Autre (bleu clair)

- **Affichage des interventions par jour** :
  - Cliquer sur un jour pour voir les interventions prévues
  - Détails : nature, technicien, statut

#### 👷 **Planning par Technicien**

**Fonctionnalités**:
- **Filtre par technicien** : Menu déroulant pour sélectionner un technicien
- **Calendrier mensuel personnalisé** :
  - Affiche uniquement les interventions du technicien sélectionné
  - Navigation par mois
  - Vue claire de la charge de travail individuelle

---

### 4️⃣ **⚠️ Actions Non Assignées**

**Description**: Liste des interventions qui n'ont pas encore de technicien assigné.

**Fonctionnalités**:
- **Affichage sous forme de liste détaillée** :
  - Chaque action affichée avec :
    - Nature de l'intervention (en gras)
    - Nom du projet
    - Nom de l'entreprise
    - Technicien (affiché comme "Non assigné")
    - Date limite (colonne LIGNE_DE_MORT)
    - Sujet de l'intervention
  - **Fond jaune** avec **bordure orange** pour attirer l'attention

**Utilité** :
- Identifier rapidement les tâches qui nécessitent une assignation
- Faciliter la planification des ressources

---

### 5️⃣ **⏰ Actions en Retard**

**Description**: Liste des interventions dont la date limite est dépassée et qui ne sont pas encore terminées.

**Fonctionnalités**:
- **Affichage sous forme de liste détaillée** :
  - Nature de l'intervention (en gras)
  - Nom du projet
  - Nom de l'entreprise
  - Technicien assigné (ou "Non assigné")
  - Date limite (colonne LIGNE_DE_MORT, format DD/MM/YYYY)
  - Sujet de l'intervention

- **Mise en forme visuelle** :
  - **Fond rouge clair** avec **bordure rouge foncé**
  - Signal fort pour indiquer les actions critiques

**Critères de détection** :
- `LIGNE_DE_MORT < date du jour` (date limite dépassée)
- `TERMINE = 0` (pas encore terminée)

**Utilité** :
- Suivi des retards et gestion des priorités
- Alertes sur les actions critiques nécessitant une attention immédiate

---

## 🎨 Interface Utilisateur

### Barre de Navigation Latérale

**Fonctionnalités** :
- **Logo de l'entreprise** en haut
- **Menu de navigation** avec icônes :
  - 📁 Projets et Interventions
  - 📊 Dashboard
  - 📅 Planning (avec sous-menu déroulant)
    - 📅 Planning Général
    - 👷 Planning par Technicien
  - ⚠️ Actions Non Assignées
  - ⏰ Actions en Retard

- **Bouton de réduction** (◀ / ▶) :
  - Réduit la sidebar pour gagner de l'espace
  - Affiche uniquement les icônes en mode réduit

- **Indicateur de page active** :
  - Bordure bleue à gauche
  - Fond semi-transparent

### Navigation Rapide

**Compteurs Interactifs** :
- Les compteurs statistiques en haut de page sont **cliquables**
- Cliquer sur "**Actions en Retard**" → navigation directe vers la page dédiée
- Cliquer sur "**Non Assignées**" → navigation directe vers la page dédiée
- L'élément correspondant dans la sidebar s'active automatiquement
- Effet visuel au survol (ombre, déplacement, fond bleu clair)

---

## 🔄 Mise à jour des données

**Source des données** :
- Base de données MySQL : `grafana.INTERVENTIONS`
- **Filtre temporel** : Interventions à partir du `01/12/2025`
- **Filtre projet** : Exclut les lignes où `NOM PROJET` est vide

**Rafraîchissement** :
- Les données sont rechargées à chaque visite de la page
- Pour actualiser : rafraîchir la page (F5)

---

## 📈 Statistiques automatiques

L'application calcule automatiquement :

1. **Nombre de projets** : Compte unique des entreprises (`NOM`)
2. **Actions en retard** : `LIGNE_DE_MORT < aujourd'hui` ET `TERMINE = 0`
3. **Actions non assignées** : `TECHNICIEN` vide ou NULL

Ces statistiques sont affichées sur **toutes les pages** pour un suivi constant.

**Note importante** : Les actions en retard sont calculées à partir de la colonne `LIGNE_DE_MORT` (date limite/deadline) et non de la colonne `DATE` (date de début).

---

## 🛠️ Technologies utilisées

- **Python 3.10+**
- **FastAPI** : Framework web moderne
- **Jinja2** : Moteur de templates
- **MySQL Connector** : Connexion à la base de données
- **Uvicorn** : Serveur ASGI

---

## 🚀 Utilisation

### Démarrage du serveur

```bash
cd /chemin/vers/myapp
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Accès à l'application

- **URL locale** : http://localhost:8000
- **URL réseau** : http://[adresse-ip]:8000

---

## 📝 Notes importantes

- Les **dates** sont affichées au format français (`DD/MM/YYYY`)
- Les **semaines** sont calculées selon la norme ISO 8601
- Le champ `TERMINE` utilise les valeurs `0` (non terminé) et `1` (terminé)
- Le champ `AVANCEMENT` contient le statut préfixé (ex: "1- À faire", "2- En cours")
- Le champ `LIGNE_DE_MORT` contient la date limite/deadline des interventions
- Le champ `SUJET_INTER` contient le sujet détaillé de l'intervention
- La colonne `DATE` représente la date de début, tandis que `LIGNE_DE_MORT` représente la date limite

---

## 🎯 Cas d'usage typiques

1. **Chef de projet** : Suivre l'avancement global via la page Projets
2. **Manager** : Analyser les statistiques via le Dashboard
3. **Planificateur** : Organiser les ressources via le Planning
4. **Responsable RH** : Vérifier la charge de travail par technicien
5. **Coordinateur** : Identifier et résoudre les actions non assignées ou en retard

---

## 📞 Support

Pour toute question ou suggestion d'amélioration, contactez l'équipe de développement.

---

**Version de l'application** : 1.0
**Dernière mise à jour de la documentation** : 16/02/2026
