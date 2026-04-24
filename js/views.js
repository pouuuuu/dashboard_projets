// ==========================================
// III. GÉNÉRATION DES VUES
// ==========================================

// Génère le HTML des projets et des interventions dans la vue "Projets"
function renderProjets(entreprises, all_weeks, week_start_dates) {
    const container = document.getElementById('entreprises-container');
    let html = '';

    entreprises.forEach((entreprise, indexE) => {
        html += `
        <div class="entreprise" data-status="${entreprise.statut_entreprise}">
            <div class="entreprise-header" onclick="toggleElement('projets-${indexE}', this)">
                <span><span class="toggle-arrow">▶</span> ${entreprise.nom_entreprise}</span>
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

            const project_weeks = Object.keys(projet.semaines);

            project_weeks.forEach(semaine => {
                const parts = semaine.split('-');
                const annee = parts[0];
                const numSemaine = parts[1];

                html += `<div class="calendar-week">Semaine ${numSemaine} - ${annee} <br> ${week_start_dates[semaine]}</div>`;
            });
            html += `</div><div class="calendar-interventions">`;

            project_weeks.forEach(semaine => {
                html += `<div class="calendar-column">`;
                const actions = projet.semaines[semaine];

                actions.forEach(action => {
                    html += `
                        <div class="intervention-block ${action.css_class}">
                            <div class="inter-nature">${action.emoji} ${action.nature}</div>
                            <div class="inter-sujet">${action.sujet || 'Sans sujet'}</div>
                            <div class="inter-tech">${action.technicien || 'Non assigné'}</div>
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

// Génère le tableau dans la vue "Dashboard"
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

// Génère le HTML des projets dans les vues "Actions Non Assignées" et "Actions en Retard"
function renderActionsAlertes(rows) {
    if (!rows || rows.length === 0) return;

    const ulNonAssignees = document.getElementById('list-non-assignees');
    const ulEnRetard = document.getElementById('list-en-retard');

    let htmlNonAssign = '';
    let htmlRetard = '';

    const techniciensEnRetard = new Set()

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    rows.forEach(row => {
        // Actions non assignées
        if (!row.TECHNICIEN || String(row.TECHNICIEN).trim() === '') {
            let dateLimiteStr
            const deadlineStr = row.LIGNE_DE_MORT;
            if (deadlineStr) {
                const d = new Date(deadlineStr);
                dateLimiteStr = d.toLocaleDateString('fr-FR');
            }

            let nature

            if (row.NATURE_INTER.includes("- ")) {
                    nature = row.NATURE_INTER.split("- ")[1]
                } else {
                    nature = row.NATURE_INTER
                }

            htmlNonAssign += `
                <li style="padding: 12px; margin-bottom: 8px; background: #fff3cd; border-left: 4px solid #ff9800; border-radius: 0;">
                    <strong>
                        ${row.NOM ? row.NOM + '<br>' : ''}
                        ${row['NOM PROJET'] ? row['NOM PROJET'] : ''}
                    </strong> 
                    ${row.SUJET_INTER ? "<strong> : </strong>" + row.SUJET_INTER : ''}
                    <br>
                    <small style="color: #666;">
                        ${row.NATURE_INTER ? '<strong>Nature: </strong>' + nature : ''}
                        ${row.NATURE_INTER && dateLimiteStr ? " | " : ""}
                        ${dateLimiteStr ? '<strong>Date limite: </strong>' + dateLimiteStr : ''}
                    </small>
                </li>
            `;
        }

        // Actions en retard
        const termine = row.TERMINE_ORIGINAL || 0;
        const dateAComparer = row.LIGNE_DE_MORT;

        if (dateAComparer && termine === 0) {
            const deadlineDate = new Date(dateAComparer);
            deadlineDate.setHours(0, 0, 0, 0);

            if (deadlineDate < today) {

                let nature
                let techName

                if (row.NATURE_INTER.includes("- ")) {
                    nature = row.NATURE_INTER.split("- ")[1]
                } else {
                    nature = row.NATURE_INTER
                }

                if (row.TECHNICIEN) {
                    techName = row.TECHNICIEN
                    techniciensEnRetard.add(techName)
                } else {
                    techName = "Non assigné"
                }

                htmlRetard += `
                    <li class="retard-item" data-tech="${techName}"style="padding: 12px; margin-bottom: 8px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 0;">
                        <strong>
                            ${row.NOM ? row.NOM + '<br>' : ''}
                            ${row['NOM PROJET'] ? row['NOM PROJET'] + ' : ' : ''}
                        </strong> 
                        ${row.SUJET_INTER || ''}
                        <br>
                        <small style="color: #666;">
                            <strong>Technicien:</strong> ${techName} |
                            ${row.NATURE_INTER ? '<strong>Nature: </strong>' + nature + ' |' : ''}
                            <strong>Date limite:</strong> ${deadlineDate.toLocaleDateString('fr-FR')}
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

    const oldSelect = document.getElementById('filter-retard-tech');
    if (oldSelect) oldSelect.remove();

    if (htmlRetard === '') {
        htmlRetard = '<li style="padding: 12px; color: #4caf50;">Aucune action en retard.</li>';
    } else {
        let selectHtml = `<select id="filter-retard-tech" onchange="filterRetards()" style="margin-bottom: 15px; width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; cursor: pointer;">
            <option value="all">Afficher tous les techniciens</option>`;

        Array.from(techniciensEnRetard).sort().forEach(tech => {
            selectHtml += `<option value="${tech}">${tech}</option>`;
        });
        selectHtml += `</select>`;

        ulEnRetard.insertAdjacentHTML('beforebegin', selectHtml);
    }

    ulNonAssignees.innerHTML = htmlNonAssign;
    ulEnRetard.innerHTML = htmlRetard;
}

function filterRetards() {
    const selectedTech = document.getElementById('filter-retard-tech').value;
    const items = document.querySelectorAll('#list-en-retard .retard-item');

    items.forEach(item => {
        if (selectedTech === 'all' || item.getAttribute('data-tech') === selectedTech) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// ==========================================
// VII. Planning
// ==========================================

// Génère les planning général et technicien
function initCalendars() {
    generateCalendar();
    extractTechniciens();
    generateTechnicienCalendar();
}

// Gestion des dates

function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay() || 7;
    if (day !== 1) date.setHours(-24 * (day - 1));
    date.setHours(0,0,0,0);
    return date;
}

function parseDateFR(dateStr) {
    if (!dateStr || dateStr === 'N/A') return null;
    const parts = dateStr.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function getISOWeekNumber(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Planning général

function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    document.getElementById('currentMonthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    let startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0

    grid.innerHTML += `<div class="calendar-day-header" style="background:#34495e;">Semaine</div>`;
    ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].forEach(d => {
        grid.innerHTML += `<div class="calendar-day-header">${d}</div>`;
    });

    const visibleProjects = new Set();
    let currentGridDate = new Date(firstDay);
    currentGridDate.setDate(currentGridDate.getDate() - startDayOfWeek);

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

// Planning technicien

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
    selectedTechniciens = new Set(techList);

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

    grid.innerHTML += `<div class="calendar-day-header" style="background: #34495e;">Technicien</div>`;
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        grid.innerHTML += `<div class="calendar-day-header">${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}</div>`;
    }

    const techArray = Array.from(selectedTechniciens).sort();
    techArray.forEach(tech => {
        grid.innerHTML += `<div class="calendar-day" style="display:flex;text-align:center;align-items:center;justify-content:center;font-weight:bold;background:#f8f9fa;">${tech}</div>`;

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(currentWeekStart);
            currentDay.setDate(currentDay.getDate() + i);

            const y = currentDay.getFullYear();
            const m = String(currentDay.getMonth() + 1).padStart(2, '0');
            const d = String(currentDay.getDate()).padStart(2, '0');
            const dateString = `${y}-${m}-${d}`;

            let dayHtml = `<div class="calendar-day">`;

            globalProjectsData.forEach(e => {
                e.projets.forEach(p => {
                    Object.values(p.semaines || {}).forEach(actions => {
                        actions.forEach(a => {
                            if (a.technicien === tech && a.date === dateString) {
                                const safeProjectName = p.nom_projet.replace(/'/g, "\\'");
                                dayHtml += `
                                    <div class="intervention-block ${a.css_class}" style="margin:3px;" onclick="openProjectModal('${safeProjectName}')">
                                        <div class="inter-nature">${a.nature}</div>
                                        <div class="inter-sujet">${a.sujet || 'Sans sujet'}</div>
                                        <div class="inter-tech" style="opacity:0.8; font-size:0.9em;">${p.nom_projet}</div>
                                        <div class="inter-entreprise" style="opacity:0.8; font-size:0.9em;">${e.nom_entreprise}</div>
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