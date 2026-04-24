// ==========================================
// I. VARIABLES GLOBALES
// ==========================================

let globalProjectsData = []; // Stocke les données des projets de l'API

// Planning général
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Planning technicien
let currentWeekStart = getMonday(new Date());
let selectedTechniciens = new Set();

// Filtres Projets
let currentStatusFilter = 'all';
let currentSearchText = '';


// ==========================================
// II. INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/projets');
        const data = await response.json();

        // Recap Projets/Interventions
        document.getElementById('stat-projets').textContent = data.nombre_projets;
        document.getElementById('stat-retards').textContent = data.actions_retard;
        document.getElementById('stat-non-assignees').textContent = data.actions_non_assign;

        document.getElementById('dash-stat-projets').textContent = data.nombre_projets;
        document.getElementById('dash-stat-retards').textContent = data.actions_retard;
        document.getElementById('dash-stat-non-assignees').textContent = data.actions_non_assign;

        document.getElementById('plan-stat-entreprises').textContent = data.entreprises.length;

        let totalProjets = 0;
        data.entreprises.forEach(e => {
            totalProjets += e.projets.length;
        });
        document.getElementById('plan-stat-projets').textContent = totalProjets;

        globalProjectsData = data.entreprises;

        // 3. Appel de la génération des vues
        renderProjets(data.entreprises, data.all_weeks, data.week_start_dates);
        renderDashboard(data.rows);
        renderActionsAlertes(data.rows);
        initCalendars();

    } catch (error) {
        console.error("Erreur API :", error);
        document.getElementById('entreprises-container').innerHTML =
            "<p style='color: red; text-align: center;'>Impossible de charger les données.</p>";
    }
});