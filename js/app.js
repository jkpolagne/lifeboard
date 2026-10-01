(function () {
  'use strict';

  // ── Keys ──
  const JOURNAL_KEY = 'lifeboard_journal';
  const THEME_KEY = 'lifeboard_theme';
  const TODOS_KEY = 'lifeboard-todos';
  const CATEGORIES_KEY = 'lifeboard-categories';
  const SORT_KEY = 'lifeboard-todo-sort';

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
  let currentFeature = 'journal';
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

  // ── Storage ──
  function loadEntries() {
    try { entries = JSON.parse(localStorage.getItem(JOURNAL_KEY)) || []; } catch { entries = []; }
  }
  function saveEntries() { localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries)); }

  function loadTodos() {
    try { todos = JSON.parse(localStorage.getItem(TODOS_KEY)) || []; } catch { todos = []; }
  }
  function saveTodos() { localStorage.setItem(TODOS_KEY, JSON.stringify(todos)); }

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

    $('#journal-header').classList.toggle('hidden', feature !== 'journal');
    $('#todo-header').classList.toggle('hidden', feature !== 'todo');

    journalSidebar.classList.toggle('hidden', feature !== 'journal');
    todoSidebar.classList.toggle('hidden', feature !== 'todo');

    if (fabBtn) fabBtn.classList.toggle('hidden', feature !== 'journal');

    viewEntry.classList.add('hidden');
    writeEntry.classList.add('hidden');
    todoEditView.classList.add('hidden');

    if (feature === 'journal') {
      detailEmpty.classList.remove('hidden');
      todoDetailEmpty.classList.add('hidden');
      currentEntryId = null;
      renderEntries();
    } else {
      detailEmpty.classList.add('hidden');
      todoDetailEmpty.classList.remove('hidden');
      currentTodoId = null;
      renderTodos();
      renderTodoCategoryFilters();
    }

    if (isMobile()) {
      sidebar.classList.add('active');
      detailPanel.classList.remove('active');
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
      if (btn.dataset.target === 'todo-home') showTodoHome();
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
    $$('.priority-btn').forEach(b => b.classList.remove('selected'));
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
  renderStreak();
  renderEntries();
  renderTodoCategoryFilters();
  renderTodos();
})();
