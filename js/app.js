(function () {
  'use strict';

  // ── Keys ──
  const JOURNAL_KEY = 'lifeboard_journal';
  const THEME_KEY = 'lifeboard_theme';
  const TODOS_KEY = 'lifeboard-todos';
  const CATEGORIES_KEY = 'lifeboard-categories';
  const SORT_KEY = 'lifeboard-todo-sort';
  const HABITS_KEY = 'lifeboard-habits';
  const HABIT_LOG_KEY = 'lifeboard-habit-log';
  const STICKIES_KEY = 'lifeboard-stickies';
  const GOALS_KEY = 'lifeboard-goals';
  const GOALS_FILTER_KEY = 'lifeboard-goals-filter';
  const REFLECTIONS_KEY = 'lifeboard-reflections';
  const LIFE_SCORES_KEY = 'lifeboard-life-scores';
  const LESSONS_KEY = 'lifeboard-lessons';

  const PROMPTS = [
    "What made you smile today?",
    "What's something you're grateful for right now?",
    "If you could change one thing about today, what would it be?",
    "What's been on your mind the most lately?",
    "Describe a moment today when you felt truly present.",
    "What's a challenge you're currently facing, and how does it make you feel?",
    "Write about someone who made a difference in your day.",
    "What would your ideal tomorrow look like?",
    "What's something you learned recently that surprised you?",
    "If your current mood were a weather forecast, what would it be?",
    "What's one thing you did today that you're proud of?",
    "Write a letter to your future self, one year from now.",
    "What's a small win you had today that deserves recognition?",
    "How has your energy been today? What affected it?",
    "What's something you've been avoiding, and why?",
    "Describe a place where you feel most at peace.",
    "What boundaries do you need to set or reinforce?",
    "What's a fear you'd like to let go of?",
    "Who do you need to forgive — including yourself?",
    "What does your ideal morning routine look like?"
  ];

  const DEFAULT_CATEGORIES = [
    { id: 'school', name: 'School', color: '#4A90B8', builtin: true },
    { id: 'personal', name: 'Personal', color: '#5B8C6A', builtin: true },
    { id: 'crypto', name: 'Crypto', color: '#D4943A', builtin: true },
    { id: 'health', name: 'Health', color: '#C45B78', builtin: true },
    { id: 'other', name: 'Other', color: '#7A7068', builtin: true }
  ];

  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

  const MOOD_LABELS = {
    '😊': 'Feeling Happy',
    '😢': 'Feeling Sad',
    '😡': 'Feeling Frustrated',
    '🤩': 'Feeling Excited',
    '😌': 'Feeling Calm',
    '💪': 'Feeling Productive',
    '⭐': 'Memorable Day',
    '😔': 'Bad Day'
  };

  // ── State ──
  let entries = [];
  let todos = [];
  let categories = [];
  let habits = [];
  let habitLog = {};
  let stickies = [];
  let editingHabitId = null;
  let selectedHabitEmoji = '📖';
  let selectedHabitFreq = 'daily';
  let editingStickyId = null;
  let selectedStickyColor = 'green';
  let goals = [];
  let goalStatusFilter = 'all';
  let goalCategoryFilter = 'all';
  let goalSort = 'date';
  let currentGoalId = null;
  let editingGoalId = null;
  let selectedGoalEmoji = '🎯';
  let selectedGoalCategory = 'personal';
  let selectedGoalStatus = 'active';
  let editingMilestones = [];
  let reflections = [];
  let lifeScores = [];
  let lessons = [];
  let journalMode = 'entries';
  let reflectSection = 'checkin';
  let currentCheckinId = null;
  let editingCheckinId = null;
  let checkinRating = 0;
  let currentLessonId = null;
  let editingLessonId = null;
  let lessonSearchQuery = '';
  let moodPeriod = 7;
  let currentFeature = 'today';
  let currentFilter = 'all';
  let currentEntryId = null;
  let editingEntryId = null;
  let selectedMood = null;
  let lastPromptIndex = -1;
  let searchQuery = '';
  let calendarDate = new Date();
  let selectedCalDate = null;
  let journalView = 'list';
  let deleteMode = 'single';

  let todoStatusFilter = 'all';
  let todoCategoryFilter = 'all';
  let todoPriorityFilter = 'all';
  let todoSort = 'due';
  let currentTodoId = null;
  let editingTodoId = null;
  let selectedPriority = 'medium';
  let selectedCategory = 'personal';

  // ── Helpers ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function isMobile() { return window.innerWidth < 768; }

  function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
  }

  // ── DOM refs ──
  const sidebar = $('#sidebar');
  const detailPanel = $('#detail-panel');
  const entriesList = $('#entries-list');
  const streakEl = $('#streak');
  const viewEntry = $('#view-entry');
  const viewMood = $('#view-mood');
  const viewMoodLabel = $('#view-mood-label');
  const viewDate = $('#view-date');
  const viewTitle = $('#view-title');
  const viewText = $('#view-text');
  const viewPin = $('#view-pin');
  const detailEmpty = $('#detail-empty');
  const todoDetailEmpty = $('#todo-detail-empty');
  const writeEntry = $('#write-entry');
  const writeHeading = $('#write-heading');
  const entryTitle = $('#entry-title');
  const entryText = $('#entry-text');
  const moodGrid = $('#mood-grid');
  const moodError = $('#mood-error');
  const promptBtn = $('#btn-prompt');
  const promptText = $('#prompt-text');
  const wordCount = $('#word-count');
  const deleteModal = $('#delete-modal');
  const modalText = $('#modal-text');
  const modalConfirm = $('#modal-confirm');
  const searchInput = $('#search-input');
  const searchClear = $('#search-clear');
  const themeBtn = $('#btn-theme'); // may be null if removed from header
  const menuBtn = $('#btn-menu');
  const settingsDropdown = $('#settings-dropdown');
  const importFile = $('#import-file');
  const calendarView = $('#calendar-view');
  const calMonthYear = $('#cal-month-year');
  const calDays = $('#cal-days');
  const journalSidebar = $('#journal-sidebar');
  const todoSidebar = $('#todo-sidebar');
  const todoList = $('#todo-list');
  const todoEditView = $('#todo-edit-view');
  const fabBtn = $('#fab-new-entry');

  // ── Today DOM refs ──
  const todayDashboard = $('#today-dashboard');
  const todaySidebar = $('#today-sidebar');
  const manageHabitsView = $('#manage-habits-view');
  const habitFormView = $('#habit-form-view');
  const stickyFormView = $('#sticky-form-view');
  const goalsSidebar = $('#goals-sidebar');
  const goalsList = $('#goals-list');
  const goalDetailView = $('#goal-detail-view');
  const goalFormView = $('#goal-form-view');
  const goalsDetailEmpty = $('#goals-detail-empty');
  const checkinDetailView = $('#checkin-detail-view');
  const checkinFormView = $('#checkin-form-view');
  const lifescoreFormView = $('#lifescore-form-view');
  const lessonsEditView = $('#lessons-edit-view');

  // ── Storage ──
  function loadEntries() {
    try { entries = JSON.parse(localStorage.getItem(JOURNAL_KEY)) || []; } catch { entries = []; }
  }
  function saveEntries() { localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries)); }

  function loadTodos() {
    try { todos = JSON.parse(localStorage.getItem(TODOS_KEY)) || []; } catch { todos = []; }
  }
  function saveTodos() { localStorage.setItem(TODOS_KEY, JSON.stringify(todos)); }

  function loadHabits() {
    try { habits = JSON.parse(localStorage.getItem(HABITS_KEY)) || []; } catch { habits = []; }
  }
  function saveHabits() { localStorage.setItem(HABITS_KEY, JSON.stringify(habits)); }

  function loadHabitLog() {
    try { habitLog = JSON.parse(localStorage.getItem(HABIT_LOG_KEY)) || {}; } catch { habitLog = {}; }
  }
  function saveHabitLog() { localStorage.setItem(HABIT_LOG_KEY, JSON.stringify(habitLog)); }

  function loadStickies() {
    try { stickies = JSON.parse(localStorage.getItem(STICKIES_KEY)) || []; } catch { stickies = []; }
  }
  function saveStickies() { localStorage.setItem(STICKIES_KEY, JSON.stringify(stickies)); }

  function loadGoals() {
    try { goals = JSON.parse(localStorage.getItem(GOALS_KEY)) || []; } catch { goals = []; }
  }
  function saveGoals() { localStorage.setItem(GOALS_KEY, JSON.stringify(goals)); }

  function loadReflections() {
    try { reflections = JSON.parse(localStorage.getItem(REFLECTIONS_KEY)) || []; } catch { reflections = []; }
  }
  function saveReflections() { localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections)); }

  function loadLifeScores() {
    try { lifeScores = JSON.parse(localStorage.getItem(LIFE_SCORES_KEY)) || []; } catch { lifeScores = []; }
  }
  function saveLifeScores() { localStorage.setItem(LIFE_SCORES_KEY, JSON.stringify(lifeScores)); }

  function loadLessons() {
    try { lessons = JSON.parse(localStorage.getItem(LESSONS_KEY)) || []; } catch { lessons = []; }
  }
  function saveLessons() { localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons)); }

  function loadGoalFilter() {
    try {
      const saved = JSON.parse(localStorage.getItem(GOALS_FILTER_KEY));
      if (saved) { goalStatusFilter = saved.status || 'all'; goalSort = saved.sort || 'date'; }
    } catch {}
  }
  function saveGoalFilter() {
    localStorage.setItem(GOALS_FILTER_KEY, JSON.stringify({ status: goalStatusFilter, sort: goalSort }));
  }

  function loadCategories() {
    try {
      const saved = JSON.parse(localStorage.getItem(CATEGORIES_KEY));
      if (saved && saved.length) {
        categories = saved;
        DEFAULT_CATEGORIES.forEach(dc => {
          if (!categories.find(c => c.id === dc.id)) categories.push(dc);
        });
      } else {
        categories = [...DEFAULT_CATEGORIES];
      }
    } catch {
      categories = [...DEFAULT_CATEGORIES];
    }
  }
  function saveCategories() { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)); }

  function loadSort() {
    const s = localStorage.getItem(SORT_KEY);
    if (s) todoSort = s;
  }

  // ── Theme ──
  const themeRailIcon = document.querySelector('#btn-theme-rail .theme-icon');

  function setThemeIcons(icon) {
    if (themeBtn) themeBtn.textContent = icon;
    if (themeRailIcon) themeRailIcon.textContent = icon;
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setThemeIcons('🌙');
    } else {
      document.documentElement.removeAttribute('data-theme');
      setThemeIcons('☀️');
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'light');
      setThemeIcons('☀️');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(THEME_KEY, 'dark');
      setThemeIcons('🌙');
    }
  }

  // ── Streak ──
  function calcStreak() {
    if (entries.length === 0) return 0;
    const daySet = new Set();
    entries.forEach(e => {
      const d = new Date(e.date);
      daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    let streak = 0;
    const now = new Date();
    let check = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayKey = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (!daySet.has(todayKey)) {
      check.setDate(check.getDate() - 1);
      const yesterdayKey = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if (!daySet.has(yesterdayKey)) return 0;
    }
    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if (daySet.has(key)) { streak++; check.setDate(check.getDate() - 1); }
      else break;
    }
    return streak;
  }

  function renderStreak() {
    streakEl.textContent = `🔥 ${calcStreak()}-day streak`;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function updateWordCount() {
    const text = entryText.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = `${count} word${count !== 1 ? 's' : ''}`;
  }

  // ══════════════════════════════════════
  //  NAVIGATION
  // ══════════════════════════════════════

  function switchFeature(feature) {
    currentFeature = feature;

    $$('.nav-rail-item[data-feature]').forEach(t => t.classList.toggle('active', t.dataset.feature === feature));
    $$('.bottom-nav-item').forEach(t => t.classList.toggle('active', t.dataset.feature === feature));

    $('#today-header').classList.toggle('hidden', feature !== 'today');
    $('#journal-header').classList.toggle('hidden', feature !== 'journal');
    $('#todo-header').classList.toggle('hidden', feature !== 'todo');
    $('#goals-header').classList.toggle('hidden', feature !== 'goals');

    todaySidebar.classList.toggle('hidden', feature !== 'today');
    journalSidebar.classList.toggle('hidden', feature !== 'journal');
    todoSidebar.classList.toggle('hidden', feature !== 'todo');
    goalsSidebar.classList.toggle('hidden', feature !== 'goals');

    if (fabBtn) fabBtn.classList.toggle('hidden', feature !== 'journal');

    viewEntry.classList.add('hidden');
    writeEntry.classList.add('hidden');
    todoEditView.classList.add('hidden');
    manageHabitsView.classList.add('hidden');
    habitFormView.classList.add('hidden');
    stickyFormView.classList.add('hidden');
    goalDetailView.classList.add('hidden');
    goalFormView.classList.add('hidden');
    checkinDetailView.classList.add('hidden');
    checkinFormView.classList.add('hidden');
    lifescoreFormView.classList.add('hidden');
    lessonsEditView.classList.add('hidden');

    if (feature === 'today') {
      detailEmpty.classList.add('hidden');
      todoDetailEmpty.classList.add('hidden');
      goalsDetailEmpty.classList.add('hidden');
      todayDashboard.classList.remove('hidden');
      renderTodayDashboard();
      renderTodaySidebarHabits();
    } else if (feature === 'journal') {
      todayDashboard.classList.add('hidden');
      todoDetailEmpty.classList.add('hidden');
      goalsDetailEmpty.classList.add('hidden');
      currentEntryId = null;
      if (journalMode === 'entries') {
        detailEmpty.classList.remove('hidden');
        renderEntries();
      } else {
        detailEmpty.classList.add('hidden');
        switchReflectSection(reflectSection);
      }
    } else if (feature === 'todo') {
      todayDashboard.classList.add('hidden');
      detailEmpty.classList.add('hidden');
      todoDetailEmpty.classList.remove('hidden');
      goalsDetailEmpty.classList.add('hidden');
      currentTodoId = null;
      renderTodos();
      renderTodoCategoryFilters();
    } else if (feature === 'goals') {
      todayDashboard.classList.add('hidden');
      detailEmpty.classList.add('hidden');
      todoDetailEmpty.classList.add('hidden');
      goalsDetailEmpty.classList.remove('hidden');
      currentGoalId = null;
      renderGoals();
      renderGoalCategoryFilters();
    }

    if (isMobile()) {
      if (feature === 'today') {
        sidebar.classList.remove('active');
        detailPanel.classList.add('active');
      } else {
        sidebar.classList.add('active');
        detailPanel.classList.remove('active');
      }
    }
  }

  // ══════════════════════════════════════
  //  JOURNAL
  // ══════════════════════════════════════

  function getFilteredEntries() {
    let filtered = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (currentFilter === 'pinned') filtered = filtered.filter(e => e.pinned);
    else if (currentFilter !== 'all') filtered = filtered.filter(e => e.mood === currentFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.text && e.text.toLowerCase().includes(q))
      );
    }
    if (selectedCalDate) {
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === selectedCalDate.getFullYear() &&
               d.getMonth() === selectedCalDate.getMonth() &&
               d.getDate() === selectedCalDate.getDate();
      });
    }
    return filtered;
  }

  function renderEntries() {
    const filtered = getFilteredEntries();
    if (filtered.length === 0) {
      const msg = searchQuery ? 'No entries match your search.'
        : selectedCalDate ? 'No entries on this day.'
        : currentFilter === 'all' ? 'No entries yet. Tap + New Entry to start!'
        : 'No entries match this filter.';
      entriesList.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><p>${msg}</p></div>`;
      return;
    }
    entriesList.innerHTML = filtered.map(e => `
      <div class="entry-card${e.id === currentEntryId ? ' active' : ''}" data-id="${e.id}">
        <div class="card-top">
          <span class="card-mood">${e.mood}</span>
          <span class="card-date">${formatDate(e.date)}</span>
          ${e.pinned ? '<span class="card-pin">★</span>' : ''}
        </div>
        ${e.title ? `<div class="card-title">${escapeHtml(e.title)}</div>` : ''}
        <div class="card-preview">${escapeHtml(e.text)}</div>
      </div>
    `).join('');
  }

  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    calMonthYear.textContent = `${monthNames[month]} ${year}`;
    const entryDays = new Set();
    entries.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) entryDays.add(d.getDate());
    });
    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    let html = '';
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-day other-month">${daysInPrev - firstDay + 1 + i}</div>`;
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const hasEntry = entryDays.has(day);
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      const isSelected = selectedCalDate && selectedCalDate.getFullYear() === year && selectedCalDate.getMonth() === month && selectedCalDate.getDate() === day;
      let cls = 'cal-day';
      if (hasEntry) cls += ' has-entry';
      if (isToday) cls += ' today';
      if (isSelected) cls += ' selected';
      html += `<div class="${cls}" data-day="${day}">${day}${hasEntry ? '<div class="cal-dot"></div>' : ''}</div>`;
    }
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) html += `<div class="cal-day other-month">${i}</div>`;
    calDays.innerHTML = html;
  }

  function showJournalHome() {
    if (isMobile()) {
      sidebar.classList.add('active');
      detailPanel.classList.remove('active');
    }
    viewEntry.classList.add('hidden');
    writeEntry.classList.add('hidden');
    todayDashboard.classList.add('hidden');
    checkinDetailView.classList.add('hidden');
    checkinFormView.classList.add('hidden');
    lifescoreFormView.classList.add('hidden');
    lessonsEditView.classList.add('hidden');
    detailEmpty.classList.remove('hidden');
    currentEntryId = null;
    editingEntryId = null;
    renderEntries();
    if (fabBtn && currentFeature === 'journal') fabBtn.classList.remove('hidden');
  }

  function showView(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    currentEntryId = id;
    editingEntryId = null;
    viewMood.textContent = entry.mood;
    viewMoodLabel.textContent = MOOD_LABELS[entry.mood] || '';
    viewDate.textContent = formatDate(entry.date);
    viewTitle.textContent = entry.title || '';
    viewTitle.classList.toggle('hidden', !entry.title);
    viewText.textContent = entry.text;
    viewPin.textContent = entry.pinned ? '★' : '☆';
    viewPin.classList.toggle('pinned', !!entry.pinned);
    todayDashboard.classList.add('hidden');
    detailEmpty.classList.add('hidden');
    writeEntry.classList.add('hidden');
    todoEditView.classList.add('hidden');
    viewEntry.classList.remove('hidden');
    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    if (fabBtn) fabBtn.classList.add('hidden');
    renderEntries();
  }

  function showWrite(editId) {
    editingEntryId = editId || null;
    selectedMood = null;
    moodError.classList.add('hidden');
    promptText.classList.add('hidden');
    moodGrid.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));
    if (editingEntryId) {
      const entry = entries.find(e => e.id === editingEntryId);
      if (!entry) return;
      writeHeading.textContent = 'Edit Entry';
      entryTitle.value = entry.title || '';
      entryText.value = entry.text || '';
      selectedMood = entry.mood;
      const moodBtn = moodGrid.querySelector(`[data-mood="${entry.mood}"]`);
      if (moodBtn) moodBtn.classList.add('selected');
    } else {
      writeHeading.textContent = 'New Entry';
      entryTitle.value = '';
      entryText.value = '';
    }
    updateWordCount();
    todayDashboard.classList.add('hidden');
    detailEmpty.classList.add('hidden');
    viewEntry.classList.add('hidden');
    todoEditView.classList.add('hidden');
    writeEntry.classList.remove('hidden');
    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    if (fabBtn) fabBtn.classList.add('hidden');
    entryTitle.focus();
  }

  function saveEntry() {
    if (!selectedMood) { moodError.classList.remove('hidden'); return; }
    const title = entryTitle.value.trim();
    const text = entryText.value.trim();
    if (editingEntryId) {
      const entry = entries.find(e => e.id === editingEntryId);
      if (entry) { entry.title = title; entry.mood = selectedMood; entry.text = text; }
      saveEntries(); renderStreak(); renderEntries();
      if (journalView === 'calendar') renderCalendar();
      showView(editingEntryId);
    } else {
      const newEntry = { id: uid(), title, mood: selectedMood, text, date: new Date().toISOString(), pinned: false };
      entries.push(newEntry);
      saveEntries(); renderStreak(); renderEntries();
      if (journalView === 'calendar') renderCalendar();
      showView(newEntry.id);
    }
  }

  function exportBackup() {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeboard-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported successfully');
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) { showToast('Invalid backup file'); return; }
        const existingIds = new Set(entries.map(en => en.id));
        let added = 0;
        imported.forEach(entry => {
          if (entry.id && !existingIds.has(entry.id)) { entries.push(entry); existingIds.add(entry.id); added++; }
        });
        saveEntries();
        renderStreak();
        renderEntries();
        if (journalView === 'calendar') renderCalendar();
        showToast(`${added} entr${added === 1 ? 'y' : 'ies'} imported`);
      } catch { showToast('Failed to read backup file'); }
    };
    reader.readAsText(file);
  }

  // ══════════════════════════════════════
  //  TODO
  // ══════════════════════════════════════

  function getCat(id) {
    return categories.find(c => c.id === id) || categories.find(c => c.id === 'other');
  }

  function smartDate(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    const diff = Math.floor((due - today) / 86400000);
    if (diff < 0) return { text: 'Overdue', cls: 'overdue' };
    if (diff === 0) return { text: 'Today', cls: 'today' };
    if (diff === 1) return { text: 'Tomorrow', cls: '' };
    return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: '' };
  }

  function getFilteredTodos() {
    let list = [...todos];

    if (todoStatusFilter === 'active') list = list.filter(t => !t.completed);
    else if (todoStatusFilter === 'completed') list = list.filter(t => t.completed);

    if (todoCategoryFilter !== 'all') list = list.filter(t => t.category === todoCategoryFilter);
    if (todoPriorityFilter !== 'all') list = list.filter(t => t.priority === todoPriorityFilter);

    const active = list.filter(t => !t.completed);
    const completed = list.filter(t => t.completed);

    const sortFn = (a, b) => {
      if (todoSort === 'due') {
        const aD = a.due || '9999-12-31';
        const bD = b.due || '9999-12-31';
        return aD.localeCompare(bD);
      }
      if (todoSort === 'priority') return (PRIORITY_ORDER[a.priority] || 1) - (PRIORITY_ORDER[b.priority] || 1);
      if (todoSort === 'newest') return new Date(b.created) - new Date(a.created);
      if (todoSort === 'alpha') return (a.name || '').localeCompare(b.name || '');
      return 0;
    };

    active.sort(sortFn);
    completed.sort(sortFn);

    return { active, completed };
  }

  function renderTodoProgress() {
    const total = todos.length;
    const done = todos.filter(t => t.completed).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    $('#todo-progress-text').textContent = `${done} of ${total} task${total !== 1 ? 's' : ''} completed`;
    $('#todo-progress-pct').textContent = `${pct}%`;
    $('#todo-progress-fill').style.width = `${pct}%`;
  }

  function renderTodoCategoryFilters() {
    const container = $('#todo-category-filters');
    let html = '';
    categories.forEach(c => {
      html += `<button class="todo-chip${todoCategoryFilter === c.id ? ' active' : ''}" data-tfilter="category" data-value="${c.id}"><span class="cat-dot" style="background:${c.color}"></span>${escapeHtml(c.name)}</button>`;
    });
    container.innerHTML = html;
  }

  function renderTodos() {
    const { active, completed } = getFilteredTodos();
    renderTodoProgress();

    const hasDone = todos.some(t => t.completed);
    $('#todo-clear-wrap').classList.toggle('hidden', !hasDone);
    $('#btn-clear-header').classList.toggle('hidden', !hasDone);

    if (active.length === 0 && completed.length === 0) {
      const msg = (todoStatusFilter !== 'all' || todoCategoryFilter !== 'all' || todoPriorityFilter !== 'all')
        ? 'No tasks match these filters.'
        : 'No tasks yet. Add one above!';
      todoList.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><p>${msg}</p></div>`;
      return;
    }

    let html = '';
    const renderCard = (t) => {
      const cat = getCat(t.category);
      const dueInfo = smartDate(t.due);
      return `
        <div class="task-card${t.completed ? ' completed' : ''}${t.id === currentTodoId ? ' active' : ''}" data-tid="${t.id}">
          <div class="task-card-row">
            <div class="task-checkbox priority-${t.priority}${t.completed ? ' checked' : ''}" data-tid="${t.id}">${t.completed ? '✓' : ''}</div>
            <div class="task-card-body">
              <div class="task-name">${escapeHtml(t.name)}</div>
              <div class="task-meta">
                <span class="task-priority-tag ${t.priority}">${t.priority}</span>
                <span class="task-category-tag"><span class="cat-dot" style="background:${cat.color}"></span>${escapeHtml(cat.name)}</span>
                ${dueInfo ? `<span class="task-due ${dueInfo.cls}">${dueInfo.text}</span>` : ''}
              </div>
            </div>
            <button class="task-delete-btn" data-tid="${t.id}" aria-label="Delete task">🗑</button>
          </div>
        </div>`;
    };

    active.forEach(t => html += renderCard(t));
    if (completed.length > 0 && todoStatusFilter !== 'completed') {
      if (active.length > 0) html += `<div class="completed-label">Completed</div>`;
      completed.forEach(t => html += renderCard(t));
    }
    todoList.innerHTML = html;
  }

  function renderCategoryPicker() {
    const container = $('#todo-category-picker');
    container.innerHTML = categories.map(c => `
      <button class="cat-pick-btn${selectedCategory === c.id ? ' selected' : ''}" data-catid="${c.id}">
        <span class="cat-dot" style="background:${c.color}"></span>${escapeHtml(c.name)}${!c.builtin ? '<span class="cat-edit-icon">✕</span>' : ''}
      </button>
    `).join('');
  }

  function showTodoHome() {
    if (isMobile()) { sidebar.classList.add('active'); detailPanel.classList.remove('active'); }
    todayDashboard.classList.add('hidden');
    todoEditView.classList.add('hidden');
    viewEntry.classList.add('hidden');
    writeEntry.classList.add('hidden');
    todoDetailEmpty.classList.remove('hidden');
    currentTodoId = null;
    editingTodoId = null;
    renderTodos();
  }

  function showTodoForm(editId) {
    editingTodoId = editId || null;
    const nameInput = $('#todo-name');
    const noteInput = $('#todo-note');
    const dueInput = $('#todo-due');
    const heading = $('#todo-form-heading');
    const nameError = $('#todo-name-error');
    nameError.classList.add('hidden');

    $$('.priority-btn').forEach(b => b.classList.remove('selected'));

    if (editingTodoId) {
      const task = todos.find(t => t.id === editingTodoId);
      if (!task) return;
      heading.textContent = 'Edit Task';
      nameInput.value = task.name;
      noteInput.value = task.note || '';
      dueInput.value = task.due || '';
      selectedPriority = task.priority || 'medium';
      selectedCategory = task.category || 'personal';
    } else {
      heading.textContent = 'New Task';
      nameInput.value = '';
      noteInput.value = '';
      dueInput.value = '';
      selectedPriority = 'medium';
      selectedCategory = 'personal';
    }

    const priBtn = $(`.priority-btn[data-priority="${selectedPriority}"]`);
    if (priBtn) priBtn.classList.add('selected');

    $('#btn-todo-delete-top').classList.toggle('hidden', !editingTodoId);

    renderCategoryPicker();

    todayDashboard.classList.add('hidden');
    detailEmpty.classList.add('hidden');
    todoDetailEmpty.classList.add('hidden');
    viewEntry.classList.add('hidden');
    writeEntry.classList.add('hidden');
    todoEditView.classList.remove('hidden');

    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    nameInput.focus();
  }

  function saveTodo() {
    const nameInput = $('#todo-name');
    const noteInput = $('#todo-note');
    const dueInput = $('#todo-due');
    const nameError = $('#todo-name-error');
    const name = nameInput.value.trim();
    if (!name) { nameError.classList.remove('hidden'); return; }
    nameError.classList.add('hidden');

    if (editingTodoId) {
      const task = todos.find(t => t.id === editingTodoId);
      if (task) {
        task.name = name;
        task.note = noteInput.value.trim();
        task.priority = selectedPriority;
        task.due = dueInput.value;
        task.category = selectedCategory;
      }
    } else {
      todos.push({
        id: uid(), name,
        note: noteInput.value.trim(),
        priority: selectedPriority,
        due: dueInput.value,
        category: selectedCategory,
        completed: false,
        created: new Date().toISOString()
      });
    }
    saveTodos();
    renderTodos();
    renderTodoCategoryFilters();
    showTodoHome();
  }

  function promptClearCompleted() {
    deleteMode = 'todo-clear';
    modalText.textContent = 'Remove all completed tasks?';
    modalConfirm.textContent = 'Clear';
    deleteModal.classList.remove('hidden');
  }

  // ══════════════════════════════════════
  //  TODAY DASHBOARD
  // ══════════════════════════════════════

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function isHabitScheduledOn(habit, date) {
    const dow = date.getDay();
    if (habit.freq === 'daily') return true;
    if (habit.freq === 'weekdays') return dow >= 1 && dow <= 5;
    if (habit.freq === 'custom') return (habit.days || []).includes(dow);
    return true;
  }

  function getHabitStreak(habit) {
    let streak = 0;
    const d = new Date();
    d.setHours(0,0,0,0);
    const tk = todayKey();
    const todayScheduled = isHabitScheduledOn(habit, d);
    const todayDone = (habitLog[tk] || []).includes(habit.id);
    if (todayScheduled && !todayDone) {
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const key = dateKey(d);
      if (!isHabitScheduledOn(habit, d)) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      if ((habitLog[key] || []).includes(habit.id)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
      if (streak > 365) break;
    }
    return streak;
  }

  function getHabitWeekGrid(habit) {
    const result = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const tk = todayKey();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const scheduled = isHabitScheduledOn(habit, d);
      const done = (habitLog[key] || []).includes(habit.id);
      if (!scheduled) result.push('not-scheduled');
      else if (done) result.push('done');
      else if (i === 0) result.push('today-pending');
      else result.push('missed');
    }
    return result;
  }

  function getTodaysHabits() {
    const today = new Date();
    return habits.filter(h => isHabitScheduledOn(h, today));
  }

  function toggleHabitDone(habitId) {
    const tk = todayKey();
    if (!habitLog[tk]) habitLog[tk] = [];
    const idx = habitLog[tk].indexOf(habitId);
    if (idx >= 0) habitLog[tk].splice(idx, 1);
    else habitLog[tk].push(habitId);
    saveHabitLog();
  }

  function renderTodaySidebarHabits() {
    const todaysHabits = getTodaysHabits();
    const tk = todayKey();
    const done = todaysHabits.filter(h => (habitLog[tk] || []).includes(h.id)).length;
    const total = todaysHabits.length;
    const pct = total ? Math.round(done / total * 100) : 0;
    $('#today-habit-progress-text').textContent = `${done} of ${total} done`;
    $('#today-habit-progress-pct').textContent = `${pct}%`;
    $('#today-habit-progress-fill').style.width = `${pct}%`;
    $('#streak-today').textContent = `🔥 ${calcStreak()}-day streak`;

    const list = $('#today-habits-list');
    if (todaysHabits.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>No habits yet. Tap Manage to add one.</p></div>';
      return;
    }
    list.innerHTML = todaysHabits.map(h => {
      const isDone = (habitLog[tk] || []).includes(h.id);
      const streak = getHabitStreak(h);
      const week = getHabitWeekGrid(h);
      return `
        <div class="habit-check-card${isDone ? ' done' : ''}" data-hid="${h.id}">
          <div class="habit-checkbox${isDone ? ' checked' : ''}" data-hid="${h.id}">${isDone ? '✓' : ''}</div>
          <span class="habit-card-emoji">${h.emoji}</span>
          <div class="habit-card-body">
            <div class="habit-card-name">${escapeHtml(h.name)}</div>
            <div class="habit-card-meta">
              <span class="habit-streak">🔥 ${streak} days</span>
              <div class="habit-week-grid">${week.map(s => `<div class="habit-week-dot ${s}"></div>`).join('')}</div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderTodayDashboard() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    $('#today-greeting').textContent = `${greeting}, Jann`;
    $('#today-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const streak = calcStreak();
    $('#today-streak-text').textContent = `${streak}-day journal streak`;
    const hasJournaledToday = entries.some(e => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    });
    $('#today-streak-nudge').textContent = hasJournaledToday ? 'Great job today!' : 'Write today to keep it going!';

    const tk = todayKey();
    const todaysHabits = getTodaysHabits();
    const habitsDone = todaysHabits.filter(h => (habitLog[tk] || []).includes(h.id)).length;
    $('#today-habits-count').textContent = `${habitsDone}/${todaysHabits.length}`;

    renderDashboardHabits();
    renderTodayReminders();
    renderTodayGoals();
    renderDashboardReflection();
    renderTodayTasks();
  }

  function renderDashboardHabits() {
    const list = $('#today-dashboard-habits-list');
    if (!list) return;
    const todaysHabits = getTodaysHabits();
    const tk = todayKey();
    if (todaysHabits.length === 0) {
      list.innerHTML = '<p class="today-reminders-empty">No habits yet. Tap Manage to add one.</p>';
      return;
    }
    list.innerHTML = todaysHabits.map(h => {
      const isDone = (habitLog[tk] || []).includes(h.id);
      const streak = getHabitStreak(h);
      return `
        <div class="habit-check-card${isDone ? ' done' : ''}" data-hid="${h.id}">
          <div class="habit-checkbox${isDone ? ' checked' : ''}" data-hid="${h.id}">${isDone ? '✓' : ''}</div>
          <span class="habit-card-emoji">${h.emoji}</span>
          <div class="habit-card-body">
            <div class="habit-card-name">${escapeHtml(h.name)}</div>
            <div class="habit-card-meta">
              <span class="habit-streak">🔥 ${streak} days</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderTodayReminders() {
    const container = $('#today-reminders');
    if (stickies.length === 0) {
      container.innerHTML = '<p class="today-reminders-empty">No reminders yet. Tap + to add one.</p>';
      return;
    }
    container.innerHTML = stickies.map(s => `
      <div class="sticky-card color-${s.color}" data-sid="${s.id}">
        <div class="sticky-card-text">${escapeHtml(s.text)}</div>
      </div>
    `).join('');
  }

  function renderTodayTasks() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeTodos = todos.filter(t => !t.completed);

    let overdue = 0, dueToday = 0, dueTomorrow = 0;
    const pendingTasks = [];

    activeTodos.forEach(t => {
      if (!t.due) return;
      const due = new Date(t.due + 'T00:00:00');
      const diff = Math.floor((due - today) / 86400000);
      if (diff < 0) { overdue++; pendingTasks.push({ ...t, dueLabel: 'Overdue', dueCls: 'overdue' }); }
      else if (diff === 0) { dueToday++; pendingTasks.push({ ...t, dueLabel: 'Today', dueCls: 'today' }); }
      else if (diff === 1) { dueTomorrow++; pendingTasks.push({ ...t, dueLabel: 'Tomorrow', dueCls: 'tomorrow' }); }
    });

    $('#today-task-stats').innerHTML = `
      <div class="today-stat-card overdue"><span class="today-stat-number">${overdue}</span><span class="today-stat-label">Overdue</span></div>
      <div class="today-stat-card due-today"><span class="today-stat-number">${dueToday}</span><span class="today-stat-label">Due Today</span></div>
      <div class="today-stat-card tomorrow"><span class="today-stat-number">${dueTomorrow}</span><span class="today-stat-label">Tomorrow</span></div>
    `;

    const tasksContainer = $('#today-pending-tasks');
    if (pendingTasks.length === 0) {
      tasksContainer.innerHTML = '<div class="today-tasks-clear">All clear! No tasks due today.</div>';
      return;
    }
    tasksContainer.innerHTML = pendingTasks.map(t => {
      const cat = getCat(t.category);
      return `<div class="today-task-row" data-tid="${t.id}">
        <span class="today-task-dot" style="background:${cat.color}"></span>
        <span class="today-task-name">${escapeHtml(t.name)}</span>
        <span class="today-task-due ${t.dueCls}">${t.dueLabel}</span>
      </div>`;
    }).join('');
  }

  function showTodayHome() {
    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    manageHabitsView.classList.add('hidden');
    habitFormView.classList.add('hidden');
    stickyFormView.classList.add('hidden');
    todayDashboard.classList.remove('hidden');
    renderTodayDashboard();
    renderTodaySidebarHabits();
  }

  function showManageHabits() {
    todayDashboard.classList.add('hidden');
    habitFormView.classList.add('hidden');
    stickyFormView.classList.add('hidden');
    manageHabitsView.classList.remove('hidden');
    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    renderManageHabits();
  }

  function renderManageHabits() {
    const list = $('#manage-habits-list');
    if (habits.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>No habits yet. Add your first one!</p></div>';
      return;
    }
    const freqLabels = { daily: 'Every day', weekdays: 'Weekdays', custom: '' };
    list.innerHTML = habits.map((h, i) => {
      let freqText = freqLabels[h.freq] || '';
      if (h.freq === 'custom' && h.days) {
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        freqText = h.days.map(d => dayNames[d]).join(' · ');
      }
      const streak = getHabitStreak(h);
      return `
        <div class="manage-habit-card" data-hid="${h.id}">
          <div class="manage-habit-reorder">
            <button data-dir="up" data-idx="${i}" ${i === 0 ? 'disabled' : ''}>▲</button>
            <button data-dir="down" data-idx="${i}" ${i === habits.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
          <span class="manage-habit-emoji">${h.emoji}</span>
          <div class="manage-habit-info">
            <div class="manage-habit-name">${escapeHtml(h.name)}</div>
            <div><span class="manage-habit-freq">${freqText}</span><span class="manage-habit-streak">🔥 ${streak} days</span></div>
          </div>
          <div class="manage-habit-actions">
            <button class="habit-edit-btn" data-hid="${h.id}">✏️</button>
            <button class="habit-delete-btn" data-hid="${h.id}">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  function showHabitForm(editId) {
    editingHabitId = editId || null;
    const nameInput = $('#habit-name');
    const nameError = $('#habit-name-error');
    const heading = $('#habit-form-heading');
    const customEmoji = $('#habit-custom-emoji');
    nameError.classList.add('hidden');

    if (editingHabitId) {
      const h = habits.find(x => x.id === editingHabitId);
      if (!h) return;
      heading.textContent = 'Edit Habit';
      nameInput.value = h.name;
      selectedHabitEmoji = h.emoji;
      selectedHabitFreq = h.freq;
      if (h.freq === 'custom' && h.days) {
        $$('#habit-custom-days input').forEach(cb => { cb.checked = h.days.includes(parseInt(cb.value)); });
      }
    } else {
      heading.textContent = 'New Habit';
      nameInput.value = '';
      selectedHabitEmoji = '📖';
      selectedHabitFreq = 'daily';
      customEmoji.value = '';
    }

    $$('#habit-emoji-picker .habit-emoji-btn').forEach(b => b.classList.toggle('selected', b.dataset.emoji === selectedHabitEmoji));
    $$('#habit-freq-picker .priority-btn').forEach(b => b.classList.toggle('selected', b.dataset.freq === selectedHabitFreq));
    $('#habit-custom-days').classList.toggle('hidden', selectedHabitFreq !== 'custom');

    todayDashboard.classList.add('hidden');
    manageHabitsView.classList.add('hidden');
    stickyFormView.classList.add('hidden');
    habitFormView.classList.remove('hidden');
    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    nameInput.focus();
  }

  function saveHabit() {
    const name = $('#habit-name').value.trim();
    if (!name) { $('#habit-name-error').classList.remove('hidden'); return; }
    const customEmoji = $('#habit-custom-emoji').value.trim();
    const emoji = customEmoji || selectedHabitEmoji;
    let days = [];
    if (selectedHabitFreq === 'custom') {
      $$('#habit-custom-days input:checked').forEach(cb => days.push(parseInt(cb.value)));
    }

    if (editingHabitId) {
      const h = habits.find(x => x.id === editingHabitId);
      if (h) { h.name = name; h.emoji = emoji; h.freq = selectedHabitFreq; h.days = days; }
    } else {
      habits.push({ id: uid(), name, emoji, freq: selectedHabitFreq, days });
    }
    saveHabits();
    showManageHabits();
  }

  function showStickyForm(editId) {
    editingStickyId = editId || null;
    const textInput = $('#sticky-text');
    const textError = $('#sticky-text-error');
    const heading = $('#sticky-form-heading');
    textError.classList.add('hidden');

    if (editingStickyId) {
      const s = stickies.find(x => x.id === editingStickyId);
      if (!s) return;
      heading.textContent = 'Edit Reminder';
      textInput.value = s.text;
      selectedStickyColor = s.color;
    } else {
      heading.textContent = 'New Reminder';
      textInput.value = '';
      selectedStickyColor = 'green';
    }

    $$('.sticky-color-btn').forEach(b => b.classList.toggle('selected', b.dataset.color === selectedStickyColor));
    $('#btn-sticky-delete-top').classList.toggle('hidden', !editingStickyId);

    todayDashboard.classList.add('hidden');
    manageHabitsView.classList.add('hidden');
    habitFormView.classList.add('hidden');
    stickyFormView.classList.remove('hidden');
    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    textInput.focus();
  }

  function saveSticky() {
    const text = $('#sticky-text').value.trim();
    if (!text) { $('#sticky-text-error').classList.remove('hidden'); return; }

    if (editingStickyId) {
      const s = stickies.find(x => x.id === editingStickyId);
      if (s) { s.text = text; s.color = selectedStickyColor; }
    } else {
      stickies.push({ id: uid(), text, color: selectedStickyColor });
    }
    saveStickies();
    showTodayHome();
  }

  // ══════════════════════════════════════
  //  GOALS
  // ══════════════════════════════════════

  function getGoalProgress(goal) {
    if (goal.milestones && goal.milestones.length > 0) {
      const done = goal.milestones.filter(m => m.completed).length;
      return Math.round(done / goal.milestones.length * 100);
    }
    return goal.manualProgress || 0;
  }

  function getGoalDeadlineInfo(goal) {
    if (!goal.targetDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(goal.targetDate + 'T00:00:00');
    const diff = Math.floor((target - today) / 86400000);
    if (goal.status === 'completed') {
      return { text: 'Completed ' + target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: '' };
    }
    if (diff < 0) return { text: 'Overdue: ' + target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: 'overdue' };
    if (diff === 0) return { text: 'Due today', cls: 'today' };
    if (diff <= 7) return { text: diff + ' day' + (diff > 1 ? 's' : '') + ' left', cls: 'soon' };
    return { text: target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), cls: '' };
  }

  function getFilteredGoals() {
    let list = [...goals];
    if (goalStatusFilter === 'active') list = list.filter(g => g.status === 'active');
    else if (goalStatusFilter === 'completed') list = list.filter(g => g.status === 'completed');
    else if (goalStatusFilter === 'paused') list = list.filter(g => g.status === 'paused');
    if (goalCategoryFilter !== 'all') list = list.filter(g => g.category === goalCategoryFilter);

    list.sort((a, b) => {
      if (goalSort === 'date') {
        const aD = a.targetDate || '9999-12-31';
        const bD = b.targetDate || '9999-12-31';
        return aD.localeCompare(bD);
      }
      if (goalSort === 'progress') return getGoalProgress(b) - getGoalProgress(a);
      if (goalSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });
    return list;
  }

  function renderGoalSummary() {
    const active = goals.filter(g => g.status === 'active').length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const parts = [];
    if (active) parts.push(active + ' active');
    if (completed) parts.push(completed + ' completed');
    const text = parts.length ? parts.join(' · ') : 'No goals yet';
    $('#goals-summary-text').textContent = text;
    const subtitleEl = $('#goals-subtitle');
    if (subtitleEl) subtitleEl.textContent = text;
  }

  function renderGoalCategoryFilters() {
    const container = $('#goal-category-filters');
    let html = '';
    categories.forEach(c => {
      html += `<button class="todo-chip${goalCategoryFilter === c.id ? ' active' : ''}" data-gfilter="category" data-value="${c.id}"><span class="cat-dot" style="background:${c.color}"></span>${escapeHtml(c.name)}</button>`;
    });
    container.innerHTML = html;
  }

  function renderGoals() {
    const filtered = getFilteredGoals();
    renderGoalSummary();

    if (filtered.length === 0) {
      const msg = (goalStatusFilter !== 'all' || goalCategoryFilter !== 'all')
        ? 'No goals match these filters.'
        : 'No goals yet. Tap + to set your first goal!';
      goalsList.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>${msg}</p></div>`;
      return;
    }

    goalsList.innerHTML = filtered.map(g => {
      const cat = getCat(g.category);
      const pct = getGoalProgress(g);
      const deadline = getGoalDeadlineInfo(g);
      const hasMilestones = g.milestones && g.milestones.length > 0;
      const doneCount = hasMilestones ? g.milestones.filter(m => m.completed).length : 0;
      const totalCount = hasMilestones ? g.milestones.length : 0;
      const statusLabel = g.status === 'completed' ? 'Done 🎉' : g.status === 'paused' ? 'Paused' : 'Active';
      return `
        <div class="goal-card${g.status === 'completed' ? ' completed' : ''}${g.id === currentGoalId ? ' active' : ''}" data-gid="${g.id}">
          <div class="goal-card-top">
            <span class="goal-card-emoji">${g.emoji}</span>
            <div class="goal-card-body">
              <div class="goal-card-title">${escapeHtml(g.title)}</div>
              <div class="goal-card-meta">
                <span class="task-category-tag"><span class="cat-dot" style="background:${cat.color}"></span>${escapeHtml(cat.name)}</span>
                ${deadline ? `<span class="goal-deadline-tag ${deadline.cls}">${deadline.text}</span>` : ''}
              </div>
            </div>
            <span class="goal-status-badge ${g.status}">${statusLabel}</span>
          </div>
          <div class="goal-card-progress">
            <span class="goal-progress-label">${hasMilestones ? doneCount + ' of ' + totalCount + ' milestones' : 'Manual progress'}</span>
            <span class="goal-progress-pct">${pct}%</span>
          </div>
          <div class="progress-bar-track goal-progress-track">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');
  }

  function showGoalsHome() {
    if (isMobile()) { sidebar.classList.add('active'); detailPanel.classList.remove('active'); }
    goalDetailView.classList.add('hidden');
    goalFormView.classList.add('hidden');
    todayDashboard.classList.add('hidden');
    goalsDetailEmpty.classList.remove('hidden');
    currentGoalId = null;
    editingGoalId = null;
    renderGoals();
  }

  function showGoalDetail(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    currentGoalId = goalId;
    const cat = getCat(goal.category);
    const pct = getGoalProgress(goal);
    const deadline = getGoalDeadlineInfo(goal);
    const hasMilestones = goal.milestones && goal.milestones.length > 0;

    $('#goal-detail-emoji').textContent = goal.emoji;
    $('#goal-detail-title').textContent = goal.title;

    const statusEl = $('#goal-detail-status');
    statusEl.className = 'goal-status-badge ' + goal.status;
    statusEl.textContent = goal.status === 'completed' ? 'Done 🎉' : goal.status === 'paused' ? 'Paused' : 'Active';

    $('#goal-detail-cat-dot').style.background = cat.color;
    $('#goal-detail-cat-name').textContent = cat.name;

    const deadlineEl = $('#goal-detail-deadline');
    if (deadline) {
      deadlineEl.textContent = deadline.text;
      deadlineEl.className = 'goal-detail-deadline ' + deadline.cls;
    } else {
      deadlineEl.textContent = '';
    }

    const descEl = $('#goal-detail-desc');
    descEl.textContent = goal.description || '';
    descEl.classList.toggle('hidden', !goal.description);

    $('#goal-detail-progress-pct').textContent = pct + '%';
    $('#goal-detail-progress-fill').style.width = pct + '%';

    if (hasMilestones) {
      const done = goal.milestones.filter(m => m.completed).length;
      $('#goal-detail-progress-text').textContent = 'Progress';
      $('#goal-detail-milestone-count').textContent = done + ' of ' + goal.milestones.length + ' milestones completed';
    } else {
      $('#goal-detail-progress-text').textContent = 'Manual progress';
      $('#goal-detail-milestone-count').textContent = '';
    }

    const milestonesSection = $('#goal-detail-milestones');
    const milestoneList = $('#goal-milestone-list');
    if (hasMilestones) {
      milestonesSection.classList.remove('hidden');
      milestoneList.innerHTML = goal.milestones.map(m => `
        <div class="milestone-card${m.completed ? ' completed' : ''}" data-mid="${m.id}" data-gid="${goalId}">
          <div class="milestone-checkbox${m.completed ? ' checked' : ''}" data-mid="${m.id}" data-gid="${goalId}">${m.completed ? '✓' : ''}</div>
          <span class="milestone-name">${escapeHtml(m.name)}</span>
        </div>
      `).join('');
    } else {
      milestonesSection.classList.add('hidden');
    }

    todayDashboard.classList.add('hidden');
    goalsDetailEmpty.classList.add('hidden');
    goalFormView.classList.add('hidden');
    goalDetailView.classList.remove('hidden');
    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    renderGoals();
  }

  function showGoalForm(editId) {
    editingGoalId = editId || null;
    const titleInput = $('#goal-title');
    const descInput = $('#goal-desc');
    const dateInput = $('#goal-target-date');
    const heading = $('#goal-form-heading');
    const titleError = $('#goal-title-error');
    const dateError = $('#goal-date-error');
    const customEmoji = $('#goal-custom-emoji');
    titleError.classList.add('hidden');
    dateError.classList.add('hidden');

    if (editingGoalId) {
      const g = goals.find(x => x.id === editingGoalId);
      if (!g) return;
      heading.textContent = 'Edit Goal';
      titleInput.value = g.title;
      descInput.value = g.description || '';
      dateInput.value = g.targetDate || '';
      selectedGoalEmoji = g.emoji;
      selectedGoalCategory = g.category;
      selectedGoalStatus = g.status;
      editingMilestones = (g.milestones || []).map(m => ({ ...m }));
      $('#goal-status-section').classList.remove('hidden');
      $$('#goal-status-picker .priority-btn').forEach(b => b.classList.toggle('selected', b.dataset.status === g.status));
    } else {
      heading.textContent = 'New Goal';
      titleInput.value = '';
      descInput.value = '';
      dateInput.value = '';
      selectedGoalEmoji = '🎯';
      selectedGoalCategory = 'personal';
      selectedGoalStatus = 'active';
      editingMilestones = [];
      $('#goal-status-section').classList.add('hidden');
    }

    customEmoji.value = '';
    $$('#goal-emoji-picker .habit-emoji-btn').forEach(b => b.classList.toggle('selected', b.dataset.emoji === selectedGoalEmoji));
    $('#btn-goal-delete-top').classList.toggle('hidden', !editingGoalId);

    renderGoalCategoryPickerForm();
    renderMilestonesEditor();
    updateManualProgressVisibility();

    todayDashboard.classList.add('hidden');
    goalsDetailEmpty.classList.add('hidden');
    goalDetailView.classList.add('hidden');
    goalFormView.classList.remove('hidden');
    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    titleInput.focus();
  }

  function renderGoalCategoryPickerForm() {
    const container = $('#goal-category-picker');
    container.innerHTML = categories.map(c => `
      <button class="cat-pick-btn${selectedGoalCategory === c.id ? ' selected' : ''}" data-catid="${c.id}">
        <span class="cat-dot" style="background:${c.color}"></span>${escapeHtml(c.name)}
      </button>
    `).join('');
  }

  function renderMilestonesEditor() {
    const container = $('#goal-milestones-editor');
    if (editingMilestones.length === 0) {
      container.innerHTML = '<p class="goal-no-milestones">No milestones added. Use the manual progress slider below.</p>';
      return;
    }
    container.innerHTML = editingMilestones.map((m, i) => `
      <div class="milestone-edit-card" data-midx="${i}">
        <div class="manage-habit-reorder">
          <button data-mdir="up" data-midx="${i}" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button data-mdir="down" data-midx="${i}" ${i === editingMilestones.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <input type="text" class="input milestone-name-input" value="${escapeHtml(m.name)}" data-midx="${i}" style="margin-bottom:0;flex:1;">
        <button class="milestone-delete-btn" data-midx="${i}">✕</button>
      </div>
    `).join('');
  }

  function updateManualProgressVisibility() {
    const section = $('#goal-manual-progress-section');
    if (editingMilestones.length === 0) {
      section.classList.remove('hidden');
      if (editingGoalId) {
        const g = goals.find(x => x.id === editingGoalId);
        const val = g ? (g.manualProgress || 0) : 0;
        $('#goal-manual-slider').value = val;
        $('#goal-manual-pct').textContent = val + '%';
      } else {
        $('#goal-manual-slider').value = 0;
        $('#goal-manual-pct').textContent = '0%';
      }
    } else {
      section.classList.add('hidden');
    }
  }

  function saveGoal() {
    const titleInput = $('#goal-title');
    const descInput = $('#goal-desc');
    const dateInput = $('#goal-target-date');
    const titleError = $('#goal-title-error');
    const dateError = $('#goal-date-error');
    const title = titleInput.value.trim();
    const targetDate = dateInput.value;

    let hasError = false;
    if (!title) { titleError.classList.remove('hidden'); hasError = true; } else titleError.classList.add('hidden');
    if (!targetDate) { dateError.classList.remove('hidden'); hasError = true; } else dateError.classList.add('hidden');
    if (hasError) return;

    $$('.milestone-name-input').forEach((input, i) => {
      if (editingMilestones[i]) editingMilestones[i].name = input.value.trim();
    });
    editingMilestones = editingMilestones.filter(m => m.name);

    const customEmoji = $('#goal-custom-emoji').value.trim();
    const emoji = customEmoji || selectedGoalEmoji;
    const manualProgress = editingMilestones.length === 0 ? parseInt($('#goal-manual-slider').value) || 0 : 0;

    if (editingGoalId) {
      const g = goals.find(x => x.id === editingGoalId);
      if (g) {
        g.title = title;
        g.description = descInput.value.trim();
        g.category = selectedGoalCategory;
        g.targetDate = targetDate;
        g.emoji = emoji;
        g.status = selectedGoalStatus;
        g.milestones = editingMilestones;
        g.manualProgress = manualProgress;
      }
    } else {
      goals.push({
        id: uid(), title,
        description: descInput.value.trim(),
        category: selectedGoalCategory,
        targetDate, emoji,
        status: 'active',
        milestones: editingMilestones,
        manualProgress,
        createdAt: new Date().toISOString()
      });
    }

    checkGoalAutoComplete();
    saveGoals();
    renderGoals();
    if (editingGoalId) {
      showGoalDetail(editingGoalId);
    } else {
      showGoalsHome();
    }
    showToast(editingGoalId ? 'Goal updated' : 'Goal created');
  }

  function checkGoalAutoComplete() {
    goals.forEach(g => {
      if (g.milestones && g.milestones.length > 0 && g.status === 'active') {
        if (g.milestones.every(m => m.completed)) {
          g.status = 'completed';
        }
      }
    });
  }

  function toggleMilestone(goalId, milestoneId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.milestones) return;
    const milestone = goal.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    milestone.completed = !milestone.completed;

    if (goal.milestones.every(m => m.completed) && goal.status === 'active') {
      goal.status = 'completed';
      showToast('Goal achieved! 🎉');
    } else if (!goal.milestones.every(m => m.completed) && goal.status === 'completed') {
      goal.status = 'active';
    }

    saveGoals();
    showGoalDetail(goalId);
  }

  function renderTodayGoals() {
    const container = $('#today-goals-overview');
    const activeGoals = goals.filter(g => g.status === 'active');

    if (activeGoals.length === 0) {
      container.innerHTML = '<p class="today-reminders-empty">No active goals. Set one to stay focused.</p>';
      return;
    }

    const sorted = [...activeGoals].sort((a, b) => {
      const aD = a.targetDate || '9999-12-31';
      const bD = b.targetDate || '9999-12-31';
      return aD.localeCompare(bD);
    });

    const display = sorted.slice(0, 4);
    container.innerHTML = display.map(g => {
      const pct = getGoalProgress(g);
      const deadline = getGoalDeadlineInfo(g);
      let hint = '';
      let hintCls = '';
      if (deadline && deadline.cls === 'overdue') { hint = 'Overdue'; hintCls = 'overdue'; }
      else if (deadline && deadline.cls === 'soon') { hint = deadline.text; hintCls = 'soon'; }
      else if (pct >= 75) { hint = 'Almost there!'; hintCls = 'almost'; }
      return `
        <div class="today-goal-item" data-gid="${g.id}">
          <div class="today-goal-top">
            <span class="today-goal-emoji">${g.emoji}</span>
            <span class="today-goal-name">${escapeHtml(g.title)}</span>
            ${hint ? `<span class="today-goal-hint ${hintCls}">${hint}</span>` : ''}
            <span class="today-goal-pct">${pct}%</span>
          </div>
          <div class="progress-bar-track goal-progress-track-sm"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }

  // ══════════════════════════════════════
  //  SELF-REFLECTION
  // ══════════════════════════════════════

  const LIFE_AREAS = [
    { key: 'health', label: 'Health & Fitness', emoji: '🏋️' },
    { key: 'school', label: 'School / Career', emoji: '📚' },
    { key: 'relationships', label: 'Relationships', emoji: '❤️' },
    { key: 'finances', label: 'Finances / Crypto', emoji: '💰' },
    { key: 'growth', label: 'Personal Growth', emoji: '🌱' },
    { key: 'happiness', label: 'Happiness', emoji: '😊' }
  ];

  function switchJournalMode(mode) {
    journalMode = mode;
    $$('.mode-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.jmode === mode));
    $('#journal-entries-content').classList.toggle('hidden', mode !== 'entries');
    $('#journal-reflect-content').classList.toggle('hidden', mode !== 'reflect');

    if (mode === 'entries') {
      if (isMobile()) { sidebar.classList.add('active'); detailPanel.classList.remove('active'); }
      detailEmpty.classList.remove('hidden');
      checkinDetailView.classList.add('hidden');
      checkinFormView.classList.add('hidden');
      lifescoreFormView.classList.add('hidden');
      lessonsEditView.classList.add('hidden');
      if (fabBtn && currentFeature === 'journal') fabBtn.classList.remove('hidden');
      currentEntryId = null;
      renderEntries();
    } else {
      if (fabBtn) fabBtn.classList.add('hidden');
      detailEmpty.classList.add('hidden');
      viewEntry.classList.add('hidden');
      writeEntry.classList.add('hidden');
      checkinDetailView.classList.add('hidden');
      checkinFormView.classList.add('hidden');
      lifescoreFormView.classList.add('hidden');
      lessonsEditView.classList.add('hidden');
      if (isMobile()) { sidebar.classList.add('active'); detailPanel.classList.remove('active'); }
      switchReflectSection(reflectSection);
    }
  }

  function switchReflectSection(section) {
    reflectSection = section;
    $$('.reflect-pill[data-rsection]').forEach(b => b.classList.toggle('active', b.dataset.rsection === section));

    $$('.reflect-section-sidebar').forEach(el => el.classList.add('hidden'));
    const sidebarSection = $(`#reflect-${section}-sidebar`);
    if (sidebarSection) sidebarSection.classList.remove('hidden');

    checkinDetailView.classList.add('hidden');
    checkinFormView.classList.add('hidden');
    lifescoreFormView.classList.add('hidden');
    lessonsEditView.classList.add('hidden');
    detailEmpty.classList.add('hidden');

    if (section === 'checkin') renderCheckinList();
    else if (section === 'lifescore') renderLifeScoreView();
    else if (section === 'mood') renderMoodInsights();
    else if (section === 'lessons') renderLessonsList();

    if (isMobile()) { sidebar.classList.add('active'); detailPanel.classList.remove('active'); }
  }

  function showReflectHome() {
    if (isMobile()) { sidebar.classList.add('active'); detailPanel.classList.remove('active'); }
    checkinDetailView.classList.add('hidden');
    checkinFormView.classList.add('hidden');
    lifescoreFormView.classList.add('hidden');
    lessonsEditView.classList.add('hidden');
    currentCheckinId = null;
    editingCheckinId = null;
    currentLessonId = null;
    editingLessonId = null;
    switchReflectSection(reflectSection);
  }

  // ── Weekly Check-In ──

  function renderCheckinList() {
    const list = $('#checkin-list');
    if (reflections.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>No check-ins yet. Start your first weekly reflection!</p></div>';
      return;
    }
    const sorted = [...reflections].sort((a, b) => new Date(b.date) - new Date(a.date));
    list.innerHTML = sorted.map(r => {
      const d = new Date(r.date);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const preview = r.wentWell ? r.wentWell.substring(0, 80) + (r.wentWell.length > 80 ? '...' : '') : '';
      return `
        <div class="entry-card checkin-card${r.id === currentCheckinId ? ' active' : ''}" data-cid="${r.id}">
          <div class="card-top">
            <span class="card-date">Week of ${dateStr}</span>
            <span class="checkin-stars-mini">${stars}</span>
          </div>
          <div class="card-title">${escapeHtml(r.wentWell ? r.wentWell.split('\n')[0].substring(0, 60) : 'Check-In')}</div>
          ${preview ? `<div class="card-preview">${escapeHtml(preview)}</div>` : ''}
        </div>`;
    }).join('');
  }

  function showCheckinDetail(id) {
    const r = reflections.find(x => x.id === id);
    if (!r) return;
    currentCheckinId = id;
    editingCheckinId = null;

    const d = new Date(r.date);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    $('#checkin-detail-date').textContent = 'Week of ' + dateStr;
    $('#checkin-detail-stars').innerHTML = '<span style="color:var(--highlight);font-size:1.3rem;letter-spacing:2px">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</span>';
    $('#checkin-a1').textContent = r.wentWell || '';
    $('#checkin-a2').textContent = r.didntGoWell || '';
    $('#checkin-a3').textContent = r.learned || '';
    $('#checkin-a4').textContent = r.differently || '';

    todayDashboard.classList.add('hidden');
    detailEmpty.classList.add('hidden');
    viewEntry.classList.add('hidden');
    writeEntry.classList.add('hidden');
    checkinFormView.classList.add('hidden');
    lifescoreFormView.classList.add('hidden');
    lessonsEditView.classList.add('hidden');
    checkinDetailView.classList.remove('hidden');

    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    renderCheckinList();
  }

  function showCheckinForm(editId) {
    editingCheckinId = editId || null;
    const heading = $('#checkin-form-heading');
    $('#checkin-error').classList.add('hidden');
    $('#checkin-star-error').classList.add('hidden');

    if (editingCheckinId) {
      const r = reflections.find(x => x.id === editingCheckinId);
      if (!r) return;
      heading.textContent = 'Edit Check-In';
      $('#checkin-q1').value = r.wentWell || '';
      $('#checkin-q2').value = r.didntGoWell || '';
      $('#checkin-q3').value = r.learned || '';
      $('#checkin-q4').value = r.differently || '';
      checkinRating = r.rating || 0;
    } else {
      heading.textContent = 'New Weekly Check-In';
      $('#checkin-q1').value = '';
      $('#checkin-q2').value = '';
      $('#checkin-q3').value = '';
      $('#checkin-q4').value = '';
      checkinRating = 0;
    }

    renderCheckinStars();

    todayDashboard.classList.add('hidden');
    detailEmpty.classList.add('hidden');
    viewEntry.classList.add('hidden');
    writeEntry.classList.add('hidden');
    checkinDetailView.classList.add('hidden');
    lifescoreFormView.classList.add('hidden');
    lessonsEditView.classList.add('hidden');
    checkinFormView.classList.remove('hidden');

    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    $('#checkin-q1').focus();
  }

  function renderCheckinStars() {
    $$('#checkin-stars .star-btn').forEach(b => {
      const star = parseInt(b.dataset.star);
      b.textContent = star <= checkinRating ? '★' : '☆';
      b.classList.toggle('filled', star <= checkinRating);
    });
  }

  function saveCheckin() {
    const q1 = $('#checkin-q1').value.trim();
    const q2 = $('#checkin-q2').value.trim();
    const q3 = $('#checkin-q3').value.trim();
    const q4 = $('#checkin-q4').value.trim();

    if (!q1 || !q2 || !q3 || !q4) { $('#checkin-error').classList.remove('hidden'); return; }
    if (!checkinRating) { $('#checkin-star-error').classList.remove('hidden'); return; }
    $('#checkin-error').classList.add('hidden');
    $('#checkin-star-error').classList.add('hidden');

    if (editingCheckinId) {
      const r = reflections.find(x => x.id === editingCheckinId);
      if (r) { r.wentWell = q1; r.didntGoWell = q2; r.learned = q3; r.differently = q4; r.rating = checkinRating; }
      saveReflections();
      showCheckinDetail(editingCheckinId);
    } else {
      const newCheckin = { id: uid(), wentWell: q1, didntGoWell: q2, learned: q3, differently: q4, rating: checkinRating, date: new Date().toISOString() };
      reflections.push(newCheckin);
      saveReflections();
      showCheckinDetail(newCheckin.id);
    }
    showToast(editingCheckinId ? 'Check-in updated' : 'Check-in saved');
  }

  // ── Life Score ──

  function renderLifeScoreView() {
    const chartArea = $('#lifescore-chart-area');
    const barsArea = $('#lifescore-bars-area');
    const historyArea = $('#lifescore-history-area');

    if (lifeScores.length === 0) {
      chartArea.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>No assessments yet. Rate your life areas to see your balance chart.</p></div>';
      barsArea.innerHTML = '';
      historyArea.innerHTML = '';
      return;
    }

    const latest = [...lifeScores].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    renderRadarChart(chartArea, latest.scores, latest.date);
    renderScoreBars(barsArea, latest.scores);
    renderLifeScoreHistory(historyArea, latest.id);
  }

  function renderRadarChart(container, scores, dateStr) {
    const d = new Date(dateStr);
    const dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const cx = 150, cy = 140, r = 110;
    const n = 6;

    function getPoint(index, value, maxR) {
      const angle = (Math.PI * 2 * index / n) - Math.PI / 2;
      const dist = (value / 10) * maxR;
      return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
    }

    let gridLines = '';
    [3.3, 6.6, 10].forEach(level => {
      let points = [];
      for (let i = 0; i < n; i++) { const p = getPoint(i, level, r); points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`); }
      gridLines += `<polygon points="${points.join(' ')}" fill="none" stroke="var(--border)" stroke-width="1"/>`;
    });

    let axisLines = '';
    for (let i = 0; i < n; i++) {
      const p = getPoint(i, 10, r);
      axisLines += `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="var(--border)" stroke-width="0.5"/>`;
    }

    const values = LIFE_AREAS.map(a => scores[a.key] || 1);
    let dataPoints = [];
    for (let i = 0; i < n; i++) { const p = getPoint(i, values[i], r); dataPoints.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`); }

    let dots = '';
    for (let i = 0; i < n; i++) { const p = getPoint(i, values[i], r); dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="var(--accent)"/>`; }

    const labelNames = ['Health', 'School', 'Relat.', 'Finances', 'Growth', 'Happiness'];
    let labelEls = '';
    for (let i = 0; i < n; i++) {
      const p = getPoint(i, 12.5, r);
      let anchor = 'middle';
      if (p.x < cx - 20) anchor = 'end';
      else if (p.x > cx + 20) anchor = 'start';
      labelEls += `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" fill="var(--text-secondary)" font-size="11" font-weight="500" font-family="var(--font-body)">${labelNames[i]}</text>`;
    }

    container.innerHTML = `
      <h3 class="lifescore-chart-title">Life Balance</h3>
      <p class="lifescore-chart-date">${dateLabel}</p>
      <div class="lifescore-chart-wrap">
        <svg viewBox="0 0 300 280" class="lifescore-svg">
          ${gridLines}${axisLines}
          <polygon points="${dataPoints.join(' ')}" fill="rgba(91,140,106,0.15)" stroke="var(--accent)" stroke-width="2"/>
          ${dots}${labelEls}
        </svg>
      </div>`;
  }

  function renderScoreBars(container, scores) {
    container.innerHTML = `<h3 class="lifescore-section-heading" style="margin-top:16px">Scores</h3>` +
      LIFE_AREAS.map(a => {
        const val = scores[a.key] || 1;
        const colorClass = val <= 3 ? 'red' : val <= 6 ? 'amber' : 'green';
        return `<div class="lifescore-bar-row">
          <span class="lifescore-bar-label">${a.emoji} ${a.label}</span>
          <div class="lifescore-bar-track"><div class="lifescore-bar-fill ${colorClass}" style="width:${val * 10}%"></div></div>
          <span class="lifescore-bar-value">${val}</span>
        </div>`;
      }).join('');
  }

  function renderLifeScoreHistory(container, activeId) {
    const sorted = [...lifeScores].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sorted.length <= 1) { container.innerHTML = ''; return; }
    container.innerHTML = '<h3 class="lifescore-section-heading" style="margin-top:16px">History</h3>' + sorted.map(s => {
      const d = new Date(s.date);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const vals = LIFE_AREAS.map(a => s.scores[a.key] || 1);
      const avg = (vals.reduce((sum, v) => sum + v, 0) / vals.length).toFixed(1);
      return `<div class="entry-card lifescore-history-card${s.id === activeId ? ' active' : ''}" data-lsid="${s.id}">
        <div class="card-top"><span class="card-date">${dateStr}</span><span class="lifescore-avg">Avg: ${avg}</span></div>
      </div>`;
    }).join('');
  }

  function loadLifeScoreIntoChart(id) {
    const score = lifeScores.find(s => s.id === id);
    if (!score) return;
    renderRadarChart($('#lifescore-chart-area'), score.scores, score.date);
    renderScoreBars($('#lifescore-bars-area'), score.scores);
    renderLifeScoreHistory($('#lifescore-history-area'), id);
  }

  function showLifeScoreForm() {
    $('#lifescore-form-heading').textContent = 'New Assessment';
    LIFE_AREAS.forEach(a => {
      const slider = $(`.lifescore-slider[data-area="${a.key}"]`);
      if (slider) { slider.value = 5; slider.nextElementSibling.textContent = '5'; }
    });

    todayDashboard.classList.add('hidden');
    detailEmpty.classList.add('hidden');
    checkinDetailView.classList.add('hidden');
    checkinFormView.classList.add('hidden');
    lessonsEditView.classList.add('hidden');
    lifescoreFormView.classList.remove('hidden');

    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
  }

  function saveLifeScore() {
    const scores = {};
    LIFE_AREAS.forEach(a => {
      const slider = $(`.lifescore-slider[data-area="${a.key}"]`);
      scores[a.key] = slider ? parseInt(slider.value) : 5;
    });
    lifeScores.push({ id: uid(), scores, date: new Date().toISOString() });
    saveLifeScores();
    showReflectHome();
    showToast('Assessment saved');
  }

  // ── Mood Insights ──

  function renderMoodInsights() {
    const container = $('#mood-insights-content');
    $$('#mood-period-filter .reflect-pill').forEach(b => {
      const val = b.dataset.period === 'all' ? 'all' : parseInt(b.dataset.period);
      b.classList.toggle('active', val === moodPeriod || String(val) === String(moodPeriod));
    });

    const now = new Date();
    let filtered;
    if (moodPeriod === 'all') {
      filtered = [...entries];
    } else {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - parseInt(moodPeriod));
      filtered = entries.filter(e => new Date(e.date) >= cutoff);
    }

    if (filtered.length < 3) {
      container.innerHTML = '<div class="empty-state" style="padding:20px 0"><div class="empty-icon">🔍</div><p>Write more journal entries to see mood patterns here.</p></div>';
      return;
    }

    const moodCounts = {};
    filtered.forEach(e => { if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
    const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = sortedMoods.length ? sortedMoods[0][1] : 1;
    const topMood = sortedMoods[0];
    const topMoodLabel = MOOD_LABELS[topMood[0]] || topMood[0];

    const barsHtml = sortedMoods.map(([mood, count]) => {
      const pct = Math.round(count / maxCount * 100);
      return `<div class="mood-dist-row">
        <span class="mood-dist-emoji">${mood}</span>
        <div class="mood-dist-bar-track"><div class="mood-dist-bar-fill" style="width:${pct}%"></div></div>
        <span class="mood-dist-count">${count}</span>
      </div>`;
    }).join('');

    const days = moodPeriod === 'all' ? 30 : parseInt(moodPeriod);
    let timelineHtml = '';
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayEntries = entries.filter(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
      });
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dayEntries.length > 0 && dayEntries[0].mood) {
        timelineHtml += `<span class="mood-timeline-dot has-mood" title="${dateLabel}">${dayEntries[0].mood}</span>`;
      } else {
        timelineHtml += `<span class="mood-timeline-dot empty" title="${dateLabel}"></span>`;
      }
    }

    container.innerHTML = `
      <div class="mood-most-common">
        <span class="mood-most-emoji">${topMood[0]}</span>
        <div class="mood-most-info">
          <span class="mood-most-label">Most Common Mood</span>
          <span class="mood-most-name">${topMoodLabel.replace('Feeling ', '')} — ${topMood[1]} time${topMood[1] > 1 ? 's' : ''}</span>
        </div>
      </div>
      <h4 class="mood-insight-heading">Mood Distribution</h4>
      <div class="mood-dist-chart">${barsHtml}</div>
      <h4 class="mood-insight-heading">Mood Timeline</h4>
      <div class="mood-timeline">${timelineHtml}</div>`;
  }

  // ── Lessons ──

  function getFilteredLessons() {
    let list = [...lessons].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (lessonSearchQuery) {
      const q = lessonSearchQuery.toLowerCase();
      list = list.filter(l => l.text.toLowerCase().includes(q));
    }
    return list;
  }

  function renderLessonsList() {
    const list = $('#lessons-list');
    const filtered = getFilteredLessons();
    if (filtered.length === 0) {
      const msg = lessonSearchQuery ? 'No lessons match your search.' : 'No lessons yet. What have you learned recently?';
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">💡</div><p>${msg}</p></div>`;
      return;
    }
    list.innerHTML = filtered.map(l => {
      const d = new Date(l.date);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `<div class="entry-card lesson-card${l.id === currentLessonId ? ' active' : ''}" data-lid="${l.id}">
        <div class="card-top"><span class="card-date">${dateStr}</span></div>
        <div class="card-title">${escapeHtml(l.text)}</div>
      </div>`;
    }).join('');
  }

  function showLessonDetail(id) {
    const l = lessons.find(x => x.id === id);
    if (!l) return;
    currentLessonId = id;
    editingLessonId = id;
    $('#lesson-edit-text').value = l.text;
    const d = new Date(l.date);
    $('#lesson-edit-date').textContent = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    todayDashboard.classList.add('hidden');
    detailEmpty.classList.add('hidden');
    checkinDetailView.classList.add('hidden');
    checkinFormView.classList.add('hidden');
    lifescoreFormView.classList.add('hidden');
    lessonsEditView.classList.remove('hidden');

    if (isMobile()) { sidebar.classList.remove('active'); detailPanel.classList.add('active'); }
    renderLessonsList();
  }

  function saveLessonEdit() {
    if (!editingLessonId) return;
    const text = $('#lesson-edit-text').value.trim();
    if (!text) return;
    const l = lessons.find(x => x.id === editingLessonId);
    if (l) l.text = text;
    saveLessons();
    showReflectHome();
    showToast('Lesson updated');
  }

  function addQuickLesson() {
    const input = $('#lesson-quick-input');
    const text = input.value.trim();
    if (!text) return;
    lessons.push({ id: uid(), text, date: new Date().toISOString() });
    saveLessons();
    input.value = '';
    renderLessonsList();
    showToast('Lesson saved');
  }

  // ── Dashboard Reflection ──

  function renderDashboardReflection() {
    const container = $('#today-reflection-content');
    if (!container) return;
    let html = '';

    if (reflections.length === 0) {
      html += '<div class="today-reflection-nudge"><span class="nudge-icon">📝</span><span class="nudge-text">Start your first weekly reflection to track your progress.</span></div>';
    } else {
      const latest = [...reflections].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const daysSince = Math.floor((new Date() - new Date(latest.date)) / 86400000);
      if (daysSince > 7) {
        html += `<div class="today-reflection-nudge"><span class="nudge-icon">📝</span><span class="nudge-text">Time for your weekly reflection — it's been ${daysSince} days.</span></div>`;
      }
    }

    if (lifeScores.length > 0) {
      const latest = [...lifeScores].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      html += '<div class="today-lifescores-row">';
      LIFE_AREAS.forEach(a => {
        const val = latest.scores[a.key] || 0;
        html += `<span class="today-lifescore-item">${a.emoji} ${val}</span>`;
      });
      html += '</div>';
    }

    if (!html) html = '<p class="today-reminders-empty">No reflection data yet.</p>';
    container.innerHTML = html;
  }

  // ══════════════════════════════════════
  //  EVENT HANDLERS
  // ══════════════════════════════════════

  // Navigation — desktop rail
  $('#nav-rail').addEventListener('click', e => {
    const item = e.target.closest('.nav-rail-item[data-feature]');
    if (item) switchFeature(item.dataset.feature);
  });

  // Theme — rail button
  $('#btn-theme-rail').addEventListener('click', toggleTheme);

  // Navigation — mobile bottom nav
  $('#bottom-nav').addEventListener('click', e => {
    const item = e.target.closest('.bottom-nav-item');
    if (item) switchFeature(item.dataset.feature);
  });

  // FAB — mobile new entry
  fabBtn.addEventListener('click', () => showWrite());

  // ── Today Dashboard Events ──

  // Sidebar habits: checkbox toggle
  $('#today-habits-list').addEventListener('click', e => {
    const checkbox = e.target.closest('.habit-checkbox');
    if (checkbox) {
      e.stopPropagation();
      toggleHabitDone(checkbox.dataset.hid);
      renderTodaySidebarHabits();
      renderTodayDashboard();
      return;
    }
  });

  // Dashboard habits: checkbox toggle (mobile)
  $('#today-dashboard-habits-list').addEventListener('click', e => {
    const checkbox = e.target.closest('.habit-checkbox');
    if (checkbox) {
      e.stopPropagation();
      toggleHabitDone(checkbox.dataset.hid);
      renderTodaySidebarHabits();
      renderTodayDashboard();
      return;
    }
  });

  // Dashboard habits: manage link (mobile)
  $('#btn-manage-habits-dash').addEventListener('click', showManageHabits);

  // Manage link
  $('#btn-manage-habits').addEventListener('click', showManageHabits);

  // Manage habits list: reorder, edit, delete
  $('#manage-habits-list').addEventListener('click', e => {
    const reorderBtn = e.target.closest('[data-dir]');
    if (reorderBtn) {
      const idx = parseInt(reorderBtn.dataset.idx);
      const dir = reorderBtn.dataset.dir;
      if (dir === 'up' && idx > 0) { [habits[idx], habits[idx-1]] = [habits[idx-1], habits[idx]]; }
      else if (dir === 'down' && idx < habits.length - 1) { [habits[idx], habits[idx+1]] = [habits[idx+1], habits[idx]]; }
      saveHabits();
      renderManageHabits();
      return;
    }
    const editBtn = e.target.closest('.habit-edit-btn');
    if (editBtn) { showHabitForm(editBtn.dataset.hid); return; }
    const delBtn = e.target.closest('.habit-delete-btn');
    if (delBtn) {
      deleteMode = 'habit';
      editingHabitId = delBtn.dataset.hid;
      modalText.textContent = 'Delete this habit?';
      modalConfirm.textContent = 'Delete';
      deleteModal.classList.remove('hidden');
      return;
    }
  });

  // Add new habit button
  $('#btn-add-habit').addEventListener('click', () => showHabitForm());

  // Habit form: emoji picker
  $('#habit-emoji-picker').addEventListener('click', e => {
    const btn = e.target.closest('.habit-emoji-btn');
    if (!btn) return;
    $$('#habit-emoji-picker .habit-emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedHabitEmoji = btn.dataset.emoji;
    $('#habit-custom-emoji').value = '';
  });

  // Habit form: freq picker
  $('#habit-freq-picker').addEventListener('click', e => {
    const btn = e.target.closest('.priority-btn');
    if (!btn) return;
    $$('#habit-freq-picker .priority-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedHabitFreq = btn.dataset.freq;
    $('#habit-custom-days').classList.toggle('hidden', selectedHabitFreq !== 'custom');
  });

  // Habit form: save
  $('#btn-habit-save-top').addEventListener('click', saveHabit);
  $('#btn-habit-save-bottom').addEventListener('click', saveHabit);
  $('#btn-habit-cancel').addEventListener('click', showManageHabits);

  // Add sticky reminder
  $('#btn-add-sticky').addEventListener('click', () => showStickyForm());

  // Sticky click to edit
  $('#today-reminders').addEventListener('click', e => {
    const card = e.target.closest('.sticky-card');
    if (card) showStickyForm(card.dataset.sid);
  });

  // Sticky form: color picker
  document.querySelector('.sticky-color-picker').addEventListener('click', e => {
    const btn = e.target.closest('.sticky-color-btn');
    if (!btn) return;
    $$('.sticky-color-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedStickyColor = btn.dataset.color;
  });

  // Sticky form: save
  $('#btn-sticky-save-top').addEventListener('click', saveSticky);
  $('#btn-sticky-save-bottom').addEventListener('click', saveSticky);
  $('#btn-sticky-cancel').addEventListener('click', showTodayHome);

  // Sticky form: delete
  $('#btn-sticky-delete-top').addEventListener('click', () => {
    if (!editingStickyId) return;
    deleteMode = 'sticky';
    modalText.textContent = 'Delete this reminder?';
    modalConfirm.textContent = 'Delete';
    deleteModal.classList.remove('hidden');
  });

  // ── Goals Event Handlers ──

  // Goal card clicks
  goalsList.addEventListener('click', e => {
    const card = e.target.closest('.goal-card');
    if (card) showGoalDetail(card.dataset.gid);
  });

  // New goal buttons
  $('#btn-new-goal').addEventListener('click', () => showGoalForm());
  $('#btn-new-goal-header').addEventListener('click', () => showGoalForm());

  // Goal filter clicks
  document.querySelector('.goal-toolbar').addEventListener('click', e => {
    const btn = e.target.closest('.todo-chip');
    if (!btn) return;
    const filterType = btn.dataset.gfilter;
    const value = btn.dataset.value;
    if (filterType === 'status') {
      goalStatusFilter = value;
      $$('[data-gfilter="status"]').forEach(b => b.classList.toggle('active', b.dataset.value === value));
    } else if (filterType === 'category') {
      goalCategoryFilter = goalCategoryFilter === value ? 'all' : value;
      $$('[data-gfilter="category"]').forEach(b => b.classList.toggle('active', b.dataset.value === goalCategoryFilter));
    }
    saveGoalFilter();
    renderGoals();
  });

  // Goal detail: edit
  $('#btn-goal-edit').addEventListener('click', () => { if (currentGoalId) showGoalForm(currentGoalId); });
  $('#btn-goal-edit-bottom').addEventListener('click', () => { if (currentGoalId) showGoalForm(currentGoalId); });

  // Goal detail: delete
  function promptGoalDelete() {
    if (!currentGoalId) return;
    deleteMode = 'goal';
    modalText.textContent = 'Delete this goal and all its milestones?';
    modalConfirm.textContent = 'Delete';
    deleteModal.classList.remove('hidden');
  }
  $('#btn-goal-delete').addEventListener('click', promptGoalDelete);
  $('#btn-goal-delete-bottom').addEventListener('click', promptGoalDelete);

  // Goal detail: milestone checkbox
  $('#goal-milestone-list').addEventListener('click', e => {
    const checkbox = e.target.closest('.milestone-checkbox');
    if (checkbox) {
      e.stopPropagation();
      toggleMilestone(checkbox.dataset.gid, checkbox.dataset.mid);
      return;
    }
    const card = e.target.closest('.milestone-card');
    if (card) toggleMilestone(card.dataset.gid, card.dataset.mid);
  });

  // Goal form: emoji picker
  $('#goal-emoji-picker').addEventListener('click', e => {
    const btn = e.target.closest('.habit-emoji-btn');
    if (!btn) return;
    $$('#goal-emoji-picker .habit-emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedGoalEmoji = btn.dataset.emoji;
    $('#goal-custom-emoji').value = '';
  });

  // Goal form: category picker
  $('#goal-category-picker').addEventListener('click', e => {
    const btn = e.target.closest('.cat-pick-btn');
    if (!btn) return;
    selectedGoalCategory = btn.dataset.catid;
    $$('#goal-category-picker .cat-pick-btn').forEach(b => b.classList.toggle('selected', b.dataset.catid === selectedGoalCategory));
  });

  // Goal form: status picker
  $('#goal-status-picker').addEventListener('click', e => {
    const btn = e.target.closest('.priority-btn');
    if (!btn) return;
    $$('#goal-status-picker .priority-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedGoalStatus = btn.dataset.status;
  });

  // Goal form: save/cancel
  $('#btn-goal-save-top').addEventListener('click', saveGoal);
  $('#btn-goal-save-bottom').addEventListener('click', saveGoal);
  $('#btn-goal-cancel').addEventListener('click', showGoalsHome);

  // Goal form: delete (top button when editing)
  $('#btn-goal-delete-top').addEventListener('click', () => {
    if (!editingGoalId) return;
    currentGoalId = editingGoalId;
    promptGoalDelete();
  });

  // Goal form: add milestone
  $('#btn-add-milestone').addEventListener('click', () => {
    const input = $('#goal-new-milestone');
    const name = input.value.trim();
    if (!name) return;
    editingMilestones.push({ id: uid(), name, completed: false });
    input.value = '';
    renderMilestonesEditor();
    updateManualProgressVisibility();
  });

  $('#goal-new-milestone').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#btn-add-milestone').click();
    }
  });

  // Goal form: milestone reorder/delete
  $('#goal-milestones-editor').addEventListener('click', e => {
    const reorderBtn = e.target.closest('[data-mdir]');
    if (reorderBtn) {
      const idx = parseInt(reorderBtn.dataset.midx);
      const dir = reorderBtn.dataset.mdir;
      // Save current input values first
      $$('.milestone-name-input').forEach((input, i) => {
        if (editingMilestones[i]) editingMilestones[i].name = input.value.trim();
      });
      if (dir === 'up' && idx > 0) { [editingMilestones[idx], editingMilestones[idx-1]] = [editingMilestones[idx-1], editingMilestones[idx]]; }
      else if (dir === 'down' && idx < editingMilestones.length - 1) { [editingMilestones[idx], editingMilestones[idx+1]] = [editingMilestones[idx+1], editingMilestones[idx]]; }
      renderMilestonesEditor();
      return;
    }
    const delBtn = e.target.closest('.milestone-delete-btn');
    if (delBtn) {
      const idx = parseInt(delBtn.dataset.midx);
      // Save current input values first
      $$('.milestone-name-input').forEach((input, i) => {
        if (editingMilestones[i]) editingMilestones[i].name = input.value.trim();
      });
      editingMilestones.splice(idx, 1);
      renderMilestonesEditor();
      updateManualProgressVisibility();
    }
  });

  // Goal form: manual slider
  $('#goal-manual-slider').addEventListener('input', e => {
    $('#goal-manual-pct').textContent = e.target.value + '%';
  });

  // ── Reflect Event Handlers ──

  // Journal mode toggle
  document.querySelector('.journal-mode-toggle').addEventListener('click', e => {
    const btn = e.target.closest('.mode-toggle-btn');
    if (btn) switchJournalMode(btn.dataset.jmode);
  });

  // Reflect sub-nav
  $('#reflect-subnav').addEventListener('click', e => {
    const btn = e.target.closest('.reflect-pill');
    if (btn && btn.dataset.rsection) switchReflectSection(btn.dataset.rsection);
  });

  // Check-in list click
  $('#checkin-list').addEventListener('click', e => {
    const card = e.target.closest('.checkin-card');
    if (card) showCheckinDetail(card.dataset.cid);
  });

  // New check-in
  $('#btn-new-checkin').addEventListener('click', () => showCheckinForm());

  // Check-in detail: edit/delete
  $('#btn-checkin-edit').addEventListener('click', () => { if (currentCheckinId) showCheckinForm(currentCheckinId); });
  $('#btn-checkin-edit-bottom').addEventListener('click', () => { if (currentCheckinId) showCheckinForm(currentCheckinId); });
  $('#btn-checkin-delete').addEventListener('click', () => {
    if (!currentCheckinId) return;
    deleteMode = 'checkin';
    modalText.textContent = 'Delete this check-in?';
    modalConfirm.textContent = 'Delete';
    deleteModal.classList.remove('hidden');
  });
  $('#btn-checkin-delete-bottom').addEventListener('click', () => {
    if (!currentCheckinId) return;
    deleteMode = 'checkin';
    modalText.textContent = 'Delete this check-in?';
    modalConfirm.textContent = 'Delete';
    deleteModal.classList.remove('hidden');
  });

  // Check-in form: star rating
  $('#checkin-stars').addEventListener('click', e => {
    const btn = e.target.closest('.star-btn');
    if (!btn) return;
    checkinRating = parseInt(btn.dataset.star);
    renderCheckinStars();
    $('#checkin-star-error').classList.add('hidden');
  });

  // Check-in form: save/cancel
  $('#btn-checkin-save-top').addEventListener('click', saveCheckin);
  $('#btn-checkin-save-bottom').addEventListener('click', saveCheckin);
  $('#btn-checkin-cancel').addEventListener('click', showReflectHome);

  // Life Score: new assessment buttons
  $('#btn-new-assessment').addEventListener('click', showLifeScoreForm);

  // Life Score: history card clicks
  $('#lifescore-history-area').addEventListener('click', e => {
    const card = e.target.closest('.lifescore-history-card');
    if (card) loadLifeScoreIntoChart(card.dataset.lsid);
  });

  // Life Score: delete history item
  $('#lifescore-history-area').addEventListener('contextmenu', e => { e.preventDefault(); });

  // Life Score form: slider values
  document.querySelectorAll('.lifescore-slider').forEach(slider => {
    slider.addEventListener('input', e => {
      e.target.nextElementSibling.textContent = e.target.value;
    });
  });

  // Life Score form: save/cancel
  $('#btn-lifescore-save-top').addEventListener('click', saveLifeScore);
  $('#btn-lifescore-save-bottom').addEventListener('click', saveLifeScore);
  $('#btn-lifescore-cancel').addEventListener('click', showReflectHome);

  // Mood: period filter
  $('#mood-period-filter').addEventListener('click', e => {
    const btn = e.target.closest('.reflect-pill');
    if (!btn || !btn.dataset.period) return;
    moodPeriod = btn.dataset.period === 'all' ? 'all' : parseInt(btn.dataset.period);
    renderMoodInsights();
  });

  // Lessons: quick add
  $('#btn-add-lesson').addEventListener('click', addQuickLesson);
  $('#lesson-quick-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addQuickLesson(); }
  });

  // Lessons: search
  $('#lesson-search-input').addEventListener('input', e => {
    lessonSearchQuery = e.target.value.trim();
    $('#lesson-search-clear').classList.toggle('hidden', !lessonSearchQuery);
    renderLessonsList();
  });

  $('#lesson-search-clear').addEventListener('click', () => {
    $('#lesson-search-input').value = '';
    lessonSearchQuery = '';
    $('#lesson-search-clear').classList.add('hidden');
    renderLessonsList();
  });

  // Lessons: card click
  $('#lessons-list').addEventListener('click', e => {
    const card = e.target.closest('.lesson-card');
    if (card) showLessonDetail(card.dataset.lid);
  });

  // Lesson edit: save/cancel/delete
  $('#btn-lesson-save-top').addEventListener('click', saveLessonEdit);
  $('#btn-lesson-save-bottom').addEventListener('click', saveLessonEdit);
  $('#btn-lesson-cancel').addEventListener('click', showReflectHome);
  $('#btn-lesson-delete-top').addEventListener('click', () => {
    if (!editingLessonId) return;
    deleteMode = 'lesson';
    modalText.textContent = 'Delete this lesson?';
    modalConfirm.textContent = 'Delete';
    deleteModal.classList.remove('hidden');
  });

  // Dashboard: View all goals
  $('#btn-view-all-goals').addEventListener('click', () => switchFeature('goals'));

  // Dashboard: goal item click
  $('#today-goals-overview').addEventListener('click', e => {
    const item = e.target.closest('.today-goal-item');
    if (item) {
      switchFeature('goals');
      showGoalDetail(item.dataset.gid);
    }
  });

  // Pending tasks: click to go to todo
  $('#today-pending-tasks').addEventListener('click', e => {
    const row = e.target.closest('.today-task-row');
    if (row) {
      switchFeature('todo');
      currentTodoId = row.dataset.tid;
      showTodoForm(currentTodoId);
    }
  });

  // Theme
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Settings menu
  menuBtn.addEventListener('click', e => { e.stopPropagation(); settingsDropdown.classList.toggle('hidden'); });
  document.addEventListener('click', () => settingsDropdown.classList.add('hidden'));

  settingsDropdown.addEventListener('click', e => {
    e.stopPropagation();
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    const action = item.dataset.action;
    settingsDropdown.classList.add('hidden');
    if (action === 'export') exportBackup();
    else if (action === 'import') importFile.click();
    else if (action === 'delete-all') {
      deleteMode = 'all-first';
      modalText.textContent = 'Are you sure you want to delete ALL entries?';
      modalConfirm.textContent = 'Delete All';
      deleteModal.classList.remove('hidden');
    }
  });

  importFile.addEventListener('change', e => {
    if (e.target.files[0]) { importBackup(e.target.files[0]); e.target.value = ''; }
  });

  // Journal: New Entry button (desktop)
  $('#btn-new-entry').addEventListener('click', () => showWrite());

  // Journal: Mood selection
  moodGrid.addEventListener('click', e => {
    const btn = e.target.closest('.mood-option');
    if (!btn) return;
    moodGrid.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
    moodError.classList.add('hidden');
  });

  entryText.addEventListener('input', updateWordCount);

  promptBtn.addEventListener('click', () => {
    let idx;
    do { idx = Math.floor(Math.random() * PROMPTS.length); } while (idx === lastPromptIndex && PROMPTS.length > 1);
    lastPromptIndex = idx;
    promptText.textContent = PROMPTS[idx];
    promptText.classList.remove('hidden');
  });

  // Journal: Save (desktop top button)
  $('#btn-save').addEventListener('click', saveEntry);

  // Journal: Save (mobile bottom button)
  $('#btn-save-mobile').addEventListener('click', saveEntry);

  // Journal: Edit, Pin, Delete
  $('#btn-edit').addEventListener('click', () => { if (currentEntryId) showWrite(currentEntryId); });

  viewPin.addEventListener('click', () => {
    const entry = entries.find(e => e.id === currentEntryId);
    if (!entry) return;
    entry.pinned = !entry.pinned;
    saveEntries();
    viewPin.textContent = entry.pinned ? '★' : '☆';
    viewPin.classList.toggle('pinned', entry.pinned);
    renderEntries();
  });

  $('#btn-delete').addEventListener('click', () => {
    deleteMode = 'single';
    modalText.textContent = 'Are you sure you want to delete this entry?';
    modalConfirm.textContent = 'Delete';
    deleteModal.classList.remove('hidden');
  });

  // Modal
  $('#modal-cancel').addEventListener('click', () => { deleteModal.classList.add('hidden'); deleteMode = 'single'; });

  modalConfirm.addEventListener('click', () => {
    if (deleteMode === 'single') {
      entries = entries.filter(e => e.id !== currentEntryId);
      saveEntries(); deleteModal.classList.add('hidden');
      renderStreak();
      if (journalView === 'calendar') renderCalendar();
      showJournalHome();
    } else if (deleteMode === 'all-first') {
      deleteMode = 'all-confirm';
      modalText.textContent = 'This cannot be undone. Really delete all entries?';
      modalConfirm.textContent = 'Yes, delete everything';
    } else if (deleteMode === 'all-confirm') {
      entries = []; saveEntries(); deleteModal.classList.add('hidden'); deleteMode = 'single';
      renderStreak();
      if (journalView === 'calendar') renderCalendar();
      showJournalHome();
      showToast('All entries deleted');
    } else if (deleteMode === 'todo-single') {
      todos = todos.filter(t => t.id !== currentTodoId);
      saveTodos(); deleteModal.classList.add('hidden'); deleteMode = 'single';
      showTodoHome();
    } else if (deleteMode === 'todo-clear') {
      todos = todos.filter(t => !t.completed);
      saveTodos(); deleteModal.classList.add('hidden'); deleteMode = 'single';
      renderTodos();
      showToast('Completed tasks cleared');
    } else if (deleteMode === 'habit') {
      habits = habits.filter(h => h.id !== editingHabitId);
      saveHabits(); deleteModal.classList.add('hidden'); deleteMode = 'single';
      editingHabitId = null;
      showManageHabits();
      showToast('Habit deleted');
    } else if (deleteMode === 'sticky') {
      stickies = stickies.filter(s => s.id !== editingStickyId);
      saveStickies(); deleteModal.classList.add('hidden'); deleteMode = 'single';
      editingStickyId = null;
      showTodayHome();
      showToast('Reminder deleted');
    } else if (deleteMode === 'goal') {
      goals = goals.filter(g => g.id !== currentGoalId);
      saveGoals(); deleteModal.classList.add('hidden'); deleteMode = 'single';
      currentGoalId = null;
      showGoalsHome();
      showToast('Goal deleted');
    } else if (deleteMode === 'checkin') {
      reflections = reflections.filter(r => r.id !== currentCheckinId);
      saveReflections(); deleteModal.classList.add('hidden'); deleteMode = 'single';
      currentCheckinId = null;
      showReflectHome();
      showToast('Check-in deleted');
    } else if (deleteMode === 'lesson') {
      lessons = lessons.filter(l => l.id !== editingLessonId);
      saveLessons(); deleteModal.classList.add('hidden'); deleteMode = 'single';
      editingLessonId = null;
      currentLessonId = null;
      showReflectHome();
      showToast('Lesson deleted');
    }
  });

  deleteModal.addEventListener('click', e => { if (e.target === deleteModal) { deleteModal.classList.add('hidden'); deleteMode = 'single'; } });

  // Journal: Entry card click
  entriesList.addEventListener('click', e => {
    const card = e.target.closest('.entry-card');
    if (card) showView(card.dataset.id);
  });

  // Back buttons
  $$('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.target;
      if (t === 'todo-home') showTodoHome();
      else if (t === 'today-home') showTodayHome();
      else if (t === 'manage-habits') showManageHabits();
      else if (t === 'goals-home') showGoalsHome();
      else if (t === 'reflect-home') showReflectHome();
      else showJournalHome();
    });
  });

  // Journal: Filters
  document.querySelector('#journal-sidebar .filter-bar').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    $$('#journal-sidebar .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    selectedCalDate = null;
    renderEntries();
    if (journalView === 'calendar') renderCalendar();
  });

  // Journal: Search
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    searchClear.classList.toggle('hidden', !searchQuery);
    renderEntries();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = ''; searchQuery = '';
    searchClear.classList.add('hidden');
    renderEntries();
  });

  // Journal: View toggle
  document.querySelector('.view-toggle').addEventListener('click', e => {
    const btn = e.target.closest('.view-toggle-btn');
    if (!btn) return;
    $$('.view-toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    journalView = btn.dataset.view;
    if (journalView === 'calendar') { calendarView.classList.remove('hidden'); selectedCalDate = null; renderCalendar(); }
    else { calendarView.classList.add('hidden'); selectedCalDate = null; }
    renderEntries();
  });

  // Journal: Calendar nav
  $('#cal-prev').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() - 1); selectedCalDate = null; renderCalendar(); renderEntries(); });
  $('#cal-next').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() + 1); selectedCalDate = null; renderCalendar(); renderEntries(); });

  calDays.addEventListener('click', e => {
    const dayEl = e.target.closest('.cal-day:not(.other-month)');
    if (!dayEl) return;
    const day = parseInt(dayEl.dataset.day);
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    if (selectedCalDate && selectedCalDate.getFullYear() === year && selectedCalDate.getMonth() === month && selectedCalDate.getDate() === day) {
      selectedCalDate = null;
    } else {
      selectedCalDate = new Date(year, month, day);
    }
    renderCalendar(); renderEntries();
  });

  // ── Todo Event Handlers ──

  // Quick add
  $('#todo-quick-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const name = e.target.value.trim();
      if (!name) return;
      todos.push({ id: uid(), name, note: '', priority: 'medium', due: '', category: 'personal', completed: false, created: new Date().toISOString() });
      saveTodos();
      e.target.value = '';
      renderTodos();
    }
  });

  // Expand button → full form
  $('#todo-expand-btn').addEventListener('click', () => showTodoForm());

  // Todo toolbar filter clicks
  document.querySelector('.todo-toolbar').addEventListener('click', e => {
    const btn = e.target.closest('.todo-chip');
    if (!btn) return;
    const filterType = btn.dataset.tfilter;
    const value = btn.dataset.value;
    if (filterType === 'status') {
      todoStatusFilter = value;
      $$('[data-tfilter="status"]').forEach(b => b.classList.toggle('active', b.dataset.value === value));
    } else if (filterType === 'category') {
      todoCategoryFilter = todoCategoryFilter === value ? 'all' : value;
      $$('[data-tfilter="category"]').forEach(b => b.classList.toggle('active', b.dataset.value === todoCategoryFilter));
    }
    renderTodos();
  });

  // Todo list clicks (checkbox, card, delete)
  todoList.addEventListener('click', e => {
    const checkbox = e.target.closest('.task-checkbox');
    if (checkbox) {
      e.stopPropagation();
      const task = todos.find(t => t.id === checkbox.dataset.tid);
      if (task) { task.completed = !task.completed; saveTodos(); renderTodos(); }
      return;
    }

    const delBtn = e.target.closest('.task-delete-btn');
    if (delBtn) {
      e.stopPropagation();
      currentTodoId = delBtn.dataset.tid;
      deleteMode = 'todo-single';
      modalText.textContent = 'Delete this task?';
      modalConfirm.textContent = 'Delete';
      deleteModal.classList.remove('hidden');
      return;
    }

    const card = e.target.closest('.task-card');
    if (card) {
      currentTodoId = card.dataset.tid;
      showTodoForm(currentTodoId);
    }
  });

  // Clear completed (desktop bottom link)
  $('#btn-clear-completed').addEventListener('click', promptClearCompleted);

  // Clear completed (mobile header button)
  $('#btn-clear-header').addEventListener('click', promptClearCompleted);

  // Todo form: priority picker
  document.querySelector('.priority-picker').addEventListener('click', e => {
    const btn = e.target.closest('.priority-btn');
    if (!btn) return;
    document.querySelectorAll('.priority-picker .priority-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedPriority = btn.dataset.priority;
  });

  // Todo form: category picker
  $('#todo-category-picker').addEventListener('click', e => {
    const editIcon = e.target.closest('.cat-edit-icon');
    if (editIcon) {
      e.stopPropagation();
      const catBtn = editIcon.closest('.cat-pick-btn');
      const catId = catBtn.dataset.catid;
      const cat = categories.find(c => c.id === catId);
      if (cat && !cat.builtin) {
        todos.forEach(t => { if (t.category === catId) t.category = 'other'; });
        categories = categories.filter(c => c.id !== catId);
        saveCategories(); saveTodos();
        if (selectedCategory === catId) selectedCategory = 'other';
        renderCategoryPicker();
        renderTodoCategoryFilters();
      }
      return;
    }

    const btn = e.target.closest('.cat-pick-btn');
    if (!btn) return;
    selectedCategory = btn.dataset.catid;
    $$('.cat-pick-btn').forEach(b => b.classList.toggle('selected', b.dataset.catid === selectedCategory));
  });

  // Add custom category
  $('#btn-add-cat').addEventListener('click', () => {
    const nameInput = $('#custom-cat-name');
    const colorInput = $('#custom-cat-color');
    const name = nameInput.value.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + uid().slice(-3);
    categories.push({ id, name, color: colorInput.value, builtin: false });
    saveCategories();
    selectedCategory = id;
    nameInput.value = '';
    renderCategoryPicker();
    renderTodoCategoryFilters();
  });

  // Todo form: cancel
  $('#btn-todo-cancel').addEventListener('click', showTodoHome);

  // Todo form: save (desktop top button)
  $('#btn-todo-save').addEventListener('click', saveTodo);

  // Todo form: save (mobile bottom button)
  $('#btn-todo-save-bottom').addEventListener('click', saveTodo);

  // Todo form: delete (desktop top button)
  $('#btn-todo-delete-top').addEventListener('click', () => {
    if (!editingTodoId) return;
    currentTodoId = editingTodoId;
    deleteMode = 'todo-single';
    modalText.textContent = 'Delete this task?';
    modalConfirm.textContent = 'Delete';
    deleteModal.classList.remove('hidden');
  });

  // ── Init ──
  loadTheme();
  loadEntries();
  loadCategories();
  loadTodos();
  loadSort();
  loadHabits();
  loadHabitLog();
  loadStickies();
  loadGoals();
  loadGoalFilter();
  loadReflections();
  loadLifeScores();
  loadLessons();
  renderStreak();
  switchFeature('today');
})();
