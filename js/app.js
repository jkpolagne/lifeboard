(function () {
  'use strict';

  const STORAGE_KEY = 'lifeboard_journal';
  const THEME_KEY = 'lifeboard_theme';

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

  // ── State ──
  let entries = [];
  let currentFilter = 'all';
  let currentEntryId = null;
  let editingEntryId = null;
  let selectedMood = null;
  let lastPromptIndex = -1;
  let searchQuery = '';
  let calendarDate = new Date();
  let selectedCalDate = null;
  let currentView = 'list';
  let deleteMode = 'single'; // 'single', 'all-first', 'all-confirm'

  // ── DOM refs ──
  const $ = (sel) => document.querySelector(sel);
  const sidebar = $('#sidebar');
  const detailPanel = $('#detail-panel');
  const entriesList = $('#entries-list');
  const streakEl = $('#streak');

  const viewEntry = $('#view-entry');
  const viewMood = $('#view-mood');
  const viewDate = $('#view-date');
  const viewTitle = $('#view-title');
  const viewText = $('#view-text');
  const viewPin = $('#view-pin');
  const detailEmpty = $('#detail-empty');

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
  const themeBtn = $('#btn-theme');
  const menuBtn = $('#btn-menu');
  const settingsDropdown = $('#settings-dropdown');
  const importFile = $('#import-file');
  const toast = $('#toast');

  const calendarView = $('#calendar-view');
  const calMonthYear = $('#cal-month-year');
  const calDays = $('#cal-days');

  // ── Storage ──
  function loadEntries() {
    try {
      entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      entries = [];
    }
  }

  function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  // ── Theme ──
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeBtn.textContent = '🌙';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeBtn.textContent = '☀️';
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'light');
      themeBtn.textContent = '☀️';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(THEME_KEY, 'dark');
      themeBtn.textContent = '🌙';
    }
  }

  // ── Toast ──
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
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
      if (daySet.has(key)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  function renderStreak() {
    const s = calcStreak();
    streakEl.textContent = `🔥 ${s}-day streak`;
  }

  // ── Format date ──
  function formatDate(iso) {
    const d = new Date(iso);
    const opts = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    return d.toLocaleDateString('en-US', opts);
  }

  // ── Word count ──
  function updateWordCount() {
    const text = entryText.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = `${count} word${count !== 1 ? 's' : ''}`;
  }

  // ── Filter entries helper ──
  function getFilteredEntries() {
    let filtered = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (currentFilter === 'pinned') {
      filtered = filtered.filter(e => e.pinned);
    } else if (currentFilter !== 'all') {
      filtered = filtered.filter(e => e.mood === currentFilter);
    }

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

  // ── Render entry list ──
  function renderEntries() {
    const filtered = getFilteredEntries();

    if (filtered.length === 0) {
      const msg = searchQuery
        ? 'No entries match your search.'
        : selectedCalDate
          ? 'No entries on this day.'
          : currentFilter === 'all'
            ? 'No entries yet. Tap + to start writing!'
            : 'No entries match this filter.';
      entriesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>${msg}</p>
        </div>`;
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Calendar ──
  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    calMonthYear.textContent = `${monthNames[month]} ${year}`;

    const entryDays = new Set();
    entries.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        entryDays.add(d.getDate());
      }
    });

    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    let html = '';

    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrev - firstDay + 1 + i;
      html += `<div class="cal-day other-month">${day}</div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const hasEntry = entryDays.has(day);
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      const isSelected = selectedCalDate &&
                         selectedCalDate.getFullYear() === year &&
                         selectedCalDate.getMonth() === month &&
                         selectedCalDate.getDate() === day;

      let cls = 'cal-day';
      if (hasEntry) cls += ' has-entry';
      if (isToday) cls += ' today';
      if (isSelected) cls += ' selected';

      html += `<div class="${cls}" data-day="${day}">${day}${hasEntry ? '<div class="cal-dot"></div>' : ''}</div>`;
    }

    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="cal-day other-month">${i}</div>`;
    }

    calDays.innerHTML = html;
  }

  // ── Navigation ──
  function isMobile() {
    return window.innerWidth < 768;
  }

  function showHome() {
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
  }

  function showView(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    currentEntryId = id;
    editingEntryId = null;

    viewMood.textContent = entry.mood;
    viewDate.textContent = formatDate(entry.date);
    viewTitle.textContent = entry.title || '';
    viewTitle.classList.toggle('hidden', !entry.title);
    viewText.textContent = entry.text;
    viewPin.textContent = entry.pinned ? '★' : '☆';
    viewPin.classList.toggle('pinned', !!entry.pinned);

    detailEmpty.classList.add('hidden');
    writeEntry.classList.add('hidden');
    viewEntry.classList.remove('hidden');

    if (isMobile()) {
      sidebar.classList.remove('active');
      detailPanel.classList.add('active');
    }

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
    writeEntry.classList.remove('hidden');

    if (isMobile()) {
      sidebar.classList.remove('active');
      detailPanel.classList.add('active');
    }

    entryTitle.focus();
  }

  // ── Export / Import ──
  function exportBackup() {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `lifeboard-journal-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported successfully');
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          showToast('Invalid backup file');
          return;
        }
        const existingIds = new Set(entries.map(en => en.id));
        let added = 0;
        imported.forEach(entry => {
          if (entry.id && !existingIds.has(entry.id)) {
            entries.push(entry);
            existingIds.add(entry.id);
            added++;
          }
        });
        saveEntries();
        renderStreak();
        renderEntries();
        if (currentView === 'calendar') renderCalendar();
        showToast(`${added} entr${added === 1 ? 'y' : 'ies'} imported`);
      } catch {
        showToast('Failed to read backup file');
      }
    };
    reader.readAsText(file);
  }

  // ── Event Handlers ──

  // Theme toggle
  themeBtn.addEventListener('click', toggleTheme);

  // Settings menu
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    settingsDropdown.classList.add('hidden');
  });

  settingsDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    const action = item.dataset.action;
    settingsDropdown.classList.add('hidden');

    if (action === 'export') {
      exportBackup();
    } else if (action === 'import') {
      importFile.click();
    } else if (action === 'delete-all') {
      deleteMode = 'all-first';
      modalText.textContent = 'Are you sure you want to delete ALL entries?';
      modalConfirm.textContent = 'Delete All';
      deleteModal.classList.remove('hidden');
    }
  });

  importFile.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importBackup(e.target.files[0]);
      e.target.value = '';
    }
  });

  // FAB
  $('#fab').addEventListener('click', () => showWrite());

  // Mood selection
  moodGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.mood-option');
    if (!btn) return;
    moodGrid.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
    moodError.classList.add('hidden');
  });

  // Word count
  entryText.addEventListener('input', updateWordCount);

  // Prompt
  promptBtn.addEventListener('click', () => {
    let idx;
    do {
      idx = Math.floor(Math.random() * PROMPTS.length);
    } while (idx === lastPromptIndex && PROMPTS.length > 1);
    lastPromptIndex = idx;
    promptText.textContent = PROMPTS[idx];
    promptText.classList.remove('hidden');
  });

  // Save
  $('#btn-save').addEventListener('click', () => {
    if (!selectedMood) {
      moodError.classList.remove('hidden');
      return;
    }

    const title = entryTitle.value.trim();
    const text = entryText.value.trim();

    if (editingEntryId) {
      const entry = entries.find(e => e.id === editingEntryId);
      if (entry) {
        entry.title = title;
        entry.mood = selectedMood;
        entry.text = text;
      }
      saveEntries();
      renderStreak();
      renderEntries();
      if (currentView === 'calendar') renderCalendar();
      showView(editingEntryId);
    } else {
      const newEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title,
        mood: selectedMood,
        text,
        date: new Date().toISOString(),
        pinned: false
      };
      entries.push(newEntry);
      saveEntries();
      renderStreak();
      renderEntries();
      if (currentView === 'calendar') renderCalendar();
      showView(newEntry.id);
    }
  });

  // Edit
  $('#btn-edit').addEventListener('click', () => {
    if (currentEntryId) showWrite(currentEntryId);
  });

  // Pin
  viewPin.addEventListener('click', () => {
    const entry = entries.find(e => e.id === currentEntryId);
    if (!entry) return;
    entry.pinned = !entry.pinned;
    saveEntries();
    viewPin.textContent = entry.pinned ? '★' : '☆';
    viewPin.classList.toggle('pinned', entry.pinned);
    renderEntries();
  });

  // Delete (single entry)
  $('#btn-delete').addEventListener('click', () => {
    deleteMode = 'single';
    modalText.textContent = 'Are you sure you want to delete this entry?';
    modalConfirm.textContent = 'Delete';
    deleteModal.classList.remove('hidden');
  });

  $('#modal-cancel').addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    deleteMode = 'single';
  });

  modalConfirm.addEventListener('click', () => {
    if (deleteMode === 'single') {
      entries = entries.filter(e => e.id !== currentEntryId);
      saveEntries();
      deleteModal.classList.add('hidden');
      renderStreak();
      if (currentView === 'calendar') renderCalendar();
      showHome();
    } else if (deleteMode === 'all-first') {
      deleteMode = 'all-confirm';
      modalText.textContent = 'This cannot be undone. Really delete all entries?';
      modalConfirm.textContent = 'Yes, delete everything';
    } else if (deleteMode === 'all-confirm') {
      entries = [];
      saveEntries();
      deleteModal.classList.add('hidden');
      deleteMode = 'single';
      renderStreak();
      if (currentView === 'calendar') renderCalendar();
      showHome();
      showToast('All entries deleted');
    }
  });

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      deleteModal.classList.add('hidden');
      deleteMode = 'single';
    }
  });

  // Entry card click
  entriesList.addEventListener('click', (e) => {
    const card = e.target.closest('.entry-card');
    if (!card) return;
    showView(card.dataset.id);
  });

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', showHome);
  });

  // Filter buttons
  document.querySelector('.filter-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    selectedCalDate = null;
    renderEntries();
    if (currentView === 'calendar') renderCalendar();
  });

  // Search
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    searchClear.classList.toggle('hidden', !searchQuery);
    renderEntries();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.add('hidden');
    renderEntries();
  });

  // View toggle (list / calendar)
  document.querySelector('.view-toggle').addEventListener('click', (e) => {
    const btn = e.target.closest('.view-toggle-btn');
    if (!btn) return;
    document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;

    if (currentView === 'calendar') {
      calendarView.classList.remove('hidden');
      selectedCalDate = null;
      renderCalendar();
    } else {
      calendarView.classList.add('hidden');
      selectedCalDate = null;
    }
    renderEntries();
  });

  // Calendar navigation
  $('#cal-prev').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    selectedCalDate = null;
    renderCalendar();
    renderEntries();
  });

  $('#cal-next').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    selectedCalDate = null;
    renderCalendar();
    renderEntries();
  });

  // Calendar day click
  calDays.addEventListener('click', (e) => {
    const dayEl = e.target.closest('.cal-day:not(.other-month)');
    if (!dayEl) return;
    const day = parseInt(dayEl.dataset.day);
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    if (selectedCalDate &&
        selectedCalDate.getFullYear() === year &&
        selectedCalDate.getMonth() === month &&
        selectedCalDate.getDate() === day) {
      selectedCalDate = null;
    } else {
      selectedCalDate = new Date(year, month, day);
    }
    renderCalendar();
    renderEntries();
  });

  // ── Init ──
  loadTheme();
  loadEntries();
  renderStreak();
  renderEntries();
})();
