document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/projets');
        const data = await response.json();

        // Projets
        document.getElementById('stat-projets').textContent = data.nombre_projets;
        document.getElementById('stat-retards').textContent = data.actions_retard;
        document.getElementById('stat-non-assignees').textContent = data.actions_non_assign;

        // Dashboard
        document.getElementById('dash-stat-projets').textContent = data.nombre_projets;
        document.getElementById('dash-stat-retards').textContent = data.actions_retard;
        document.getElementById('dash-stat-non-assignees').textContent = data.actions_non_assign;

        // Planning
        document.getElementById('plan-stat-entreprises').textContent = data.entreprises.length;

        renderProjets(data.entreprises, data.all_weeks, data.week_start_dates);
        renderDashboard(data.rows);
        renderActionsAlertes(data.rows);

        let totalProjets = 0;

        data.entreprises.forEach(e => {
            totalProjets += e.projets.length;
        });
        document.getElementById('plan-stat-projets').textContent = totalProjets;

        globalProjectsData = data.entreprises;
        initCalendars();

    } catch (error) {
        console.error("Erreur API :", error);
        document.getElementById('entreprises-container').innerHTML = 
            "<p style='color: red; text-align: center;'>Impossible de charger les données.</p>";
    }
});

function renderProjets(entreprises, all_weeks, week_start_dates) {
    const container = document.getElementById('entreprises-container');
    let html = '';

    entreprises.forEach((entreprise, indexE) => {
        html += `
        <div class="entreprise" data-status="${entreprise.statut_entreprise}">
            <div class="entreprise-header" onclick="toggleElement('projets-${indexE}', this)">
                <span><span class="toggle-arrow">▶</span> ${entreprise.nom_entreprise} <small>[${entreprise.statut_entreprise}]</small></span>
            </div>
            <div class="projets-list" id="projets-${indexE}" style="display: none">
        `;

        entreprise.projets.forEach((projet, indexP) => {
            let headerColor = '#4b9ce2';
            if (projet.toperat === 'INFRA') headerColor = '#1872A0';
            if (projet.toperat === 'LOGICIEL') headerColor = '#8F536F';

            html += `
                <div class="projet">
                    <div class="projet-header" style="background-color: ${headerColor};" onclick="toggleElement('interventions-${indexE}-${indexP}', this)">
                        <span><span class="toggle-arrow">▶</span> ${projet.nom_projet} <small>[${projet.statut_projet}]</small></span>
                        <span class="projet-dates">${projet.date_debut} – ${projet.date_fin}</span>
                    </div>
                    <div class="interventions" id="interventions-${indexE}-${indexP}" style="display: none">
                        <div class="calendar-weeks">
            `;

            all_weeks.forEach(semaine => {
                html += `<div class="calendar-week">Semaine ${semaine} – ${week_start_dates[semaine]}</div>`;
            });
            html += `</div><div class="calendar-interventions">`;

            all_weeks.forEach(semaine => {
                html += `<div class="calendar-column">`;
                const actions = projet.semaines[semaine] || [];
                
                actions.forEach(action => {
                    html += `
                        <div class="intervention-block ${action.css_class}" title="Sujet: ${action.sujet || 'Non renseigné'}">
                            ${action.emoji} ${action.nature} <br>
                            ${action.technicien || 'Non assigné'}
                        </div>
                    `;
                });

                if (actions.length === 0) {
                    html += `<div style="opacity:0.3; text-align:center;">-</div>`;
                }
                html += `</div>`;
            });

            html += `</div></div></div>`;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
}

function renderDashboard(rows) {
    if (!rows || rows.length === 0) return;

    const thead = document.getElementById('dashboard-thead');
    const tbody = document.getElementById('dashboard-tbody');

    const visibleColumns = Object.keys(rows[0]).filter(col => !['INT_TERMINE', 'STATUT_CLEAN', 'TERMINE_ORIGINAL'].includes(col));

    let theadHTML = '<tr>';
    visibleColumns.forEach((col, index) => {
        let searchIcon = '';
        if (['NOM PROJET', 'NOM', 'TECHNICIEN'].includes(col)) {
            searchIcon = `
                <span class="search-icon" style="cursor:pointer; margin-left: 5px;" onclick="toggleSearch(this)">🔍</span>
                <input type="text" class="search-input dashboard-filter" data-col-index="${index}" placeholder="Rechercher..." 
                       style="display:none; width: 100%; padding:4px; margin-top: 6px; font-size: 0.9em;" oninput="filterDashboard()">
            `;
        }
        theadHTML += `<th>${col} ${searchIcon}</th>`;
    });
    theadHTML += '</tr>';
    thead.innerHTML = theadHTML;

    let tbodyHTML = '';
    rows.forEach(row => {
        tbodyHTML += '<tr>';
        visibleColumns.forEach(col => {
            const value = row[col] !== null && row[col] !== undefined ? row[col] : '';
            tbodyHTML += `<td>${value}</td>`;
        });
        tbodyHTML += '</tr>';
    });
    tbody.innerHTML = tbodyHTML;
}

function filterDashboard() {
    const inputs = document.querySelectorAll('.dashboard-filter');
    const activeFilters = [];

    inputs.forEach(input => {
        const searchText = input.value.trim().toLowerCase();
        if (searchText !== '') {
            activeFilters.push({
                index: parseInt(input.getAttribute('data-col-index')),
                text: searchText
            });
        }
    });

    const rows = document.querySelectorAll('#dashboard-tbody tr');

    rows.forEach(row => {
        let showRow = true;

        activeFilters.forEach(filter => {
            const cell = row.cells[filter.index];
            if (cell) {
                const cellText = cell.textContent.toLowerCase();
                if (!cellText.includes(filter.text)) {
                    showRow = false;
                }
            }
        });

        row.style.display = showRow ? '' : 'none';
    });
}

// ===========================
// HELPERS
// ===========================

// Dérouler/replier un projet

function toggleElement(id, headerElement) {
    const elem = document.getElementById(id);
    const arrow = headerElement.querySelector('.toggle-arrow');
    
    if (elem.style.display === 'none') {
        elem.style.display = 'block';
        if (arrow) arrow.innerHTML = '▼';
    } else {
        elem.style.display = 'none';
        if (arrow) arrow.innerHTML = '▶';
    }
}

// Changement de vue

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const sidebarItem = document.querySelector(`.nav-item[onclick*="${pageId}"]`);
    if (sidebarItem) {
        sidebarItem.classList.add('active');
    } else if (event && event.currentTarget && event.currentTarget.classList.contains('nav-item')) {
        event.currentTarget.classList.add('active');
    }

    document.querySelectorAll('.nav-subitem').forEach(item => item.classList.remove('active'));
}

// Bouton recherche dashboard

function toggleSearch(iconElement) {
    const input = iconElement.nextElementSibling;
    if (input.style.display === 'none') {
        input.style.display = 'block';
        input.focus();
    } else {
        input.style.display = 'none';
    }
}

// Boutons tout dérouler/replier

function toggleAllProjets(expand) {
    const allProjetsLists = document.querySelectorAll('.projets-list');
    const allInterventions = document.querySelectorAll('.interventions');

    const entrepriseHeaders = document.querySelectorAll('.entreprise-header .toggle-arrow');

    const projetHeaders = document.querySelectorAll('.projet-header .toggle-arrow');

    if (expand) {
        allProjetsLists.forEach(list => list.style.display = 'block');
        allInterventions.forEach(intervention => intervention.style.display = 'block');
        entrepriseHeaders.forEach(arrow => arrow.innerHTML = '▼');
        projetHeaders.forEach(arrow => arrow.innerHTML = '▼');
    } else {
        allProjetsLists.forEach(list => list.style.display = 'none');
        allInterventions.forEach(intervention => intervention.style.display = 'none');
        entrepriseHeaders.forEach(arrow => arrow.innerHTML = '▶');
        projetHeaders.forEach(arrow => arrow.innerHTML = '▶');
    }
}

//Recherche et boutons filtres projets

let currentStatusFilter = 'all';
let currentSearchText = '';

function applyFilters() {
    document.querySelectorAll('.entreprise').forEach(entreprise => {
        let hasVisibleProjet = false;

        entreprise.querySelectorAll('.projet').forEach(p => {
            const statusRaw = p.querySelector('.projet-header small').textContent;
            const status = statusRaw.replace('[', '').replace(']', '').trim().toLowerCase();

            const interventionsCount = p.querySelectorAll('.intervention-block').length;

            const projetName = p.querySelector('.projet-header span').textContent.toLowerCase();

            let matchesStatus;
            if (currentStatusFilter === 'non planifie') {
                matchesStatus = interventionsCount === 0;
            } else if (currentStatusFilter === 'all') {
                matchesStatus = true;
            } else {
                matchesStatus = (status === currentStatusFilter.toLowerCase());
            }

            const entrepriseName = entreprise.querySelector('.entreprise-header span').textContent.toLowerCase();
            const matchesSearch = currentSearchText === '' ||
                                 projetName.includes(currentSearchText.toLowerCase()) ||
                                 entrepriseName.includes(currentSearchText.toLowerCase());

            if(matchesStatus && matchesSearch) {
                p.style.display = 'block';
                hasVisibleProjet = true;
            } else {
                p.style.display = 'none';
            }
        });

        if(hasVisibleProjet) {
            entreprise.style.display = 'block';
        } else {
            entreprise.style.display = 'none';
        }
    });
}

// jsp

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentStatusFilter = btn.getAttribute('data-filter');
        applyFilters();
    });
});

