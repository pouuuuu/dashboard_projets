import json

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi import Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import mysql.connector
from datetime import date, datetime
from collections import defaultdict
import unicodedata

app = FastAPI()

# Montage des dossiers statiques
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/public/images", StaticFiles(directory="public/images"), name="images")

DB_CONFIG = {
    "host": "192.168.34.116",
    "user": "codial",
    "password": "bt0326",
    "database": "grafana"
}


def clean_statut(statut):
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


@app.get("/")
def serve_dashboard():
    return FileResponse("index.html")


@app.get("/api/projets")
def get_projets_data():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM INTERVENTIONS WHERE DATE >= '2025-12-01' and `NOM PROJET`<> '';")
        rows = cursor.fetchall()

        projets_set = set()
        actions_retard = 0
        actions_non_assign = 0

        entreprises_dict = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
        project_meta = defaultdict(lambda: defaultdict(lambda: {"dates": [], "toperat": "N/A", "clos": True}))

        for row in rows:
            nom_entreprise = row.get("NOM", "").strip()
            nom_projet = row.get("NOM PROJET", "").strip()
            if not nom_entreprise or not nom_projet:
                continue

            projets_set.add(nom_entreprise)

            date_action = row.get("DATE")
            ligne_de_mort = row.get("LIGNE_DE_MORT")
            termine = row.get("TERMINE", 0)

            statut_raw = row.get("AVANCEMENT", "")
            statut = clean_statut(statut_raw)

            row["STATUT_CLEAN"] = statut
            row["TERMINE_ORIGINAL"] = termine
            row["TERMINE"] = "✔️" if termine == 1 else ""

            if ligne_de_mort and isinstance(ligne_de_mort, date):
                if ligne_de_mort < date.today() and termine == 0:
                    actions_retard += 1

            if not row.get("TECHNICIEN"):
                actions_non_assign += 1

            if date_action and isinstance(date_action, date):
                project_meta[nom_entreprise][nom_projet]["dates"].append(date_action)

            current_toperat = row.get("TOPERAT", "")
            if current_toperat and current_toperat.strip():
                project_meta[nom_entreprise][nom_projet]["toperat"] = current_toperat.strip()

            if str(termine).strip().lower() not in ["1", "true"]:
                project_meta[nom_entreprise][nom_projet]["clos"] = False

            if not date_action or not isinstance(date_action, date):
                continue

            iso_year, iso_week, _ = date_action.isocalendar()
            semaine = f"{iso_year} - {iso_week:02d}"

            match statut:
                case "a faire":
                    css_class, emoji = "statut-a-faire", "⚠️"
                case "en cours":
                    css_class, emoji = "statut-en-cours", "🔧"
                case "finalisation":
                    css_class, emoji = "statut-finalisation", "🧪"
                case "termine":
                    css_class, emoji = "statut-termine", "✅"
                case _:
                    css_class, emoji = "statut-inconnu", "❓"

            entreprises_dict[nom_entreprise][nom_projet][semaine].append({
                "numeror": row.get("NUMEROR", ""),
                "nature": row.get("NATURE_INTER", ""),
                "technicien": row.get("TECHNICIEN", ""),
                "css_class": css_class,
                "emoji": emoji,
                "avancement": row.get("AVANCEMENT", ""),
                "toperat": row.get("TOPERAT", ""),
                "date": date_action.strftime("%Y-%m-%d"),
                "sujet": row.get("SUJET_INTER", "")
            })

        all_weeks = sorted({
            semaine
            for projets in entreprises_dict.values()
            for semaines in projets.values()
            for semaine in semaines
        })

        week_start_dates = {}
        for semaine in all_weeks:
            year, week_num = map(int, semaine.split("-"))
            lundi = datetime.fromisocalendar(year, week_num, 1)
            week_start_dates[semaine] = lundi.strftime("%d/%m/%Y")

        entreprises = []
        for nom_entreprise, projets_data in entreprises_dict.items():
            projets_list = []

            for nom_projet, semaines in projets_data.items():
                meta = project_meta[nom_entreprise][nom_projet]

                if meta["dates"]:
                    date_debut = min(meta["dates"]).strftime("%d/%m/%Y")
                    date_fin = max(meta["dates"]).strftime("%d/%m/%Y")
                else:
                    date_debut = "N/A"
                    date_fin = "N/A"

                statut_projet = "Clôs" if meta["clos"] else "En cours"

                projets_list.append({
                    "nom_projet": nom_projet,
                    "semaines": dict(sorted(semaines.items())),
                    "statut_projet": statut_projet,
                    "toperat": meta["toperat"],
                    "date_debut": date_debut,
                    "date_fin": date_fin
                })

            statut_entreprise = "Clôs" if projets_list and all(
                p["statut_projet"] == "Clôs" for p in projets_list) else "En cours"

            entreprises.append({
                "nom_entreprise": nom_entreprise,
                "projets": projets_list,
                "statut_entreprise": statut_entreprise
            })

        return {
            "rows": rows,
            "nombre_projets": len(projets_set),
            "actions_retard": actions_retard,
            "actions_non_assign": actions_non_assign,
            "entreprises": entreprises,
            "all_weeks": all_weeks,
            "week_start_dates": week_start_dates
        }

    except mysql.connector.Error as err:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"message": f"Erreur MySQL: {err}"})

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()