const STORAGE_KEY = 'rgpv_btech_roadmap_progress_v3';
const THEME_KEY = 'rgpv_btech_roadmap_theme';

let semChartInstance = null;
let domainChartInstance = null;

// --- THEME SWITCHING ---
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        const themeBtnText = document.getElementById('themeBtnText');
        if (themeBtnText) themeBtnText.textContent = 'Dark Mode';
    } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        const themeBtnText = document.getElementById('themeBtnText');
        if (themeBtnText) themeBtnText.textContent = 'Light Mode';
    }
    localStorage.setItem(THEME_KEY, theme);

    if (document.getElementById('pane-dashboard') && document.getElementById('pane-dashboard').classList.contains('active')) {
        renderDashboardCharts();
    }
}

// --- TAB SWITCHING ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    if (tabId === 'curriculum') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('pane-curriculum').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('pane-dashboard').classList.add('active');
        renderDashboardCharts();
    }
}

// --- FILTERING SEMESTERS ---
function setFilter(filterKey, el) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');

    const blocks = document.querySelectorAll('.semester-block');
    blocks.forEach(block => {
        if (filterKey === 'all') {
            block.style.display = 'block';
        } else if (filterKey === 'pre') {
            block.style.display = block.dataset.sem === 'pre' ? 'block' : 'none';
        } else if (filterKey === 'cc') {
            block.style.display = block.dataset.sem === 'cc' ? 'block' : 'none';
        } else {
            block.style.display = block.dataset.year === filterKey ? 'block' : 'none';
        }
    });
}

// --- SEARCH FUNCTIONALITY ---
function filterSubjects() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('.subject-row');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(query)) {
            row.style.display = 'flex';
        } else {
            row.style.display = 'none';
        }
    });
}

// --- ACCORDION TOGGLE WITH ACTIVE INDICATOR ---
function toggleBlock(headerEl) {
    const block = headerEl.parentElement;
    block.classList.toggle('collapsed');
    block.classList.toggle('expanded');
}

// --- PROGRESS CALCULATION & LOCAL STORAGE ---
function getSavedProgress() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadCheckboxes() {
    const data = getSavedProgress();
    document.querySelectorAll('.check-input').forEach(cb => {
        if (data[cb.dataset.id]) {
            cb.checked = true;
        }
    });
    updateAllProgress();
}

function updateAllProgress() {
    const data = {};
    const groups = ['pre', 'sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6', 'sem7', 'sem8', 'cc'];
    let totalCheckedAll = 0;
    let totalItemsAll = 0;

    groups.forEach(group => {
        const checkboxes = document.querySelectorAll(`[data-group="${group}"] .check-input`);
        let checkedCount = 0;
        checkboxes.forEach(cb => {
            if (cb.checked) {
                data[cb.dataset.id] = true;
                checkedCount++;
            }
        });

        const total = checkboxes.length;
        totalCheckedAll += checkedCount;
        totalItemsAll += total;

        const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
        
        const progressEl = document.getElementById(`progress-${group}`);
        if (progressEl) {
            progressEl.textContent = `${checkedCount}/${total} (${percent}%)`;
        }

        const fillEl = document.getElementById(`progress-fill-${group}`);
        if (fillEl) {
            fillEl.style.width = `${percent}%`;
        }
    });

    saveProgress(data);
    updateDashboardMetrics(totalCheckedAll, totalItemsAll);
}