document.getElementById('search-projet').addEventListener('input', function(e) {
    currentSearchText = e.target.value;
    applyFilters();
});

// Gestion affichage des plannings

function showPlanningView(view) {
    document.getElementById('planningGeneralView').style.display = (view === 'general') ? 'block' : 'none';
    document.getElementById('planningTechnicienView').style.display = (view === 'technicien') ? 'block' : 'none';
    showPage('planningPage');
}

// Sous menu planning

function handlePlanningClick() {
    const sidebar = document.getElementById('sidebar');
    const parent = document.getElementById('planningParent');

    if (sidebar.classList.contains('collapsed')) {
        showPlanningView('general');
    }
    else {
        parent.classList.toggle('open');
    }
}

// ===========================
// GESTION DES PLANNINGS
// ===========================

let globalProjectsData = [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

let currentWeekStart = getMonday(new Date());
let selectedTechniciens = new Set();

// Initialisation globale
function initCalendars() {
    generateCalendar();
    extractTechniciens();
    generateTechnicienCalendar();
}

// Outil : Trouver le lundi de la semaine en cours
function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay() || 7;
    if (day !== 1) date.setHours(-24 * (day - 1));
    date.setHours(0,0,0,0);
    return date;
}

// Outil : Convertir "DD/MM/YYYY" en objet Date
function parseDateFR(dateStr) {
    if (!dateStr || dateStr === 'N/A') return null;
    const parts = dateStr.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

// Outil : Calculer le numéro de semaine ISO
function getISOWeekNumber(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}


// --- 1. PLANNING GÉNÉRAL (MOIS) ---

function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    document.getElementById('currentMonthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    let startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0

    // En-têtes (8 colonnes : Semaine + 7 Jours)
    grid.innerHTML += `<div class="calendar-day-header" style="background:#34495e;">Semaine</div>`;
    ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].forEach(d => {
        grid.innerHTML += `<div class="calendar-day-header">${d}</div>`;
    });

    const visibleProjects = new Set();
    let currentGridDate = new Date(firstDay);
    currentGridDate.setDate(currentGridDate.getDate() - startDayOfWeek);

    // On affiche généralement 5 ou 6 semaines pour couvrir le mois
    for (let row = 0; row < 6; row++) {
        const weekNum = getISOWeekNumber(currentGridDate);
        grid.innerHTML += `<div class="calendar-week-number">S${weekNum}</div>`;

        for (let col = 0; col < 7; col++) {
            const isCurrentMonth = currentGridDate.getMonth() === currentMonth;
            const isToday = currentGridDate.toDateString() === new Date().toDateString();

            let classes = 'calendar-day';
            if (!isCurrentMonth) classes += ' other-month';
            if (isToday) classes += ' today';

            let dayHtml = `<div class="${classes}">
                <div class="calendar-day-number">${currentGridDate.getDate()}</div>
            `;

            // Vérifier quels projets sont en cours à cette date
            globalProjectsData.forEach(e => {
                e.projets.forEach(p => {
                    const start = parseDateFR(p.date_debut);
                    const end = parseDateFR(p.date_fin);

                    if (start && end) {
                        const d = new Date(currentGridDate.getFullYear(), currentGridDate.getMonth(), currentGridDate.getDate());
                        const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                        const ed = new Date(end.getFullYear(), end.getMonth(), end.getDate());

                        if (d >= s && d <= ed) {
                            visibleProjects.add(p.nom_projet);
                            let typeClass = '';
                            if (p.toperat === 'INFRA') typeClass = 'infra';
                            if (p.toperat === 'LOGICIEL') typeClass = 'logiciel';

                            const safeProjectName = p.nom_projet.replace(/'/g, "\\'");

                            dayHtml += `<div class="calendar-project-bar ${typeClass}" style="cursor:pointer;" title="${e.nom_entreprise} - ${p.nom_projet}" onclick="openProjectModal('${safeProjectName}')">
                                ${p.nom_projet}
                            </div>`;
                        }
                    }
                });
            });

            dayHtml += `</div>`;
            grid.innerHTML += dayHtml;
            currentGridDate.setDate(currentGridDate.getDate() + 1);
        }
        if (currentGridDate.getMonth() !== currentMonth && row >= 4) break;
    }

    document.getElementById('planning-visible-projects').textContent = visibleProjects.size.toString();
}

function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    generateCalendar();
}


