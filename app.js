const STORAGE_KEY = 'rgpv_btech_roadmap_progress_v3';
const THEME_KEY = 'rgpv_btech_roadmap_theme';
const PROFILE_KEY = 'rgpv_student_profile';
const PLAN_KEY = 'rgpv_daily_plan';
const STREAK_KEY = 'rgpv_study_streak';
const EXAM_DATE_KEY = 'rgpv_exam_date';

let semChartInstance = null;
let domainChartInstance = null;

// ============================================================
// SEMESTER ORDERING — used by onboarding, focus, and stage logic
// ============================================================
const SEMESTER_ORDER = ['pre', 'sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6', 'sem7', 'sem8', 'cc'];

const SEMESTER_LABELS = {
    pre: 'Pre-BTech Basics',
    sem1: 'Year 1 → Semester 1',
    sem2: 'Year 1 → Semester 2',
    sem3: 'Year 2 → Semester 3',
    sem4: 'Year 2 → Semester 4',
    sem5: 'Year 3 → Semester 5',
    sem6: 'Year 3 → Semester 6',
    sem7: 'Year 4 → Semester 7',
    sem8: 'Year 4 → Semester 8',
    cc: 'Co-Curricular Tracks'
};

// ============================================================
// THEME SWITCHING (preserved from original)
// ============================================================
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

// ============================================================
// TAB SWITCHING (preserved from original)
// ============================================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    const tabMap = {
        curriculum: { btnIdx: 0, paneId: 'pane-curriculum' },
        myplan:     { btnIdx: 1, paneId: 'pane-myplan' },
        exam:       { btnIdx: 2, paneId: 'pane-exam' },
        dashboard:  { btnIdx: 3, paneId: 'pane-dashboard' },
    };

    const tab = tabMap[tabId] || tabMap.curriculum;
    const btns = document.querySelectorAll('.tab-btn');
    if (btns[tab.btnIdx]) btns[tab.btnIdx].classList.add('active');
    const pane = document.getElementById(tab.paneId);
    if (pane) pane.classList.add('active');

    if (tabId === 'dashboard') renderDashboardCharts();
    if (tabId === 'myplan') renderMyPlan();
    if (tabId === 'exam') renderExamMode();
}

// ============================================================
// FILTERING SEMESTERS (preserved from original)
// ============================================================
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

// ============================================================
// SEARCH FUNCTIONALITY (preserved from original)
// ============================================================
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

// ============================================================
// ACCORDION TOGGLE (preserved from original)
// ============================================================
function toggleBlock(headerEl) {
    const block = headerEl.parentElement;
    block.classList.toggle('collapsed');
    block.classList.toggle('expanded');
}

// ============================================================
// PROGRESS CALCULATION & LOCAL STORAGE (preserved from original)
// ============================================================
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
    updateCurrentFocusCard();
    trackDailyActivity();
    // Update My Plan if visible
    if (document.getElementById('pane-myplan') && document.getElementById('pane-myplan').classList.contains('active')) {
        renderMyPlan();
    }
    // Update Exam Mode if visible
    if (document.getElementById('pane-exam') && document.getElementById('pane-exam').classList.contains('active')) {
        renderExamMode();
    }
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

// ============================================================
// DASHBOARD CHARTS (preserved from original)
// ============================================================
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

// ============================================================
// STUDENT PROFILE & ONBOARDING
// ============================================================
const ONBOARDING_STEPS = [
    {
        question: 'Which year & semester are you currently in?',
        key: 'semester',
        options: [
            { value: 'sem1', label: '1st Year — Semester 1', desc: 'Just starting college' },
            { value: 'sem2', label: '1st Year — Semester 2', desc: 'Completed first semester' },
            { value: 'sem3', label: '2nd Year — Semester 3', desc: 'Entering core CS subjects' },
            { value: 'sem4', label: '2nd Year — Semester 4', desc: 'Algorithms & OS semester' },
            { value: 'sem5', label: '3rd Year — Semester 5', desc: 'DBMS & web development' },
            { value: 'sem6', label: '3rd Year — Semester 6', desc: 'Networks & ML' },
            { value: 'sem7', label: '4th Year — Semester 7', desc: 'Placement sprint' },
            { value: 'sem8', label: '4th Year — Semester 8', desc: 'Capstone & career' },
        ]
    },
    {
        question: 'What is your current programming experience?',
        key: 'experience',
        options: [
            { value: 'none', label: 'None', desc: 'Never written code before' },
            { value: 'basic', label: 'Basic', desc: 'Can write simple programs in any language' },
            { value: 'comfortable', label: 'Comfortable', desc: 'Built small projects independently' },
        ]
    },
    {
        question: 'What is your primary goal?',
        key: 'goal',
        options: [
            { value: 'academics', label: 'Strong Academics', desc: 'Score well in RGPV exams' },
            { value: 'sde', label: 'Software Engineer (SDE)', desc: 'Get placed at a tech company' },
            { value: 'web', label: 'Full-Stack Web Developer', desc: 'Build web applications' },
            { value: 'aiml', label: 'AI / Machine Learning', desc: 'Work on data & AI problems' },
            { value: 'explore', label: 'Explore Everything', desc: 'Not sure yet, want to try things' },
        ]
    },
    {
        question: 'Preferred learning language?',
        key: 'language',
        options: [
            { value: 'hindi', label: 'Hindi / Hinglish', desc: 'Prefer Hindi explanations' },
            { value: 'english', label: 'English', desc: 'Comfortable with English content' },
            { value: 'mixed', label: 'Mixed', desc: 'Both work fine' },
        ]
    },
    {
        question: 'How many hours per week can you dedicate?',
        key: 'weeklyHours',
        options: [
            { value: '3-5', label: '3–5 hours/week', desc: 'Light schedule alongside classes' },
            { value: '5-10', label: '5–10 hours/week', desc: 'Moderate, steady learning' },
            { value: '10+', label: '10+ hours/week', desc: 'Intensive, fast progress' },
        ]
    },
];

