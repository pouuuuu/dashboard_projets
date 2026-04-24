// ==========================================
// IV. NAVIGATION & SIDEBAR
// ==========================================

// Changement de vue
function showPage(pageId) {

    window.scrollTo(0,0)

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

// Ouvre/Ferme le menu "Planning"
function handlePlanningClick() {
    const sidebar = document.getElementById('sidebar');
    const parent = document.getElementById('planningParent');

    // Si la sidebar est réduite, on redirige directement vers "Planning général"
    if (sidebar.classList.contains('collapsed')) {
        showPlanningView('general');
    } else {
        parent.classList.toggle('open');
    }
}

// Change la vue interne du Planning (Général vs Technicien)
function showPlanningView(view) {
    document.getElementById('planningGeneralView').style.display = (view === 'general') ? 'block' : 'none';
    document.getElementById('planningTechnicienView').style.display = (view === 'technicien') ? 'block' : 'none';
    showPage('planningPage');
}

// Ouvre/Ferme la sidebar
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


// ==========================================
// V. Vue Projets et Interventions
// ==========================================

// Déroule/Replie une entreprise ou un projet
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

// Boutons Tout Dérouler/Replier
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

// Filtres par recherche et boutons
function applyFilters() {
    document.querySelectorAll('.entreprise').forEach(entreprise => {
        let hasVisibleProjet = false;

        entreprise.querySelectorAll('.projet').forEach(p => {
            const statusRaw = p.querySelector('.projet-header small').textContent;
            const status = statusRaw.replace('[', '').replace(']', '').trim().toLowerCase();
            const interventionsCount = p.querySelectorAll('.intervention-block').length;
            const projetName = p.querySelector('.projet-header span').textContent.toLowerCase();

            // Vérification statut
            let matchesStatus;
            if (currentStatusFilter === 'non planifie') {
                matchesStatus = interventionsCount === 0;
            } else if (currentStatusFilter === 'all') {
                matchesStatus = true;
            } else {
                matchesStatus = (status === currentStatusFilter.toLowerCase());
            }

            // Vérification texte
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

// Listener sur les boutons et la barre de recherche
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


// ==========================================
// VI. Dashboard
// ==========================================

// Affiche/Cache la barre de recherche sur le champs NOM, NOM PROJET et TECHNICIEN
function toggleSearch(iconElement) {
    const input = iconElement.nextElementSibling;
    if (input.style.display === 'none') {
        input.style.display = 'block';
        input.focus();
    } else {
        input.style.display = 'none';
    }
}

// Filtre des lignes du tableau dans la vue "Dashboard"
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


// ==========================================
// VIII. Popup
// ==========================================

// Ouvre le popup et affiche les infos du projet cliqué
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
            const numSemaine = semaineKey.includes(' - ') ? semaineKey.split(' - ')[1] : semaineKey;

            actions.forEach(action => {
                totalInterventions++;
                let statutClean = action.css_class.replace('statut-', '').replace(/-/g, ' ');

                let dateDisplay = 'N/A';
                if (action.date) {
                    const parts = action.date.split('-');
                    dateDisplay = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }

                interventionsHtml += `
                    <div class="modal-intervention-item">
                        <div class="modal-intervention-header">
                            ${action.nature} ${action.numeror ? '(#' + action.numeror + ')' : ''}
                        </div>
                        <div class="modal-intervention-details">
                            <strong>👤 Technicien :</strong> ${action.technicien || 'Non assigné'}<br>
                            <strong>📅 Date :</strong> ${dateDisplay} (Semaine ${numSemaine})<br>
                            <strong>📝 Sujet :</strong> ${action.sujet || 'Non renseigné'}<br>
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

// Ferme le popup
function closeProjectModal(event) {
    const modal = document.getElementById('projectModal');
    if (!event || event.target === modal) {
        modal.classList.remove('active');
    }
}


// ==========================================
// IX. Boutons secrets
// ==========================================

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

window.addEventListener('scroll', () => {
    const btn = document.getElementById('btn-back-to-top');
    if (window.scrollY > 300) {
        btn.classList.add('show');
    } else {
        btn.classList.remove('show');
    }
});