// --- 2. PLANNING TECHNICIEN (SEMAINE) ---

function extractTechniciens() {
    const techSet = new Set();
    globalProjectsData.forEach(e => {
        e.projets.forEach(p => {
            Object.values(p.semaines || {}).forEach(actions => {
                actions.forEach(a => {
                    if (a.technicien && a.technicien.trim() !== '') {
                        techSet.add(a.technicien.trim());
                    }
                });
            });
        });
    });

    const techList = Array.from(techSet).sort();
    selectedTechniciens = new Set(techList); // Tout coché par défaut

    const container = document.getElementById('technicienCheckboxes');
    container.innerHTML = '';
    techList.forEach(tech => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '5px';
        label.innerHTML = `<input type="checkbox" value="${tech}" checked onchange="updateTechSelection(this)"> ${tech}`;
        container.appendChild(label);
    });
}

function updateTechSelection(checkbox) {
    if (checkbox.checked) selectedTechniciens.add(checkbox.value);
    else selectedTechniciens.delete(checkbox.value);
    generateTechnicienCalendar();
}

function toggleAllTechniciens(check) {
    const checkboxes = document.querySelectorAll('#technicienCheckboxes input');
    checkboxes.forEach(cb => {
        cb.checked = check;
        if (check) selectedTechniciens.add(cb.value);
        else selectedTechniciens.delete(cb.value);
    });
    generateTechnicienCalendar();
}