let onboardingCurrentStep = 0;
let onboardingAnswers = {};

function getStudentProfile() {
    try {
        return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
    } catch (e) {
        return null;
    }
}

function saveStudentProfile(profile) {
    profile.onboardingComplete = true;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function openOnboarding() {
    onboardingCurrentStep = 0;
    const existingProfile = getStudentProfile();
    onboardingAnswers = existingProfile ? { ...existingProfile } : {};
    delete onboardingAnswers.onboardingComplete;
    renderOnboardingStep();
    document.getElementById('onboardingOverlay').classList.add('active');
}

function closeOnboarding() {
    document.getElementById('onboardingOverlay').classList.remove('active');
}

function renderOnboardingStep() {
    const modal = document.getElementById('onboardingModal');
    const totalSteps = ONBOARDING_STEPS.length;
    
    if (onboardingCurrentStep >= totalSteps) {
        renderOnboardingResult();
        return;
    }

    const step = ONBOARDING_STEPS[onboardingCurrentStep];
    const selectedValue = onboardingAnswers[step.key] || '';
    
    let stepsHTML = '';
    for (let i = 0; i < totalSteps; i++) {
        const cls = i < onboardingCurrentStep ? 'step-dot completed' : (i === onboardingCurrentStep ? 'step-dot active' : 'step-dot');
        stepsHTML += `<div class="${cls}"></div>`;
    }

    let optionsHTML = '';
    step.options.forEach(opt => {
        const selected = selectedValue === opt.value ? ' selected' : '';
        optionsHTML += `
            <div class="onboarding-option${selected}" onclick="selectOnboardingOption('${step.key}', '${opt.value}', this)">
                <div class="onboarding-option-radio"></div>
                <div>
                    <div class="onboarding-option-text">${opt.label}</div>
                    ${opt.desc ? `<div class="onboarding-option-desc">${opt.desc}</div>` : ''}
                </div>
            </div>
        `;
    });

    modal.innerHTML = `
        <div class="onboarding-header">
            <div class="onboarding-step-indicator">${stepsHTML}</div>
            <div class="onboarding-title">Set up your roadmap</div>
            <div class="onboarding-subtitle">Step ${onboardingCurrentStep + 1} of ${totalSteps} — takes less than a minute</div>
        </div>
        <div class="onboarding-body">
            <div class="onboarding-question">${step.question}</div>
            <div class="onboarding-options">${optionsHTML}</div>
        </div>
        <div class="onboarding-footer">
            <button class="onboarding-skip" onclick="skipOnboarding()">Skip for now</button>
            <div class="onboarding-nav">
                ${onboardingCurrentStep > 0 ? '<button class="btn-onboarding-back" onclick="prevOnboardingStep()">Back</button>' : ''}
                <button class="btn-onboarding-next" onclick="nextOnboardingStep()" ${!selectedValue ? 'disabled' : ''}>
                    ${onboardingCurrentStep === totalSteps - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    `;
}

function selectOnboardingOption(key, value, el) {
    onboardingAnswers[key] = value;
    el.closest('.onboarding-options').querySelectorAll('.onboarding-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    // Enable the Next button
    const nextBtn = document.querySelector('.btn-onboarding-next');
    if (nextBtn) nextBtn.disabled = false;
}

function nextOnboardingStep() {
    const step = ONBOARDING_STEPS[onboardingCurrentStep];
    if (!onboardingAnswers[step.key]) return;
    onboardingCurrentStep++;
    renderOnboardingStep();
}

function prevOnboardingStep() {
    if (onboardingCurrentStep > 0) {
        onboardingCurrentStep--;
        renderOnboardingStep();
    }
}

function skipOnboarding() {
    // Default profile for skipped onboarding
    const defaults = {
        semester: 'sem1',
        experience: 'none',
        goal: 'explore',
        language: 'mixed',
        weeklyHours: '5-10',
    };
    saveStudentProfile(defaults);
    closeOnboarding();
    applyStudentProfile();
}

function renderOnboardingResult() {
    const modal = document.getElementById('onboardingModal');
    const profile = onboardingAnswers;

    const semLabel = SEMESTER_LABELS[profile.semester] || profile.semester;
    const expLabels = { none: 'No experience', basic: 'Basic', comfortable: 'Comfortable' };
    const goalLabels = { academics: 'Strong Academics', sde: 'SDE Role', web: 'Web Developer', aiml: 'AI/ML', explore: 'Exploring' };
    const langLabels = { hindi: 'Hindi/Hinglish', english: 'English', mixed: 'Mixed' };
    const hourLabels = { '3-5': '3–5 hrs/week', '5-10': '5–10 hrs/week', '10+': '10+ hrs/week' };

    modal.innerHTML = `
        <div class="onboarding-result">
            <div class="onboarding-result-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div class="onboarding-result-title">Your roadmap is ready!</div>
            <div class="onboarding-result-desc">
                We've personalized your experience. Your current semester is highlighted, and everything else is organized by priority.
            </div>
            <div class="onboarding-result-summary">
                <div class="result-item">
                    <div class="result-item-label">Current Stage</div>
                    <div class="result-item-value">${semLabel}</div>
                </div>
                <div class="result-item">
                    <div class="result-item-label">Experience</div>
                    <div class="result-item-value">${expLabels[profile.experience] || profile.experience}</div>
                </div>
                <div class="result-item">
                    <div class="result-item-label">Goal</div>
                    <div class="result-item-value">${goalLabels[profile.goal] || profile.goal}</div>
                </div>
                <div class="result-item">
                    <div class="result-item-label">Weekly Time</div>
                    <div class="result-item-value">${hourLabels[profile.weeklyHours] || profile.weeklyHours}</div>
                </div>
            </div>
            <div class="onboarding-result-actions">
                <button class="btn-primary" onclick="completeOnboarding()">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Start Learning
                </button>
            </div>
        </div>
    `;
}

function completeOnboarding() {
    saveStudentProfile(onboardingAnswers);
    closeOnboarding();
    applyStudentProfile();
}

// ============================================================
// APPLY STUDENT PROFILE — focus card, stage badges, hero CTA
// ============================================================
function applyStudentProfile() {
    const profile = getStudentProfile();
    if (!profile || !profile.onboardingComplete) {
        // No profile — show "Start My Journey" CTA, hide focus card
        const heroCta = document.getElementById('heroCta');
        if (heroCta) heroCta.style.display = 'flex';
        const focusCard = document.getElementById('currentFocusCard');
        if (focusCard) focusCard.classList.remove('visible');
        clearStageBadges();
        return;
    }

    // Profile exists — hide "Start My Journey" button text, update CTA
    const startBtn = document.getElementById('startJourneyBtn');
    if (startBtn) {
        startBtn.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Edit Profile`;
        startBtn.classList.remove('btn-primary');
        startBtn.classList.add('btn-secondary-outline');
    }

    updateStageBadges(profile.semester);
    updateCurrentFocusCard();
    autoExpandCurrentSemester(profile.semester);
}

// ============================================================
// STAGE BADGES — DO NOW / DO NEXT / LATER
// ============================================================
function clearStageBadges() {
    document.querySelectorAll('.stage-badge[data-stage-sem]').forEach(badge => {
        badge.textContent = '';
        badge.className = 'stage-badge';
    });
}

function updateStageBadges(currentSem) {
    const currentIndex = SEMESTER_ORDER.indexOf(currentSem);
    if (currentIndex === -1) return;

    document.querySelectorAll('.stage-badge[data-stage-sem]').forEach(badge => {
        const semKey = badge.dataset.stageSem;
        const semIndex = SEMESTER_ORDER.indexOf(semKey);

        if (semKey === currentSem) {
            badge.textContent = 'DO NOW';
            badge.className = 'stage-badge stage-badge-now';
        } else if (semIndex === currentIndex + 1 || (semKey === 'cc' && semIndex > currentIndex)) {
            // The next semester and co-curricular are "DO NEXT"
            if (semIndex === currentIndex + 1) {
                badge.textContent = 'DO NEXT';
                badge.className = 'stage-badge stage-badge-next';
            } else if (semKey === 'cc') {
                badge.textContent = 'ONGOING';
                badge.className = 'stage-badge stage-badge-next';
            } else {
                badge.textContent = 'LATER';
                badge.className = 'stage-badge stage-badge-later';
            }
        } else if (semIndex < currentIndex) {
            // Already passed semesters
            const pct = getGroupPct(semKey);
            if (pct === 100) {
                badge.textContent = 'DONE';
                badge.className = 'stage-badge stage-badge-now';
            } else {
                badge.textContent = 'REVIEW';
                badge.className = 'stage-badge stage-badge-next';
            }
        } else {
            badge.textContent = 'LATER';
            badge.className = 'stage-badge stage-badge-later';
        }
    });
}

// ============================================================
// CURRENT FOCUS CARD
// ============================================================
function updateCurrentFocusCard() {
    const profile = getStudentProfile();
    if (!profile || !profile.onboardingComplete) return;

    const focusCard = document.getElementById('currentFocusCard');
    if (!focusCard) return;

    const currentSem = profile.semester;
    const focusData = computeFocusData(currentSem);

    if (!focusData) {
        focusCard.classList.remove('visible');
        return;
    }

    focusCard.classList.add('visible');

    const focusStage = document.getElementById('focusStage');
    if (focusStage) focusStage.textContent = SEMESTER_LABELS[currentSem] || currentSem;

    const focusSubject = document.getElementById('focusSubject');
    if (focusSubject) focusSubject.textContent = focusData.subjectName;

    const focusMilestone = document.getElementById('focusMilestone');
    if (focusMilestone) {
        focusMilestone.textContent = focusData.nextMilestone 
            ? `Next: ${focusData.nextMilestone}` 
            : 'All milestones completed in this subject!';
    }

    const pct = focusData.total > 0 ? Math.round((focusData.checked / focusData.total) * 100) : 0;
    
    const focusFill = document.getElementById('focusProgressFill');
    if (focusFill) focusFill.style.width = `${pct}%`;

    const focusText = document.getElementById('focusProgressText');
    if (focusText) focusText.textContent = `${focusData.checked}/${focusData.total} (${pct}%)`;

    const focusTimeText = document.getElementById('focusTimeText');
    if (focusTimeText) {
        const remaining = focusData.total - focusData.checked;
        const mins = remaining * 15;
        if (mins >= 60) {
            focusTimeText.textContent = `~${Math.round(mins / 60)} hr ${mins % 60 > 0 ? (mins % 60) + ' min' : ''} remaining`;
        } else {
            focusTimeText.textContent = `~${mins} min remaining`;
        }
    }
}

function computeFocusData(semKey) {
    // Find the first subject-row in this semester that has incomplete checkboxes
    const block = document.querySelector(`.semester-block[data-sem="${semKey}"]`);
    if (!block) return null;

    const subjects = block.querySelectorAll('.subject-row');
    for (const subjectRow of subjects) {
        const checkboxes = subjectRow.querySelectorAll('.check-input');
        if (checkboxes.length === 0) continue;

        let checked = 0;
        let firstUncheckedLabel = null;
        checkboxes.forEach(cb => {
            if (cb.checked) {
                checked++;
            } else if (!firstUncheckedLabel) {
                const label = cb.closest('.check-item')?.querySelector('.check-label');
                if (label) firstUncheckedLabel = label.textContent.trim();
            }
        });

        if (checked < checkboxes.length) {
            // This subject has incomplete work
            const nameEl = subjectRow.querySelector('.subject-name');
            return {
                subjectName: nameEl ? nameEl.textContent.trim() : 'Unknown Subject',
                nextMilestone: firstUncheckedLabel,
                checked: checked,
                total: checkboxes.length,
                subjectRow: subjectRow,
            };
        }
    }

    // All subjects in this semester are complete — check next semester
    const currentIndex = SEMESTER_ORDER.indexOf(semKey);
    if (currentIndex < SEMESTER_ORDER.length - 1) {
        return computeFocusData(SEMESTER_ORDER[currentIndex + 1]);
    }

    return null;
}

// ============================================================
// SCROLL TO FOCUS — expands accordion and scrolls to subject
// ============================================================
function scrollToCurrentFocus() {
    const profile = getStudentProfile();
    if (!profile) return;

    const focusData = computeFocusData(profile.semester);
    if (!focusData || !focusData.subjectRow) return;

    // Find the parent semester block and expand it
    const block = focusData.subjectRow.closest('.semester-block');
    if (block && block.classList.contains('collapsed')) {
        block.classList.remove('collapsed');
        block.classList.add('expanded');
    }

    // Ensure the curriculum tab is active
    switchTab('curriculum');

    // Ensure "All Semesters" filter is active so the block is visible
    const allChip = document.querySelector('.filter-chip');
    if (allChip) setFilter('all', allChip);

    // Scroll to the subject row
    setTimeout(() => {
        focusData.subjectRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Brief highlight effect
        focusData.subjectRow.style.transition = 'background-color 0.3s ease';
        focusData.subjectRow.style.backgroundColor = 'var(--accent-light)';
        setTimeout(() => {
            focusData.subjectRow.style.backgroundColor = '';
        }, 1500);
    }, 200);
}

function scrollToFullRoadmap() {
    switchTab('curriculum');
    const container = document.getElementById('semesterContainer');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================================
// AUTO-EXPAND CURRENT SEMESTER
// ============================================================
function autoExpandCurrentSemester(semKey) {
    // Collapse all, then expand the current one
    document.querySelectorAll('.semester-block').forEach(block => {
        if (block.dataset.sem === semKey) {
            block.classList.remove('collapsed');
            block.classList.add('expanded');
        } else if (!block.classList.contains('collapsed') && !block.classList.contains('expanded')) {
            // First load — leave as-is (default is expanded)
            // Only collapse other blocks if user has completed onboarding
            block.classList.add('collapsed');
            block.classList.remove('expanded');
        }
    });
}

// ============================================================
// MY PLAN — Daily Task Engine
// ============================================================
const PLAN_TASKS_COUNT = 3;
const MINUTES_PER_TASK = 15;

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDailyPlanData() {
    try {
        return JSON.parse(localStorage.getItem(PLAN_KEY)) || {};
    } catch(e) { return {}; }
}

function saveDailyPlanData(data) {
    localStorage.setItem(PLAN_KEY, JSON.stringify(data));
}

function getStreakData() {
    try {
        return JSON.parse(localStorage.getItem(STREAK_KEY)) || { streak: 0, lastDate: null, weekLog: {} };
    } catch(e) { return { streak: 0, lastDate: null, weekLog: {} }; }
}

function saveStreakData(data) {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

function trackDailyActivity() {
    const today = getTodayKey();
    const streakData = getStreakData();

    // Count today's completed checkboxes
    const totalChecked = document.querySelectorAll('.check-input:checked').length;
    if (totalChecked === 0) return;

    if (!streakData.weekLog) streakData.weekLog = {};
    streakData.weekLog[today] = totalChecked;

    // Update streak
    if (streakData.lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

        if (streakData.lastDate === yKey) {
            streakData.streak = (streakData.streak || 0) + 1;
        } else if (streakData.lastDate !== today) {
            streakData.streak = 1;
        }
        streakData.lastDate = today;
    }

    saveStreakData(streakData);
}

function generateTodaysTasks() {
    const profile = getStudentProfile();
    if (!profile || !profile.onboardingComplete) return [];

    const currentSem = profile.semester;
    const tasks = [];
    const seenSubjects = new Set();

    // Get tasks from current semester first, then next
    const semOrder = [currentSem];
    const curIdx = SEMESTER_ORDER.indexOf(currentSem);
    if (curIdx >= 0 && curIdx < SEMESTER_ORDER.length - 1) {
        semOrder.push(SEMESTER_ORDER[curIdx + 1]);
    }

    for (const semKey of semOrder) {
        if (tasks.length >= PLAN_TASKS_COUNT) break;

        const block = document.querySelector(`.semester-block[data-sem="${semKey}"]`);
        if (!block) continue;

        const subjects = block.querySelectorAll('.subject-row');
        for (const subjectRow of subjects) {
            if (tasks.length >= PLAN_TASKS_COUNT) break;

            const nameEl = subjectRow.querySelector('.subject-name');
            const subjectName = nameEl ? nameEl.textContent.trim() : 'Subject';
            if (seenSubjects.has(subjectName)) continue;

            const checkboxes = subjectRow.querySelectorAll('.check-input');
            for (const cb of checkboxes) {
                if (tasks.length >= PLAN_TASKS_COUNT) break;
                if (cb.checked) continue;

                const label = cb.closest('.check-item')?.querySelector('.check-label');
                const taskName = label ? label.textContent.trim() : 'Complete milestone';

                // Determine task type from context
                let taskType = 'learn';
                let taskTypeLabel = 'Learn';
                const taskLower = taskName.toLowerCase();
                if (taskLower.includes('practice') || taskLower.includes('solve') || taskLower.includes('problem') || taskLower.includes('exercise')) {
                    taskType = 'practice';
                    taskTypeLabel = 'Practice';
                } else if (taskLower.includes('watch') || taskLower.includes('video') || taskLower.includes('lecture')) {
                    taskType = 'watch';
                    taskTypeLabel = 'Watch';
                } else if (taskLower.includes('read') || taskLower.includes('notes') || taskLower.includes('revise')) {
                    taskType = 'read';
                    taskTypeLabel = 'Read';
                }

                tasks.push({
                    id: cb.dataset.id,
                    title: taskName,
                    subject: subjectName,
                    semester: SEMESTER_LABELS[semKey] || semKey,
                    type: taskType,
                    typeLabel: taskTypeLabel,
                    minutes: MINUTES_PER_TASK,
                    checkboxEl: cb,
                });

                seenSubjects.add(subjectName);
                break; // One task per subject
            }
        }
    }

    return tasks;
}

function renderMyPlan() {
    const profile = getStudentProfile();

    // Handle empty state
    const emptyState = document.getElementById('planEmptyState');
    const planSections = ['planStageContext', 'planTasksList', 'planYesterday', 'planWeekGrid', 'planLaterSection'];
    const mainPlanEls = document.querySelectorAll('#pane-myplan .plan-header, #pane-myplan .plan-stage-context, #pane-myplan .plan-tasks-section, #pane-myplan .plan-yesterday, #pane-myplan .plan-week-section, #pane-myplan .plan-later-section');

    if (!profile || !profile.onboardingComplete) {
        if (emptyState) emptyState.style.display = 'block';
        mainPlanEls.forEach(el => el.style.display = 'none');
        return;
    } else {
        if (emptyState) emptyState.style.display = 'none';
        mainPlanEls.forEach(el => el.style.display = '');
    }

    // Date header
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const planDate = document.getElementById('planDate');
    if (planDate) planDate.textContent = dateStr;

    // Streak
    const streakData = getStreakData();
    const streakCount = document.getElementById('planStreakCount');
    if (streakCount) streakCount.textContent = streakData.streak || 0;

    // Stage context
    const currentSem = profile.semester;
    const stageName = document.getElementById('planStageName');
    if (stageName) stageName.textContent = SEMESTER_LABELS[currentSem] || currentSem;

    const semPct = getGroupPct(currentSem);
    const stageBarFill = document.getElementById('planStageBarFill');
    if (stageBarFill) stageBarFill.style.width = `${semPct}%`;
    const stagePct = document.getElementById('planStagePct');
    if (stagePct) stagePct.textContent = `${semPct}%`;

    // Generate today's tasks
    const tasks = generateTodaysTasks();
    const taskList = document.getElementById('planTasksList');
    const tasksLabel = document.getElementById('planTasksLabel');
    const tasksTime = document.getElementById('planTasksTime');

    if (tasksLabel) {
        if (tasks.length === 0) {
            tasksLabel.textContent = 'All caught up!';
        } else {
            tasksLabel.textContent = `${tasks.length} task${tasks.length > 1 ? 's' : ''} for today`;
        }
    }

    const totalMinutes = tasks.length * MINUTES_PER_TASK;
    if (tasksTime) {
        tasksTime.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ~${totalMinutes} min`;
    }

    if (taskList) {
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="plan-task-card completed" style="justify-content: center; text-align: center; opacity: 1;">
                    <div class="plan-task-content">
                        <div class="plan-task-title" style="text-decoration: none; color: var(--accent);">🎉 Great work! All current tasks are done.</div>
                        <div class="plan-task-meta" style="justify-content: center;"><span class="plan-task-subject">Check back tomorrow or explore the full roadmap</span></div>
                    </div>
                </div>
            `;
        } else {
            taskList.innerHTML = tasks.map((task, idx) => {
                const typeClass = task.type === 'practice' ? 'type-practice' : (task.type === 'watch' ? 'type-watch' : '');
                return `
                    <div class="plan-task-card" id="plan-task-${idx}" onclick="togglePlanTask('${task.id}', ${idx})">
                        <input type="checkbox" class="plan-task-check" ${task.checkboxEl.checked ? 'checked' : ''}
                               onclick="event.stopPropagation(); togglePlanTask('${task.id}', ${idx})">
                        <div class="plan-task-content">
                            <div class="plan-task-title">${task.title}</div>
                            <div class="plan-task-meta">
                                <span class="plan-task-subject">${task.subject}</span>
                                <span class="plan-task-time">~${task.minutes} min</span>
                                <span class="plan-task-type ${typeClass}">${task.typeLabel}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Yesterday summary
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    const yesterdayResult = document.getElementById('planYesterdayResult');
    if (yesterdayResult) {
        const yCount = streakData.weekLog?.[yKey] || 0;
        if (yCount > 0) {
            yesterdayResult.textContent = `${yCount} milestone${yCount > 1 ? 's' : ''} completed`;
            yesterdayResult.style.color = 'var(--accent)';
        } else {
            yesterdayResult.textContent = 'No activity';
            yesterdayResult.style.color = 'var(--text-dim)';
        }
    }

    // Weekly overview
    renderWeekGrid(streakData);

    // Not needed yet section
    renderLaterSection(currentSem);
}

function togglePlanTask(checkboxId, taskIdx) {
    // Find the matching checkbox in the main curriculum
    const mainCb = document.querySelector(`.check-input[data-id="${checkboxId}"]`);
    if (mainCb) {
        mainCb.checked = !mainCb.checked;
        updateAllProgress();
    }
}

function renderWeekGrid(streakData) {
    const grid = document.getElementById('planWeekGrid');
    if (!grid) return;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayKey = getTodayKey();

    // Start from Monday of this week
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

    let weekCompleted = 0;
    let html = '';

    for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        const dKey = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
        const count = streakData.weekLog?.[dKey] || 0;
        const isToday = dKey === todayKey;
        const dayIdx = day.getDay();

        let dotClass = 'plan-week-day-dot';
        if (isToday) dotClass += ' today';
        if (count > 0) {
            dotClass += ' has-activity';
            weekCompleted += count;
        }

        html += `
            <div class="plan-week-day">
                <span class="plan-week-day-label">${dayNames[dayIdx]}</span>
                <div class="${dotClass}">${count > 0 ? count : ''}</div>
            </div>
        `;
    }

    grid.innerHTML = html;

    const weekComp = document.getElementById('planWeekCompleted');
    if (weekComp) weekComp.textContent = `${weekCompleted} milestone${weekCompleted !== 1 ? 's' : ''} completed`;
}

function renderLaterSection(currentSem) {
    const laterItems = document.getElementById('planLaterItems');
    const laterSection = document.getElementById('planLaterSection');
    if (!laterItems || !laterSection) return;

    const currentIdx = SEMESTER_ORDER.indexOf(currentSem);
    const futureSems = SEMESTER_ORDER.filter((s, i) => i > currentIdx + 1 && s !== 'cc');

    if (futureSems.length === 0) {
        laterSection.style.display = 'none';
        return;
    }

    laterSection.style.display = '';

    // Gather subject names from future semesters
    const futureSubjects = [];
    for (const semKey of futureSems) {
        const block = document.querySelector(`.semester-block[data-sem="${semKey}"]`);
        if (!block) continue;
        const names = block.querySelectorAll('.subject-name');
        names.forEach(n => {
            const txt = n.textContent.trim();
            if (txt && futureSubjects.length < 12) futureSubjects.push(txt);
        });
    }

    laterItems.innerHTML = futureSubjects.map(s => `<span class="plan-later-chip">${s}</span>`).join('');

    const laterDesc = document.getElementById('planLaterDesc');
    if (laterDesc) {
        laterDesc.textContent = `${futureSems.length} semester${futureSems.length > 1 ? 's' : ''} ahead. Focus on ${SEMESTER_LABELS[currentSem] || 'your current semester'} first.`;
    }
}

// ============================================================
// EXAM MODE
// ============================================================
let countdownInterval = null;

function renderExamMode() {
    const profile = getStudentProfile();
    const emptyState = document.getElementById('examEmptyState');
    const mainExamEls = document.querySelectorAll('#pane-exam .exam-countdown-section, #pane-exam .exam-pyq-panel, #pane-exam .exam-subjects-section, #pane-exam .exam-tips-section');

    if (!profile || !profile.onboardingComplete) {
        if (emptyState) emptyState.style.display = 'block';
        mainExamEls.forEach(el => el.style.display = 'none');
        return;
    } else {
        if (emptyState) emptyState.style.display = 'none';
        mainExamEls.forEach(el => el.style.display = '');
    }

    const currentSem = profile.semester;
    
    // Label
    const semLabel = document.getElementById('examSemLabel');
    if (semLabel) semLabel.textContent = SEMESTER_LABELS[currentSem] || currentSem;

    // Countdown
    const savedDate = localStorage.getItem(EXAM_DATE_KEY);
    const dateInput = document.getElementById('examDateInput');
    if (savedDate && dateInput) {
        dateInput.value = savedDate;
    }
    updateCountdown();

    // Subject data extraction
    populateExamSubjects(currentSem);
}

function saveExamDate() {
    const dateInput = document.getElementById('examDateInput');
    if (dateInput && dateInput.value) {
        localStorage.setItem(EXAM_DATE_KEY, dateInput.value);
        updateCountdown();
    }
}

function updateCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    const savedDate = localStorage.getItem(EXAM_DATE_KEY);
    const hint = document.getElementById('examCountdownHint');
    const timer = document.getElementById('examCountdownTimer');
    const dEl = document.getElementById('countdownDays');
    const hEl = document.getElementById('countdownHours');
    const mEl = document.getElementById('countdownMins');

    if (!savedDate) {
        if (hint) hint.style.display = 'block';
        if (timer) timer.style.display = 'none';
        return;
    }

    if (hint) hint.style.display = 'none';
    if (timer) timer.style.display = 'flex';

    const examDate = new Date(savedDate);
    examDate.setHours(10, 0, 0, 0); // Assume 10 AM start time
    
    const tick = () => {
        const now = new Date().getTime();
        const distance = examDate.getTime() - now;

        if (distance < 0) {
            dEl.textContent = "00";
            hEl.textContent = "00";
            mEl.textContent = "00";
            hint.textContent = "Exams have started! Good luck!";
            hint.style.display = 'block';
            hint.style.color = "var(--warning)";
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        dEl.textContent = String(days).padStart(2, '0');
        hEl.textContent = String(hours).padStart(2, '0');
        mEl.textContent = String(minutes).padStart(2, '0');
    };

    tick();
    countdownInterval = setInterval(tick, 60000); // Update every minute
}

function populateExamSubjects(semKey) {
    const block = document.querySelector(`.semester-block[data-sem="${semKey}"]`);
    if (!block) return;

    const subjects = block.querySelectorAll('.subject-row');
    const pyqGrid = document.getElementById('examPyqGrid');
    const subjList = document.getElementById('examSubjectsList');
    const pyqCountLabel = document.getElementById('examPyqCount');

    let pyqHtml = '';
    let subjHtml = '';
    let subjectCount = 0;

    subjects.forEach((subjRow, idx) => {
        const code = subjRow.querySelector('.subject-code')?.textContent || '';
        const name = subjRow.querySelector('.subject-name')?.textContent || 'Subject';
        const pyqLink = subjRow.querySelector('.tag-pyq')?.getAttribute('href') || '#';
        
        // Count total and checked items for this subject
        const checkboxes = subjRow.querySelectorAll('.check-input');
        const total = checkboxes.length;
        let checked = 0;
        let unitsHtml = '';

        checkboxes.forEach((cb, cbIdx) => {
            if (cb.checked) checked++;
            const label = cb.closest('.check-item')?.querySelector('.check-label')?.textContent || `Unit ${cbIdx+1}`;
            
            unitsHtml += `
                <div class="exam-unit-item">
                    <input type="checkbox" class="exam-unit-check" data-exam-sync="${cb.dataset.id}" ${cb.checked ? 'checked' : ''} onchange="syncExamCheckbox(this)">
                    <span class="exam-unit-label ${cb.checked ? 'completed' : ''}">${label}</span>
                    <a href="${pyqLink}" target="_blank" class="exam-unit-pyq">PYQs</a>
                </div>
            `;
        });

        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

        // Add to Subject List
        subjHtml += `
            <div class="exam-subject-card ${idx === 0 ? 'expanded' : ''}" id="exam-card-${idx}">
                <div class="exam-subject-card-header" onclick="toggleExamCard(${idx})">
                    <div class="exam-subject-card-left">
                        <span class="exam-subject-card-code">${code}</span>
                        <span class="exam-subject-card-name">${name}</span>
                    </div>
                    <div class="exam-subject-card-right">
                        <div class="exam-subject-card-bar">
                            <div class="exam-subject-card-bar-fill" style="width: ${pct}%"></div>
                        </div>
                        <span class="exam-subject-card-pct">${checked}/${total}</span>
                        <div class="exam-subject-card-toggle">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
                <div class="exam-subject-card-body">
                    <div class="exam-unit-list">
                        ${unitsHtml}
                    </div>
                </div>
            </div>
        `;

        // Add to PYQ panel
        if (code && name) {
            subjectCount++;
            pyqHtml += `
                <a href="${pyqLink}" target="_blank" class="exam-pyq-card">
                    <div class="exam-pyq-card-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div class="exam-pyq-card-info">
                        <div class="exam-pyq-card-name">${name}</div>
                        <div class="exam-pyq-card-code">${code}</div>
                    </div>
                </a>
            `;
        }
    });

    if (subjList) subjList.innerHTML = subjHtml;
    if (pyqGrid) pyqGrid.innerHTML = pyqHtml;
    if (pyqCountLabel) pyqCountLabel.textContent = `${subjectCount} subjects`;
}

function toggleExamCard(idx) {
    const card = document.getElementById(`exam-card-${idx}`);
    if (card) {
        card.classList.toggle('expanded');
    }
}

function syncExamCheckbox(examCb) {
    const mainId = examCb.dataset.examSync;
    const mainCb = document.querySelector(`.check-input[data-id="${mainId}"]`);
    if (mainCb) {
        mainCb.checked = examCb.checked;
        updateAllProgress();
    }
}

// ============================================================
// KEYBOARD SHORTCUT (CTRL + K FOR SEARCH) — preserved
// ============================================================
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    // Esc to close onboarding
    if (e.key === 'Escape') {
        const overlay = document.getElementById('onboardingOverlay');
        if (overlay && overlay.classList.contains('active')) {
            closeOnboarding();
        }
    }
});

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadCheckboxes();
    applyResourceHierarchy();
    
    const profile = getStudentProfile();
    if (profile && profile.onboardingComplete) {
        applyStudentProfile();
    } else {
        applyStudentProfile();
    }
});

// ============================================================
// RESOURCE HIERARCHY — auto-label resource tags
// ============================================================
function applyResourceHierarchy() {
    // For each subject-row, label the first resource as 'recommended',
    // tag-alt as 'alternative', tag-pyq as 'practice', and others
    document.querySelectorAll('.subject-row').forEach(row => {
        const resources = row.querySelectorAll('.resource-tag');
        let firstDone = false;
        resources.forEach(tag => {
            if (tag.classList.contains('tag-pyq')) {
                tag.setAttribute('data-resource-type', 'practice');
            } else if (tag.classList.contains('tag-alt')) {
                // Already an alternative — no special label
                tag.setAttribute('data-resource-type', 'alternative');
            } else if (!firstDone) {
                tag.setAttribute('data-resource-type', 'recommended');
                firstDone = true;
            } else {
                tag.setAttribute('data-resource-type', 'reference');
            }
        });
    });
}
