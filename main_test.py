from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from datetime import date, datetime
from collections import defaultdict
import unicodedata
import json

app = FastAPI()

# Configuration de tes dossiers plats
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/public/images", StaticFiles(directory="public/images"), name="images")

@app.get("/")
def serve_dashboard():
    return FileResponse("index.html")

def clean_statut(statut):
    if not statut: return "a faire"
    if isinstance(statut, bytes): statut = statut.decode("utf-8", errors="ignore")
    s = statut.replace("\r", "").replace("\n", "").strip().lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    if "-" in s: s = s.split("-", 1)[1].strip()
    
    if "faire" in s or "realiser" in s: return "a faire"
    elif "cours" in s: return "en cours"
    elif "finalisation" in s: return "finalisation"
    elif "termine" in s or "✔" in s: return "termine"
    return "a faire"

@app.get("/api/projets")
def get_projets_data(filter: str = None):
    with open("test_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        rows = data["interventions"]
        projets_sans_interventions = data.get("projets", [])

    projets_set = set()
    actions_retard = 0
    actions_non_assign = 0
    filtered_rows = []
    entreprises_dict = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    for row in rows:
        nom_entreprise = row.get("NOM", "").strip()
        nom_projet = row.get("NOM PROJET", "").strip()
        if nom_entreprise: projets_set.add(nom_entreprise)

        date_str = row.get("DATE")
        date_action = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else None
        termine = row.get("TERMINE", 0)
        statut = clean_statut(row.get("STATUT"))
        row["STATUT_CLEAN"] = statut

        if date_action and date_action < date.today() and termine == 0: actions_retard += 1
        if not row.get("TECHNICIEN"): actions_non_assign += 1

        row["TERMINE_ORIGINAL"] = termine
        row["TERMINE"] = "✔️" if termine == 1 else ""

        if filter == "retard" and date_action and date_action < date.today() and termine == 0:
            filtered_rows.append(row)
        elif filter == "non_assign" and not row.get("TECHNICIEN"):
            filtered_rows.append(row)
        elif filter == "projets" or filter is None:
            filtered_rows.append(row)

        if date_action:
            annee = date_action.year
            semaine = f"{annee}-{date_action.isocalendar()[1]}"
            
            if statut == "a faire": css_class, emoji = "statut-a-faire", "⚠️"
            elif statut == "en cours": css_class, emoji = "statut-en-cours", "🔧"
            elif statut == "finalisation": css_class, emoji = "statut-finalisation", "🧪"
            elif statut == "termine": css_class, emoji = "statut-termine", "✅"
            else: css_class, emoji = "statut-inconnu", "❓"

            entreprises_dict[nom_entreprise][nom_projet][semaine].append({
                "numeror": row.get("NUMEROR", ""),
                "nature": row.get("NATURE_INTER", ""),
                "technicien": row.get("TECHNICIEN", ""),
                "css_class": css_class,
                "emoji": emoji,
                "avancement": row.get("AVANCEMENT", ""),
                "etat_projet": row.get("INT_TERMINE", ""),
                "toperat": row.get("TOPERAT", ""),
                "date": date_str
            })

    for projet_vide in projets_sans_interventions:
        nom_entreprise = projet_vide.get("NOM", "").strip()
        nom_projet = projet_vide.get("NOM_PROJET", "").strip()
        if nom_entreprise and nom_projet and nom_projet not in entreprises_dict[nom_entreprise]:
            entreprises_dict[nom_entreprise][nom_projet] = {}

    all_weeks = sorted({s for p in entreprises_dict.values() for sem in p.values() for s in sem})
    week_start_dates = {}
    for semaine in all_weeks:
        y, w = map(int, semaine.split("-"))
        week_start_dates[semaine] = datetime.fromisocalendar(y, w, 1).strftime("%d/%m/%Y")

    entreprises = []
    for nom_entreprise, projets_data in entreprises_dict.items():
        projets_list = []
        for nom_projet, semaines in projets_data.items():
            etat_action = "En cours"
            toperat_projet = "N/A"
            dates_interventions = []

            projet_meta = next((p for p in projets_sans_interventions if p.get("NOM", "").strip() == nom_entreprise and p.get("NOM_PROJET", "").strip() == nom_projet), None)
            if projet_meta:
                etat_action = projet_meta.get("STATUT", "En cours")
                if projet_meta.get("TOPERAT", "").strip(): toperat_projet = projet_meta["TOPERAT"]
                date_debut = datetime.strptime(projet_meta["DATE_DEBUT"], "%Y-%m-%d").strftime("%d/%m/%Y") if projet_meta.get("DATE_DEBUT") else "N/A"
                date_fin = datetime.strptime(projet_meta["DATE_FIN"], "%Y-%m-%d").strftime("%d/%m/%Y") if projet_meta.get("DATE_FIN") else "N/A"
            else:
                for semaine_actions in semaines.values():
                    for action in semaine_actions:
                        if action.get("etat_projet") == True: etat_action = "Clôs"
                        if action.get("toperat", "").strip(): toperat_projet = action["toperat"]

                for row in rows:
                    if row.get("NOM", "").strip() == nom_entreprise and row.get("NOM PROJET", "").strip() == nom_projet:
                        if row.get("DATE"): dates_interventions.append(datetime.strptime(row["DATE"], "%Y-%m-%d").date())
                
                date_debut = min(dates_interventions).strftime("%d/%m/%Y") if dates_interventions else "N/A"
                date_fin = max(dates_interventions).strftime("%d/%m/%Y") if dates_interventions else "N/A"

            projets_list.append({
                "nom_projet": nom_projet,
                "semaines": dict(sorted(semaines.items())),
                "statut_projet": etat_action,
                "toperat": toperat_projet,
                "date_debut": date_debut,
                "date_fin": date_fin
            })

        statut_entreprise = "Clôs" if projets_list and all(p["statut_projet"] == "Clôs" for p in projets_list) else "En cours"
        entreprises.append({
            "nom_entreprise": nom_entreprise,
            "projets": projets_list,
            "statut_entreprise": statut_entreprise
        })

    return {
        "rows": filtered_rows,
        "nombre_projets": len(projets_set),
        "actions_retard": actions_retard,
        "actions_non_assign": actions_non_assign,
        "entreprises": entreprises,
        "all_weeks": all_weeks,
        "week_start_dates": week_start_dates,
        "today": date.today().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)