function generateTechnicienCalendar() {
    const grid = document.getElementById('calendarTechnicienGrid');
    grid.innerHTML = '';

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    document.getElementById('currentWeekDisplay').textContent =
        `Semaine du ${currentWeekStart.toLocaleDateString('fr-FR')} au ${weekEnd.toLocaleDateString('fr-FR')}`;

    // En-têtes
    grid.innerHTML += `<div class="calendar-day-header" style="background: #34495e;">Technicien</div>`;
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        grid.innerHTML += `<div class="calendar-day-header">${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}</div>`;
    }

    // Lignes pour chaque technicien sélectionné
    const techArray = Array.from(selectedTechniciens).sort();
    techArray.forEach(tech => {
        // Colonne 1 : Nom
        grid.innerHTML += `<div class="calendar-day" style="display:flex;text-align:center;align-items:center;justify-content:center;font-weight:bold;background:#f8f9fa;">${tech}</div>`;

        // Colonnes 2 à 8 : Jours
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(currentWeekStart);
            currentDay.setDate(currentDay.getDate() + i);

            // Format YYYY-MM-DD pour comparer avec l'API
            const y = currentDay.getFullYear();
            const m = String(currentDay.getMonth() + 1).padStart(2, '0');
            const d = String(currentDay.getDate()).padStart(2, '0');
            const dateString = `${y}-${m}-${d}`;

            let dayHtml = `<div class="calendar-day">`;

            // Chercher les interventions du technicien à cette date
            globalProjectsData.forEach(e => {
                e.projets.forEach(p => {
                    Object.values(p.semaines || {}).forEach(actions => {
                        actions.forEach(a => {
                            if (a.technicien === tech && a.date === dateString) {
                                const safeProjectName = p.nom_projet.replace(/'/g, "\\'");
                                dayHtml += `
                                    <div class="intervention-block ${a.css_class}" style="margin:3px;" title="${p.nom_projet}" onclick="openProjectModal('${safeProjectName}')">
                                        ${a.emoji} ${a.nature}<br><small style="opacity:0.8;">${p.nom_projet}</small>
                                    </div>
                                `;
                            }
                        });
                    });
                });
            });
            dayHtml += `</div>`;
            grid.innerHTML += dayHtml;
        }
    });
}

