from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import mysql.connector
from datetime import date, datetime
from collections import defaultdict
import unicodedata

app = FastAPI()
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="sj")
app.mount("/public/images", StaticFiles(directory="public/images"), name="images")

DB_CONFIG = {
    "host": "192.168.34.116",
    "user": "codial",
    "password": "bt0326",
    "database": "grafana"
}


def clean_statut(statut):
    """Normalise le statut pour correspondre au CSS attendu, même avec chiffres et accents."""
    if not statut:
        return "a faire"

    # Forcer string si bytes
    if isinstance(statut, bytes):
        statut = statut.decode("utf-8", errors="ignore")

    # Nettoyage : retirer retour chariot, saut de ligne, espaces
    s = statut.replace("\r", "").replace("\n", "").strip().lower()

    # Supprimer accents
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")

    # Retirer le préfixe chiffre + tiret si présent (ex: "1- a realiser")
    if "-" in s:
        s = s.split("-", 1)[1].strip()

    # Mapping vers statut standard
    if "faire" in s or "realiser" in s:
        return "a faire"
    elif "cours" in s:
        return "en cours"
    elif "finalisation" in s:
        return "finalisation"
    elif "termine" in s or "✔" in s:
        return "termine"
    else:
        print(f"Statut inconnu: '{statut}' -> '{s}'")  # debug
        return "a faire"


@app.get("/", response_class=HTMLResponse)
def read_data(request: Request, filter: str = None):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM INTERVENTIONS WHERE DATE >= '2025-12-01' and `NOM PROJET`<> '';")
        rows = cursor.fetchall()

        # Debug: afficher les colonnes disponibles
        if rows:
            print("Colonnes disponibles:", list(rows[0].keys()))

        projets_set = set()
        actions_retard = 0
        actions_non_assign = 0
        filtered_rows = []

        # Structure entreprises -> projets -> semaines -> interventions
        entreprises_dict = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

        for row in rows:
            nom_entreprise = row.get("NOM", "").strip()
            nom_projet = row.get("NOM PROJET", "").strip()
            if nom_entreprise:
                projets_set.add(nom_entreprise)

            date_action = row.get("DATE")
            ligne_de_mort = row.get("LIGNE_DE_MORT")  # Date de fin/deadline
            termine = row.get("TERMINE", 0)
            # Utiliser AVANCEMENT au lieu de STATUT (colonne n'existe pas dans la BDD)
            # AVANCEMENT est déjà au format "1- A faire", "2- En cours", etc.
            statut_raw = row.get("AVANCEMENT", "")

            # Normalisation du statut
            statut = clean_statut(statut_raw)
            row["STATUT_CLEAN"] = statut  # pour debug/template

            # Actions en retard (utiliser LIGNE_DE_MORT pour la deadline)
            if ligne_de_mort and isinstance(ligne_de_mort, date):
                if ligne_de_mort < date.today() and termine == 0:
                    actions_retard += 1

            # Actions non assignées
            if not row.get("TECHNICIEN"):
                actions_non_assign += 1

            # Conserver la valeur originale de TERMINE pour les filtres
            row["TERMINE_ORIGINAL"] = termine
            # Affichage ✔️ pour terminé
            row["TERMINE"] = "✔️" if termine == 1 else ""

            # Filtrage (utiliser LIGNE_DE_MORT pour les retards)
            if filter == "retard" and ligne_de_mort and ligne_de_mort < date.today() and termine == 0:
                filtered_rows.append(row)
            elif filter == "non_assign" and not row.get("TECHNICIEN"):
                filtered_rows.append(row)
            elif filter == "projets" or filter is None:
                filtered_rows.append(row)

            # Vérifier que date_action existe pour le calendrier
            if not date_action or not isinstance(date_action, date):
                continue  # Ignorer cette ligne si pas de date (pas de calendrier)

            # Calcul semaine ISO
            annee = date_action.year
            semaine = str(annee) + "-" + str(date_action.isocalendar()[1])

            # Classe CSS et émoji selon statut
            match statut:
                case "a faire":
                    css_class = "statut-a-faire"
                    emoji = "⚠️"
                case "en cours":
                    css_class = "statut-en-cours"
                    emoji = "🔧"
                case "finalisation":
                    css_class = "statut-finalisation"
                    emoji = "🧪"
                case "termine":
                    css_class = "statut-termine"
                    emoji = "✅"
                case _:
                    css_class = "statut-inconnu"
                    emoji = "❓"

            # Ajouter l'intervention à entreprise -> projet -> semaine
            entreprises_dict[nom_entreprise][nom_projet][semaine].append({
                "numeror": row.get("NUMEROR", ""),
                "nature": row.get("NATURE_INTER", ""),
                "technicien": row.get("TECHNICIEN", ""),
                "css_class": css_class,
                "emoji": emoji,
                "avancement": row.get("AVANCEMENT", ""),
                "etat_projet":row.get("INT_TERMINE", ""),
                "toperat": row.get("TOPERAT", ""),
                "date": date_action.strftime("%Y-%m-%d") if date_action else "",
                "sujet": row.get("SUJET_INTER", "")
            })

        # Liste triée de toutes les semaines pour alignement
        all_weeks = sorted({
            semaine
            for projets in entreprises_dict.values()
            for semaines in projets.values()
            for semaine in semaines
        })

        # Dates de début de semaine
        week_start_dates = {}
        current_year = date.today().year
        for semaine in all_weeks:
            lundi = datetime.fromisocalendar(annee, int(semaine.split("-")[1]), 1)
            week_start_dates[semaine] = lundi.strftime("%d/%m/%Y")

        # Transformer en liste pour Jinja : Entreprises -> Projets -> Semaines
        entreprises = []

        for nom_entreprise, projets_data in entreprises_dict.items():
            projets_list = []

            for nom_projet, semaines in projets_data.items():
                etat_action = ""
                toperat_projet = "N/A"  # Valeur par défaut
                dates_interventions = []

                for semaine_actions in semaines.values():
                    for action in semaine_actions:
                        etat_action = action.get("etat_projet", "")
                        # Récupérer toperat seulement s'il est non vide
                        current_toperat = action.get("toperat", "")
                        if current_toperat and current_toperat.strip():
                            toperat_projet = current_toperat
                        if etat_action == True:
                            etat_action = "Clôs"
                        else:
                            etat_action = "En cours"

                # Récupérer toutes les dates des interventions du projet
                for row in rows:
                    if row.get("NOM", "").strip() == nom_entreprise and row.get("NOM PROJET", "").strip() == nom_projet:
                        date_action = row.get("DATE")
                        if date_action and isinstance(date_action, date):
                            dates_interventions.append(date_action)

                # Calculer les dates de début et de fin
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

            # Déterminer le statut de l'entreprise (Clôs si tous projets clôs, sinon En cours)
            if projets_list:
                statut_entreprise = "Clôs" if all(p["statut_projet"] == "Clôs" for p in projets_list) else "En cours"
            else:
                statut_entreprise = "En cours"

            entreprises.append({
                "nom_entreprise": nom_entreprise,
                "projets": projets_list,
                "statut_entreprise": statut_entreprise
            })

        # Envoi à Jinja
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
                "today": date.today()
            }
        )



    except mysql.connector.Error as err:
        return HTMLResponse(f"<h1>Erreur MySQL</h1><pre>{err}</pre>", status_code=500)

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