function updateDashboardMetrics(completedCount, totalCount) {
    const totalPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    const dashPercent = document.getElementById('dashTotalPercent');
    if (dashPercent) dashPercent.textContent = `${totalPercent}%`;

    const dashCompCount = document.getElementById('dashCompletedCount');
    if (dashCompCount) dashCompCount.textContent = completedCount;

    const dashTotCount = document.getElementById('dashTotalCount');
    if (dashTotCount) dashTotCount.textContent = totalCount;

    const dashFill = document.getElementById('dashProgressFill');
    if (dashFill) dashFill.style.width = `${totalPercent}%`;
    
    const dashHours = document.getElementById('dashStudyHours');
    if (dashHours) dashHours.textContent = `${completedCount * 15} hrs`;

    let activePhase = 'Pre-Basics';
    const s1Pct = getGroupPct('sem1');
    const s3Pct = getGroupPct('sem3');
    const s5Pct = getGroupPct('sem5');
    const s7Pct = getGroupPct('sem7');

    if (s7Pct > 0) activePhase = 'Year 4 (Placements)';
    else if (s5Pct > 0) activePhase = 'Year 3 (Specialization)';
    else if (s3Pct > 0) activePhase = 'Year 2 (Core CS)';
    else if (s1Pct > 0) activePhase = 'Year 1 (Foundations)';

    const dashSem = document.getElementById('dashCurrentSem');
    if (dashSem) dashSem.textContent = activePhase;

    const coreChecked = document.querySelectorAll('[data-group="sem3"] .check-input:checked, [data-group="sem4"] .check-input:checked').length;
    const coreTotal = document.querySelectorAll('[data-group="sem3"] .check-input, [data-group="sem4"] .check-input').length;
    const corePct = coreTotal > 0 ? Math.round((coreChecked / coreTotal) * 100) : 0;

    const dashCore = document.getElementById('dashCoreMastery');
    if (dashCore) dashCore.textContent = `${corePct}%`;
}

function getGroupPct(group) {
    const checked = document.querySelectorAll(`[data-group="${group}"] .check-input:checked`).length;
    const total = document.querySelectorAll(`[data-group="${group}"] .check-input`).length;
    return total > 0 ? Math.round((checked / total) * 100) : 0;
}

function resetProgress() {
    if (confirm('Are you sure you want to reset recorded progress?')) {
        localStorage.removeItem(STORAGE_KEY);
        document.querySelectorAll('.check-input').forEach(cb => cb.checked = false);
        updateAllProgress();
        if (document.getElementById('pane-dashboard').classList.contains('active')) {
            renderDashboardCharts();
        }
    }
}

// --- DASHBOARD CHARTS ---
function renderDashboardCharts() {
    const isLight = document.documentElement.classList.contains('light');
    const textColor = isLight ? '#475569' : '#94a3b8';
    const gridColor = isLight ? '#e2e8f0' : '#1e293b';

    const labels = ['Pre', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'Co-Curr'];
    const groups = ['pre', 'sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6', 'sem7', 'sem8', 'cc'];
    const data = groups.map(g => getGroupPct(g));

    const chartCanvas1 = document.getElementById('semProgressChart');
    if (chartCanvas1) {
        const ctx1 = chartCanvas1.getContext('2d');
        if (semChartInstance) semChartInstance.destroy();

        semChartInstance = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Completion %',
                    data: data,
                    backgroundColor: isLight ? '#059669' : '#10b981',
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    const chartCanvas2 = document.getElementById('domainChart');
    if (chartCanvas2) {
        const ctx2 = chartCanvas2.getContext('2d');
        if (domainChartInstance) domainChartInstance.destroy();

        domainChartInstance = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Engineering Prep', 'DSA & Core CS', 'Systems & DB', 'Placements & Projects'],
                datasets: [{
                    data: [
                        getGroupPct('pre') + getGroupPct('sem1') + getGroupPct('sem2'),
                        getGroupPct('sem3') + getGroupPct('sem4'),
                        getGroupPct('sem5') + getGroupPct('sem6'),
                        getGroupPct('sem7') + getGroupPct('sem8') + getGroupPct('cc')
                    ],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, boxWidth: 12, padding: 12 }
                    }
                }
            }
        });
    }
}

// --- KEYBOARD SHORTCUT (CTRL + K FOR SEARCH) ---
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
});

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadCheckboxes();
});