function changeWeek(offset) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (offset * 7));
    generateTechnicienCalendar();
}

function openProjectModal(projectName) {
    let foundProject = null;
    let foundEntreprise = null;

    for (const e of globalProjectsData) {
        for (const p of e.projets) {
            if (p.nom_projet === projectName) {
                foundProject = p;
                foundEntreprise = e.nom_entreprise;
                break;
            }
        }
        if (foundProject) break;
    }

    if (!foundProject) return;

    const modal = document.getElementById('projectModal');
    const modalTitle = document.getElementById('modalProjectName');
    const modalDetails = document.getElementById('modalProjectDetails');

    modalTitle.textContent = foundProject.nom_projet;

    let badgeClass = 'badge-autre';
    if (foundProject.toperat === 'INFRA') badgeClass = 'badge-infra';
    if (foundProject.toperat === 'LOGICIEL') badgeClass = 'badge-logiciel';

    let html = `
        <div class="modal-info-row">
            <div class="modal-info-label">Entreprise :</div>
            <div class="modal-info-value">${foundEntreprise}</div>
        </div>
        <div class="modal-info-row">
            <div class="modal-info-label">Type :</div>
            <div class="modal-info-value">
                <span class="modal-badge ${badgeClass}">${foundProject.toperat || 'N/A'}</span>
            </div>
        </div>
        <div class="modal-info-row">
            <div class="modal-info-label">Statut :</div>
            <div class="modal-info-value">${foundProject.statut_projet}</div>
        </div>
        <div class="modal-info-row">
            <div class="modal-info-label">Période :</div>
            <div class="modal-info-value">${foundProject.date_debut} → ${foundProject.date_fin}</div>
        </div>
    `;

    let totalInterventions = 0;
    let interventionsHtml = '';

    if (foundProject.semaines) {
        for (const [semaineKey, actions] of Object.entries(foundProject.semaines)) {
            actions.forEach(action => {
                totalInterventions++;
                let statutClean = action.css_class.replace('statut-', '').replace(/-/g, ' ');

                interventionsHtml += `
                    <div class="modal-intervention-item">
                        <div class="modal-intervention-header">
                            ${action.emoji} ${action.nature} ${action.numeror ? '(#' + action.numeror + ')' : ''}
                        </div>
                        <div class="modal-intervention-details">
                            <strong>👤 Technicien :</strong> ${action.technicien || 'Non assigné'}<br>
                            <strong>📅 Semaine :</strong> ${semaineKey} (Date: ${action.date || 'N/A'})<br>
                            <strong>📊 Statut :</strong> <span class="modal-badge ${action.css_class}">${statutClean.toUpperCase()}</span>
                        </div>
                    </div>
                `;
            });
        }
    }

    if (totalInterventions > 0) {
        html += `<div class="modal-interventions-title">📋 Interventions (${totalInterventions})</div>` + interventionsHtml;
    } else {
        html += '<div class="modal-interventions-title">Aucune intervention</div>';
    }

    modalDetails.innerHTML = html;
    modal.classList.add('active');
}

function closeProjectModal(event) {
    const modal = document.getElementById('projectModal');
    if (!event || event.target === modal) {
        modal.classList.remove('active');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const arrowIcon = document.getElementById('arrowIcon');

    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        hamburgerIcon.style.display = 'none';
        arrowIcon.style.display = 'block';
    } else {
        hamburgerIcon.style.display = 'flex';
        arrowIcon.style.display = 'none';
    }
}

function renderActionsAlertes(rows) {
    if (!rows || rows.length === 0) return;

    const ulNonAssignees = document.getElementById('list-non-assignees');
    const ulEnRetard = document.getElementById('list-en-retard');

    let htmlNonAssign = '';
    let htmlRetard = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    rows.forEach(row => {
        // Actions non assignées
        if (!row.TECHNICIEN || String(row.TECHNICIEN).trim() === '') {

            let dateLimiteStr = 'Non définie';
            const deadlineStr = row.LIGNE_DE_MORT || row.DATE;
            if (deadlineStr) {
                const d = new Date(deadlineStr);
                dateLimiteStr = d.toLocaleDateString('fr-FR');
            }

            htmlNonAssign += `
                <li style="padding: 12px; margin-bottom: 8px; background: #fff3cd; border-left: 4px solid #ff9800; border-radius: 0;">
                    <strong>${row.NATURE_INTER || 'Non renseigné'}</strong> (Projet: ${row['NOM PROJET'] || ''})
                    <br>
                    <small style="color: #666;">
                        <strong>Entreprise:</strong> ${row.NOM || ''} |
                        <strong>Technicien:</strong> Non assigné |
                        <strong>Date limite:</strong> ${dateLimiteStr} |
                        <strong>Sujet:</strong> ${row.SUJET_INTER || 'Non renseigné'}
                    </small>
                </li>
            `;
        }

        // Actions en retard
        const termine = row.TERMINE_ORIGINAL || 0;
        const dateAComparer = row.LIGNE_DE_MORT || row.DATE;

        if (dateAComparer && termine === 0) {
            const deadlineDate = new Date(dateAComparer);
            deadlineDate.setHours(0, 0, 0, 0);

            if (deadlineDate < today) {
                htmlRetard += `
                    <li style="padding: 12px; margin-bottom: 8px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 0;">
                        <strong>${row.NATURE_INTER || 'Non renseigné'}</strong> (Projet: ${row['NOM PROJET'] || ''})
                        <br>
                        <small style="color: #666;">
                            <strong>Entreprise:</strong> ${row.NOM || ''} |
                            <strong>Technicien:</strong> ${row.TECHNICIEN || 'Non assigné'} |
                            <strong>Date limite:</strong> ${deadlineDate.toLocaleDateString('fr-FR')} |
                            <strong>Sujet:</strong> ${row.SUJET_INTER || 'Non renseigné'}
                        </small>
                    </li>
                `;
            }
        }
    });

    if (htmlNonAssign === '') {
        htmlNonAssign = '<li style="padding: 12px; color: #4caf50;">Toutes les actions sont assignées à un technicien.</li>';
    }
    if (htmlRetard === '') {
        htmlRetard = '<li style="padding: 12px; color: #4caf50;">Aucune action en retard.</li>';
    }

    ulNonAssignees.innerHTML = htmlNonAssign;
    ulEnRetard.innerHTML = htmlRetard;
}

// =====================
// Boutons secrets
// =====================

document.getElementById('secret-btn').addEventListener('click', toggleSecret);
function toggleSecret() {
    const sc = document.getElementById('secret-content');
    const secondSecret = document.getElementById('second-secret');
    if (sc.style.display === 'block') {
        sc.style.display = 'none';
        secondSecret.style.display = 'none';
    } else {
        sc.style.display = 'block';
        secondSecret.style.display = 'none';
    }
}

function openSecondSecret() {
    const firstSecret = document.getElementById('secret-content');
    const secondSecret = document.getElementById('second-secret');
    firstSecret.style.display = 'none';
    secondSecret.style.display = 'block';
}

function closeSecondSecret() {
    const secondSecret = document.getElementById('second-secret');
    secondSecret.style.display = 'none';
}